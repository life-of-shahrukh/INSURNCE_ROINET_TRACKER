BEGIN TRY
  BEGIN TRANSACTION;

  -- ── SalesTeam: add zone/region/area hierarchy territory fields ────────────────
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SalesTeam') AND name = 'zoneId')
    ALTER TABLE [SalesTeam] ADD [zoneId] NVARCHAR(50) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SalesTeam') AND name = 'zoneName')
    ALTER TABLE [SalesTeam] ADD [zoneName] NVARCHAR(100) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SalesTeam') AND name = 'regionId')
    ALTER TABLE [SalesTeam] ADD [regionId] NVARCHAR(50) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SalesTeam') AND name = 'regionName')
    ALTER TABLE [SalesTeam] ADD [regionName] NVARCHAR(100) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SalesTeam') AND name = 'areaId')
    ALTER TABLE [SalesTeam] ADD [areaId] NVARCHAR(50) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('SalesTeam') AND name = 'areaName')
    ALTER TABLE [SalesTeam] ADD [areaName] NVARCHAR(100) NULL;

  -- ── Posp: add hierarchy territory fields ─────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Posp') AND name = 'zoneId')
    ALTER TABLE [Posp] ADD [zoneId] NVARCHAR(50) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Posp') AND name = 'regionId')
    ALTER TABLE [Posp] ADD [regionId] NVARCHAR(50) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Posp') AND name = 'areaId')
    ALTER TABLE [Posp] ADD [areaId] NVARCHAR(50) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Posp') AND name = 'districtId')
    ALTER TABLE [Posp] ADD [districtId] NVARCHAR(50) NULL;

  -- ── Deal: add hierarchy + product classification fields ──────────────────────
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Deal') AND name = 'productLine')
    ALTER TABLE [Deal] ADD [productLine] NVARCHAR(50) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Deal') AND name = 'productSubType')
    ALTER TABLE [Deal] ADD [productSubType] NVARCHAR(100) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Deal') AND name = 'insurer')
    ALTER TABLE [Deal] ADD [insurer] NVARCHAR(100) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Deal') AND name = 'zoneId')
    ALTER TABLE [Deal] ADD [zoneId] NVARCHAR(50) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Deal') AND name = 'regionId')
    ALTER TABLE [Deal] ADD [regionId] NVARCHAR(50) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Deal') AND name = 'areaId')
    ALTER TABLE [Deal] ADD [areaId] NVARCHAR(50) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Deal') AND name = 'districtId')
    ALTER TABLE [Deal] ADD [districtId] NVARCHAR(50) NULL;

  -- ── Lead: add product classification + hierarchy fields ───────────────────────
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Lead') AND name = 'productSubType')
    ALTER TABLE [Lead] ADD [productSubType] NVARCHAR(100) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Lead') AND name = 'zoneId')
    ALTER TABLE [Lead] ADD [zoneId] NVARCHAR(50) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Lead') AND name = 'regionId')
    ALTER TABLE [Lead] ADD [regionId] NVARCHAR(50) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Lead') AND name = 'areaId')
    ALTER TABLE [Lead] ADD [areaId] NVARCHAR(50) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Lead') AND name = 'districtId')
    ALTER TABLE [Lead] ADD [districtId] NVARCHAR(50) NULL;

  -- ── Policy: add product classification fields ─────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Policy') AND name = 'productSubType')
    ALTER TABLE [Policy] ADD [productSubType] NVARCHAR(100) NULL;
  IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Policy') AND name = 'insurer')
    ALTER TABLE [Policy] ADD [insurer] NVARCHAR(100) NULL;

  -- ── Backfill: copy Deal hierarchy from POSP → ASM → SalesTeam chain ──────────
  -- For each deal, find its POSP's ASM's territory and populate the deal's hierarchy fields
  UPDATE d
  SET
    d.zoneId     = st.zoneId,
    d.regionId   = st.regionId,
    d.areaId     = st.areaId,
    d.districtId = p.districtId
  FROM [Deal] d
  INNER JOIN [Posp] p ON d.pospId = p.id
  INNER JOIN [SalesTeam] st ON p.asmId = st.id
  WHERE d.zoneId IS NULL;

  -- Backfill Lead hierarchy from their assignedTo SalesTeam member
  UPDATE l
  SET
    l.zoneId     = st.zoneId,
    l.regionId   = st.regionId,
    l.areaId     = st.areaId,
    l.districtId = st.districtId
  FROM [Lead] l
  INNER JOIN [SalesTeam] st ON l.assignedToId = st.id
  WHERE l.zoneId IS NULL;

  -- Backfill Posp hierarchy from their ASM's SalesTeam territory
  UPDATE p
  SET
    p.zoneId   = st.zoneId,
    p.regionId = st.regionId,
    p.areaId   = st.areaId
  FROM [Posp] p
  INNER JOIN [SalesTeam] st ON p.asmId = st.id
  WHERE p.zoneId IS NULL;

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  ROLLBACK TRANSACTION;
  THROW;
END CATCH;
