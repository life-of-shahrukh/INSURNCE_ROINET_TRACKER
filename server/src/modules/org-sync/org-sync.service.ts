import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ExternalApiService } from '../../common/external-api/external-api.service';
import { GeoCatalogService } from '../geo/geo-catalog.service';
import type {
  ExternalHierarchyUser,
} from '../../common/external-api/external-api.types';
import {
  buildOrgGraph,
  type DistrictGeo,
} from '../../common/org-graph/org-graph-builder';
import {
  persistOrgGraph,
  type OrgGraphCounts,
} from '../../common/org-graph/org-graph.repository';

/** Prisma interactive-transaction budget for the full rebuild. */
const REBUILD_TX_OPTIONS = { maxWait: 15_000, timeout: 120_000 };

@Injectable()
export class OrgSyncService {
  private readonly logger = new Logger(OrgSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly externalApi: ExternalApiService,
    private readonly geoCatalog: GeoCatalogService,
  ) {}

  /** Weekly rebuild — Sunday 02:00 server time. */
  @Cron('0 2 * * 0', { name: 'org-graph-weekly-rebuild' })
  async scheduledRebuild(): Promise<void> {
    this.logger.log('Weekly org graph rebuild starting...');
    try {
      const counts = await this.rebuild();
      this.logger.log(
        `Weekly org graph rebuild done: members=${counts.members} edges=${counts.edges} closures=${counts.closures} districtChains=${counts.districtChains}`,
      );
    } catch (err) {
      this.logger.error(
        `Weekly org graph rebuild failed: ${err instanceof Error ? err.message : String(err)}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }

  /**
   * Rebuilds the entire org graph from Cognitensor data in one transaction.
   * Live API first, snapshot fallback so a rebuild never fails closed.
   */
  async rebuild(): Promise<OrgGraphCounts> {
    const hierarchy = await this.loadHierarchy();
    const geoByDistrict = await this.loadGeoByDistrict();

    const seed = buildOrgGraph(hierarchy, geoByDistrict);
    this.logger.log(
      `Built graph in memory: ${seed.members.length} members, ${seed.edges.length} edges, ${seed.closures.length} closure rows, ${seed.districtChains.length} district links`,
    );

    const counts = await this.prisma.$transaction(
      (tx) => persistOrgGraph(tx, seed),
      REBUILD_TX_OPTIONS,
    );

    // Geo reference data may have changed; drop the cached catalog so the next
    // read rebuilds from the freshly synced source.
    this.geoCatalog.refresh();

    return counts;
  }

  private async loadHierarchy(): Promise<ExternalHierarchyUser[]> {
    const rows = await this.externalApi.listHierarchy();
    this.logger.log(`Loaded ${rows.length} hierarchy rows`);
    return rows;
  }

  /**
   * districtId -> geography (state/zone/region) from ListDistrict.
   * Live is tried first by ExternalApiService; snapshot is the automatic fallback.
   */
  private async loadGeoByDistrict(): Promise<Map<string, DistrictGeo>> {
    const districts = await this.externalApi.listDistricts('');

    const map = new Map<string, DistrictGeo>();
    for (const d of districts) {
      map.set(d.DistrictId, {
        stateId: d.StateId ?? null,
        zoneId: d.zoneid ?? null,
        zoneName: d.zonename ?? null,
        regionId: d.regionid ?? null,
        regionName: d.regionname ?? null,
      });
    }
    return map;
  }
}
