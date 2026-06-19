-- DistrictChain geo: carry the Cognitensor zone/region a district belongs to
-- (from the expanded ListDistrict payload) so the dashboard can filter and roll
-- up by zone and region, not just state/district/city.

IF COL_LENGTH('DistrictChain', 'zoneId') IS NULL
  ALTER TABLE [DistrictChain] ADD [zoneId] NVARCHAR(50) NULL;

IF COL_LENGTH('DistrictChain', 'zoneName') IS NULL
  ALTER TABLE [DistrictChain] ADD [zoneName] NVARCHAR(200) NULL;

IF COL_LENGTH('DistrictChain', 'regionId') IS NULL
  ALTER TABLE [DistrictChain] ADD [regionId] NVARCHAR(50) NULL;

IF COL_LENGTH('DistrictChain', 'regionName') IS NULL
  ALTER TABLE [DistrictChain] ADD [regionName] NVARCHAR(200) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'DistrictChain_zoneId_idx')
  CREATE NONCLUSTERED INDEX [DistrictChain_zoneId_idx] ON [DistrictChain]([zoneId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'DistrictChain_regionId_idx')
  CREATE NONCLUSTERED INDEX [DistrictChain_regionId_idx] ON [DistrictChain]([regionId]);
