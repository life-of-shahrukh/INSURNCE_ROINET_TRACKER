-- Org graph: replace the fixed-role DistrictHierarchy with a generic,
-- variable-depth org graph (node + edge + closure) plus a district bridge.
-- Rebuilt weekly by OrgSyncService (truncate + reinsert).

-- Drop the old fixed-role table (superseded by OrgMember/OrgEdge/OrgClosure/DistrictChain).
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DistrictHierarchy')
  DROP TABLE [DistrictHierarchy];

-- OrgMember — one row per distinct person, keyed by Cognitensor UserId.
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'OrgMember')
BEGIN
  CREATE TABLE [OrgMember] (
    [id]        NVARCHAR(36)  NOT NULL CONSTRAINT PK_OrgMember PRIMARY KEY,
    [userId]    NVARCHAR(50)  NOT NULL,
    [userCode]  NVARCHAR(100) NOT NULL,
    [userName]  NVARCHAR(200) NULL,
    [userType]  INT           NULL,
    [role]      NVARCHAR(20)  NOT NULL,
    [createdAt] DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    [updatedAt] DATETIME2     NOT NULL DEFAULT GETUTCDATE()
  );

  CREATE UNIQUE INDEX [OrgMember_userId_key] ON [OrgMember]([userId]);
  CREATE NONCLUSTERED INDEX [OrgMember_userCode_idx] ON [OrgMember]([userCode]);
  CREATE NONCLUSTERED INDEX [OrgMember_role_idx]     ON [OrgMember]([role]);
END

-- OrgEdge — adjacency list: memberId reports to managerId.
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'OrgEdge')
BEGIN
  CREATE TABLE [OrgEdge] (
    [id]        NVARCHAR(36) NOT NULL CONSTRAINT PK_OrgEdge PRIMARY KEY,
    [memberId]  NVARCHAR(36) NOT NULL,
    [managerId] NVARCHAR(36) NOT NULL,
    [createdAt] DATETIME2    NOT NULL DEFAULT GETUTCDATE()
  );

  CREATE UNIQUE INDEX [OrgEdge_memberId_managerId_key] ON [OrgEdge]([memberId], [managerId]);
  CREATE NONCLUSTERED INDEX [OrgEdge_managerId_idx] ON [OrgEdge]([managerId]);
  CREATE NONCLUSTERED INDEX [OrgEdge_memberId_idx]  ON [OrgEdge]([memberId]);
END

-- OrgClosure — transitive closure of OrgEdge (ancestor -> descendant + depth).
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'OrgClosure')
BEGIN
  CREATE TABLE [OrgClosure] (
    [id]           NVARCHAR(36) NOT NULL CONSTRAINT PK_OrgClosure PRIMARY KEY,
    [ancestorId]   NVARCHAR(36) NOT NULL,
    [descendantId] NVARCHAR(36) NOT NULL,
    [depth]        INT          NOT NULL,
    [createdAt]    DATETIME2    NOT NULL DEFAULT GETUTCDATE()
  );

  CREATE UNIQUE INDEX [OrgClosure_ancestorId_descendantId_key] ON [OrgClosure]([ancestorId], [descendantId]);
  CREATE NONCLUSTERED INDEX [OrgClosure_ancestorId_idx]   ON [OrgClosure]([ancestorId]);
  CREATE NONCLUSTERED INDEX [OrgClosure_descendantId_idx] ON [OrgClosure]([descendantId]);
END

-- DistrictChain — bridge from members to the districts they cover.
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'DistrictChain')
BEGIN
  CREATE TABLE [DistrictChain] (
    [id]           NVARCHAR(36)  NOT NULL CONSTRAINT PK_DistrictChain PRIMARY KEY,
    [districtId]   NVARCHAR(50)  NOT NULL,
    [districtName] NVARCHAR(200) NULL,
    [stateId]      NVARCHAR(50)  NULL,
    [memberId]     NVARCHAR(36)  NOT NULL,
    [chainLevel]   INT           NOT NULL,
    [createdAt]    DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    [updatedAt]    DATETIME2     NOT NULL DEFAULT GETUTCDATE()
  );

  CREATE UNIQUE INDEX [DistrictChain_districtId_memberId_key] ON [DistrictChain]([districtId], [memberId]);
  CREATE NONCLUSTERED INDEX [DistrictChain_memberId_idx]   ON [DistrictChain]([memberId]);
  CREATE NONCLUSTERED INDEX [DistrictChain_districtId_idx] ON [DistrictChain]([districtId]);
  CREATE NONCLUSTERED INDEX [DistrictChain_stateId_idx]    ON [DistrictChain]([stateId]);
END
