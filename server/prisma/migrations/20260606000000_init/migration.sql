BEGIN TRY
  BEGIN TRANSACTION;

  -- Posp
  CREATE TABLE [Posp] (
    [id]        NVARCHAR(36)  NOT NULL CONSTRAINT PK_Posp PRIMARY KEY,
    [name]      NVARCHAR(200) NOT NULL,
    [code]      NVARCHAR(50)  NOT NULL,
    [mobile]    NVARCHAR(20)  NOT NULL,
    [email]     NVARCHAR(200) NOT NULL,
    [joined]    DATETIME2     NOT NULL,
    [active]    BIT           NOT NULL DEFAULT 1,
    [createdAt] DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    [updatedAt] DATETIME2     NOT NULL DEFAULT GETUTCDATE()
  );
  CREATE UNIQUE INDEX [Posp_code_key]  ON [Posp]([code]);
  CREATE UNIQUE INDEX [Posp_email_key] ON [Posp]([email]);

  -- Deal
  CREATE TABLE [Deal] (
    [id]        NVARCHAR(36)  NOT NULL CONSTRAINT PK_Deal PRIMARY KEY,
    [pospId]    NVARCHAR(36)  NOT NULL,
    [customer]  NVARCHAR(200) NOT NULL,
    [policy]    NVARCHAR(100) NOT NULL,
    [sum]       FLOAT         NOT NULL,
    [premium]   FLOAT         NOT NULL,
    [coa]       FLOAT         NOT NULL,
    [margin]    FLOAT         NOT NULL,
    [status]    NVARCHAR(1)   NOT NULL,
    [expected]  DATETIME2     NOT NULL,
    [proposal]  NVARCHAR(100) NOT NULL,
    [policyNo]  NVARCHAR(100) NOT NULL DEFAULT '',
    [issued]    DATETIME2     NULL,
    [remarks]   NVARCHAR(500) NOT NULL DEFAULT '',
    [createdAt] DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    [updatedAt] DATETIME2     NOT NULL DEFAULT GETUTCDATE()
  );
  ALTER TABLE [Deal] ADD CONSTRAINT [FK_Deal_Posp]
    FOREIGN KEY ([pospId]) REFERENCES [Posp]([id]);

  -- User
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

  COMMIT;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK;
  THROW;
END CATCH;
