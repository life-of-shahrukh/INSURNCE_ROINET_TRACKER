BEGIN TRY

-- CreateTable
CREATE TABLE [dbo].[PayoutGridConfig] (
    [id] NVARCHAR(36) NOT NULL,
    [scopeType] NVARCHAR(10) NOT NULL,
    [scopeValue] NVARCHAR(100) NOT NULL,
    [insurerSlug] NVARCHAR(50),
    [visible] BIT NOT NULL CONSTRAINT [PayoutGridConfig_visible_df] DEFAULT 1,
    [restrictions] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PayoutGridConfig_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [PayoutGridConfig_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE UNIQUE INDEX [PayoutGridConfig_scopeType_scopeValue_insurerSlug_key] ON [dbo].[PayoutGridConfig]([scopeType], [scopeValue], [insurerSlug]);

-- CreateIndex
CREATE INDEX [PayoutGridConfig_scopeType_scopeValue_idx] ON [dbo].[PayoutGridConfig]([scopeType], [scopeValue]);

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;
    THROW;
END CATCH
