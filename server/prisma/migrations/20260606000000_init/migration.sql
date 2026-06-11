BEGIN TRY
  BEGIN TRANSACTION;

  -- ── Customer ────────────────────────────────────────────────────────────────
  CREATE TABLE [Customer] (
    [id]              NVARCHAR(36)  NOT NULL CONSTRAINT PK_Customer PRIMARY KEY,
    [name]            NVARCHAR(200) NOT NULL,
    [email]           NVARCHAR(200) NULL,
    [mobile]          NVARCHAR(20)  NOT NULL,
    [alternateMobile] NVARCHAR(20)  NULL,
    [dateOfBirth]     DATETIME2     NULL,
    [panNumber]       NVARCHAR(20)  NULL,
    [aadharNumber]    NVARCHAR(20)  NULL,
    [stateId]         NVARCHAR(20)  NULL,
    [stateName]       NVARCHAR(100) NULL,
    [districtId]      NVARCHAR(20)  NULL,
    [districtName]    NVARCHAR(100) NULL,
    [cityId]          NVARCHAR(20)  NULL,
    [cityName]        NVARCHAR(100) NULL,
    [address]         NVARCHAR(500) NULL,
    [pincode]         NVARCHAR(10)  NULL,
    [kycStatus]       NVARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    [source]          NVARCHAR(50)  NULL,
    [createdAt]       DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    [updatedAt]       DATETIME2     NOT NULL DEFAULT GETUTCDATE()
  );

  -- ── Posp ─────────────────────────────────────────────────────────────────────
  CREATE TABLE [Posp] (
    [id]             NVARCHAR(36)  NOT NULL CONSTRAINT PK_Posp PRIMARY KEY,
    [name]           NVARCHAR(200) NOT NULL,
    [code]           NVARCHAR(50)  NOT NULL,
    [mobile]         NVARCHAR(20)  NOT NULL,
    [email]          NVARCHAR(200) NOT NULL,
    [joined]         DATETIME2     NOT NULL,
    [active]         BIT           NOT NULL DEFAULT 1,
    [lastBusinessAt] DATETIME2     NULL,
    [autoInactive]   BIT           NOT NULL DEFAULT 0,
    [region]         NVARCHAR(100) NULL,
    [asmId]          NVARCHAR(36)  NULL,
    [createdAt]      DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    [updatedAt]      DATETIME2     NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE UNIQUE INDEX [Posp_code_key]  ON [Posp]([code]);
  CREATE UNIQUE INDEX [Posp_email_key] ON [Posp]([email]);

  -- ── User ─────────────────────────────────────────────────────────────────────
  CREATE TABLE [User] (
    [id]           NVARCHAR(36)  NOT NULL CONSTRAINT PK_User PRIMARY KEY,
    [email]        NVARCHAR(200) NOT NULL,
    [passwordHash] NVARCHAR(255) NOT NULL,
    [role]         NVARCHAR(20)  NOT NULL,
    [status]       NVARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    [pospId]       NVARCHAR(36)  NULL,
    [createdAt]    DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    [updatedAt]    DATETIME2     NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE UNIQUE INDEX [User_email_key]  ON [User]([email]);
  CREATE UNIQUE INDEX [User_pospId_key] ON [User]([pospId]) WHERE [pospId] IS NOT NULL;
  ALTER TABLE [User] ADD CONSTRAINT [FK_User_Posp]
    FOREIGN KEY ([pospId]) REFERENCES [Posp]([id]);

  -- ── SalesTeam ────────────────────────────────────────────────────────────────
  CREATE TABLE [SalesTeam] (
    [id]           NVARCHAR(36)  NOT NULL CONSTRAINT PK_SalesTeam PRIMARY KEY,
    [userId]       NVARCHAR(36)  NOT NULL,
    [name]         NVARCHAR(200) NOT NULL,
    [employeeCode] NVARCHAR(50)  NOT NULL,
    [designation]  NVARCHAR(50)  NOT NULL,
    [managerId]    NVARCHAR(36)  NULL,
    [territory]    NVARCHAR(100) NULL,
    [mobile]       NVARCHAR(20)  NOT NULL,
    [email]        NVARCHAR(200) NOT NULL,
    [joiningDate]  DATETIME2     NOT NULL,
    [status]       NVARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    [createdAt]    DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    [updatedAt]    DATETIME2     NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE UNIQUE INDEX [SalesTeam_userId_key]       ON [SalesTeam]([userId]);
  CREATE UNIQUE INDEX [SalesTeam_employeeCode_key] ON [SalesTeam]([employeeCode]);
  ALTER TABLE [SalesTeam] ADD CONSTRAINT [FK_SalesTeam_User]
    FOREIGN KEY ([userId]) REFERENCES [User]([id]);
  ALTER TABLE [SalesTeam] ADD CONSTRAINT [FK_SalesTeam_Manager]
    FOREIGN KEY ([managerId]) REFERENCES [SalesTeam]([id]);

  -- FK: Posp → SalesTeam (ASM)
  ALTER TABLE [Posp] ADD CONSTRAINT [FK_Posp_SalesTeam_ASM]
    FOREIGN KEY ([asmId]) REFERENCES [SalesTeam]([id]);

  -- ── Deal ─────────────────────────────────────────────────────────────────────
  CREATE TABLE [Deal] (
    [id]           NVARCHAR(36)  NOT NULL CONSTRAINT PK_Deal PRIMARY KEY,
    [pospId]       NVARCHAR(36)  NOT NULL,
    [customerId]   NVARCHAR(36)  NULL,
    [customerName] NVARCHAR(200) NOT NULL DEFAULT '',
    [policy]       NVARCHAR(100) NOT NULL,
    [sum]          FLOAT         NOT NULL,
    [premium]      FLOAT         NOT NULL,
    [coa]          FLOAT         NOT NULL,
    [margin]       FLOAT         NOT NULL,
    [status]       NVARCHAR(1)   NOT NULL,
    [expected]     DATETIME2     NOT NULL,
    [proposal]     NVARCHAR(100) NOT NULL,
    [policyNo]     NVARCHAR(100) NOT NULL DEFAULT '',
    [issued]       DATETIME2     NULL,
    [remarks]      NVARCHAR(500) NOT NULL DEFAULT '',
    [createdAt]    DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    [updatedAt]    DATETIME2     NOT NULL DEFAULT GETUTCDATE()
  );
  ALTER TABLE [Deal] ADD CONSTRAINT [FK_Deal_Posp]
    FOREIGN KEY ([pospId]) REFERENCES [Posp]([id]);
  ALTER TABLE [Deal] ADD CONSTRAINT [FK_Deal_Customer]
    FOREIGN KEY ([customerId]) REFERENCES [Customer]([id]);

  -- ── Lead ─────────────────────────────────────────────────────────────────────
  CREATE TABLE [Lead] (
    [id]                NVARCHAR(36)  NOT NULL CONSTRAINT PK_Lead PRIMARY KEY,
    [customerId]        NVARCHAR(36)  NOT NULL,
    [assignedToId]      NVARCHAR(36)  NULL,
    [product]           NVARCHAR(100) NOT NULL,
    [estimatedPremium]  FLOAT         NOT NULL,
    [estimatedSum]      FLOAT         NULL,
    [closureTimeline]   NVARCHAR(20)  NOT NULL,
    [expectedCloseDate] DATETIME2     NULL,
    [status]            NVARCHAR(20)  NOT NULL DEFAULT 'NEW',
    [source]            NVARCHAR(50)  NULL,
    [remarks]           NVARCHAR(500) NULL,
    [convertedToDealId] NVARCHAR(36)  NULL,
    [convertedAt]       DATETIME2     NULL,
    [createdAt]         DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    [updatedAt]         DATETIME2     NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE UNIQUE INDEX [Lead_convertedToDealId_key] ON [Lead]([convertedToDealId])
    WHERE [convertedToDealId] IS NOT NULL;
  ALTER TABLE [Lead] ADD CONSTRAINT [FK_Lead_Customer]
    FOREIGN KEY ([customerId]) REFERENCES [Customer]([id]);
  ALTER TABLE [Lead] ADD CONSTRAINT [FK_Lead_SalesTeam]
    FOREIGN KEY ([assignedToId]) REFERENCES [SalesTeam]([id]);

  -- ── Policy ───────────────────────────────────────────────────────────────────
  CREATE TABLE [Policy] (
    [id]                 NVARCHAR(36)  NOT NULL CONSTRAINT PK_Policy PRIMARY KEY,
    [policyNumber]       NVARCHAR(100) NOT NULL,
    [customerId]         NVARCHAR(36)  NOT NULL,
    [product]            NVARCHAR(100) NOT NULL,
    [premium]            FLOAT         NOT NULL,
    [sumAssured]         FLOAT         NOT NULL,
    [issueDate]          DATETIME2     NOT NULL,
    [rewardPoints]       INT           NOT NULL DEFAULT 0,
    [paymentReleaseDate] DATETIME2     NULL,
    [paymentStatus]      NVARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    [sapSyncStatus]      NVARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    [sapSyncAt]          DATETIME2     NULL,
    [createdAt]          DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    [updatedAt]          DATETIME2     NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE UNIQUE INDEX [Policy_policyNumber_key] ON [Policy]([policyNumber]);
  ALTER TABLE [Policy] ADD CONSTRAINT [FK_Policy_Customer]
    FOREIGN KEY ([customerId]) REFERENCES [Customer]([id]);

  COMMIT;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK;
  THROW;
END CATCH;
