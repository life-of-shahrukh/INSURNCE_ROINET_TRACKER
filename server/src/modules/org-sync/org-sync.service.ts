import { Injectable, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger } from 'winston';
import { PrismaService } from '../../prisma/prisma.service';
import { ExternalApiService } from '../../common/external-api/external-api.service';
import { GeoCatalogService } from '../geo/geo-catalog.service';
import type { ExternalHierarchyUser } from '../../common/external-api/external-api.types';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly externalApi: ExternalApiService,
    private readonly geoCatalog: GeoCatalogService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /** Weekly rebuild — Sunday 02:00 server time. */
  @Cron('0 2 * * 0', { name: 'org-graph-weekly-rebuild' })
  async scheduledRebuild(): Promise<void> {
    const start = Date.now();
    this.logger.info('Scheduled org graph rebuild starting', {
      context: 'OrgSyncService',
      trigger: 'cron',
    });
    try {
      const counts = await this.rebuild();
      this.logger.info('Scheduled org graph rebuild complete', {
        context: 'OrgSyncService',
        durationMs: Date.now() - start,
        ...counts,
      });
    } catch (err) {
      this.logger.error('Scheduled org graph rebuild failed', {
        context: 'OrgSyncService',
        durationMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
        trace: err instanceof Error ? err.stack : undefined,
      });
    }
  }

  /**
   * Rebuilds the entire org graph from Cognitensor data in one transaction.
   * Live API first, snapshot fallback so a rebuild never fails closed.
   */
  async rebuild(): Promise<OrgGraphCounts> {
    const t0 = Date.now();
    const hierarchy = await this.loadHierarchy();
    const geoByDistrict = await this.loadGeoByDistrict();

    const seed = buildOrgGraph(hierarchy, geoByDistrict);
    this.logger.info('Org graph built in memory', {
      context: 'OrgSyncService',
      members: seed.members.length,
      edges: seed.edges.length,
      closures: seed.closures.length,
      districtChains: seed.districtChains.length,
    });

    const counts = await this.prisma.$transaction(
      (tx) => persistOrgGraph(tx, seed),
      REBUILD_TX_OPTIONS,
    );

    this.logger.info('Org graph persisted to DB', {
      context: 'OrgSyncService',
      durationMs: Date.now() - t0,
      ...counts,
    });

    // Geo reference data may have changed; drop the cached catalog so the next
    // read rebuilds from the freshly synced source.
    this.geoCatalog.refresh();

    return counts;
  }

  private async loadHierarchy(): Promise<ExternalHierarchyUser[]> {
    const rows = await this.externalApi.listHierarchy();
    this.logger.info('Hierarchy rows loaded from Cognitensor', {
      context: 'OrgSyncService',
      count: rows.length,
    });
    return rows;
  }

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
    this.logger.info('Geo district map built', {
      context: 'OrgSyncService',
      districtCount: map.size,
    });
    return map;
  }
}
