-- District-keyed management chain mirrored from Cognitensor ListHierarchyUserData.
-- One row per district; the source of truth for geographic hierarchy scoping.

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DistrictHierarchy')
BEGIN
  CREATE TABLE [DistrictHierarchy] (
    [id]           NVARCHAR(36)  NOT NULL CONSTRAINT PK_DistrictHierarchy PRIMARY KEY,
    [districtId]   NVARCHAR(50)  NOT NULL,
    [districtName] NVARCHAR(200) NULL,
    [stateId]      NVARCHAR(50)  NULL,
    [dmId]         NVARCHAR(50)  NULL,
    [dmCode]       NVARCHAR(100) NULL,
    [dmName]       NVARCHAR(200) NULL,
    [asmId]        NVARCHAR(50)  NULL,
    [asmCode]      NVARCHAR(100) NULL,
    [asmName]      NVARCHAR(200) NULL,
    [rhId]         NVARCHAR(50)  NULL,
    [rhCode]       NVARCHAR(100) NULL,
    [rhName]       NVARCHAR(200) NULL,
    [zhId]         NVARCHAR(50)  NULL,
    [zhCode]       NVARCHAR(100) NULL,
    [zhName]       NVARCHAR(200) NULL,
    [nhId]         NVARCHAR(50)  NULL,
    [nhCode]       NVARCHAR(100) NULL,
    [nhName]       NVARCHAR(200) NULL,
    [createdAt]    DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    [updatedAt]    DATETIME2     NOT NULL DEFAULT GETUTCDATE()
  );

  CREATE UNIQUE INDEX [DistrictHierarchy_districtId_key] ON [DistrictHierarchy]([districtId]);
  CREATE NONCLUSTERED INDEX [DistrictHierarchy_dmCode_idx]  ON [DistrictHierarchy]([dmCode]);
  CREATE NONCLUSTERED INDEX [DistrictHierarchy_asmCode_idx] ON [DistrictHierarchy]([asmCode]);
  CREATE NONCLUSTERED INDEX [DistrictHierarchy_rhCode_idx]  ON [DistrictHierarchy]([rhCode]);
  CREATE NONCLUSTERED INDEX [DistrictHierarchy_zhCode_idx]  ON [DistrictHierarchy]([zhCode]);
END
