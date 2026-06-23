-- Add heatStatus if missing
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID(N'[dbo].[Lead]') AND name = 'heatStatus'
)
BEGIN
  ALTER TABLE [dbo].[Lead] ADD [heatStatus] NVARCHAR(1) NULL;
END

-- Add pospId if missing
IF NOT EXISTS (
  SELECT 1 FROM sys.columns
  WHERE object_id = OBJECT_ID(N'[dbo].[Lead]') AND name = 'pospId'
)
BEGIN
  ALTER TABLE [dbo].[Lead] ADD [pospId] NVARCHAR(36) NULL;
END

-- FK Lead.pospId -> Posp.id
IF NOT EXISTS (
  SELECT 1 FROM sys.foreign_keys WHERE name = 'Lead_pospId_fkey'
)
BEGIN
  ALTER TABLE [dbo].[Lead] ADD CONSTRAINT [Lead_pospId_fkey]
    FOREIGN KEY ([pospId]) REFERENCES [dbo].[Posp]([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;
END

-- FK Lead.convertedToDealId -> Deal.id
IF NOT EXISTS (
  SELECT 1 FROM sys.foreign_keys WHERE name = 'Lead_convertedToDealId_fkey'
)
BEGIN
  ALTER TABLE [dbo].[Lead] ADD CONSTRAINT [Lead_convertedToDealId_fkey]
    FOREIGN KEY ([convertedToDealId]) REFERENCES [dbo].[Deal]([id])
    ON DELETE NO ACTION ON UPDATE NO ACTION;
END
