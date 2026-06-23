-- SQL Server: unfiltered UNIQUE on nullable columns allows only ONE NULL row.
-- Replace with a filtered unique index so many open leads (convertedToDealId IS NULL) can coexist.

IF EXISTS (
  SELECT 1 FROM sys.key_constraints
  WHERE parent_object_id = OBJECT_ID(N'[dbo].[Lead]')
    AND name = N'Lead_convertedToDealId_key'
    AND type = 'UQ'
)
BEGIN
  ALTER TABLE [dbo].[Lead] DROP CONSTRAINT [Lead_convertedToDealId_key];
END

IF EXISTS (
  SELECT 1 FROM sys.indexes
  WHERE object_id = OBJECT_ID(N'[dbo].[Lead]')
    AND name = N'Lead_convertedToDealId_key'
)
BEGIN
  DROP INDEX [Lead_convertedToDealId_key] ON [dbo].[Lead];
END

CREATE UNIQUE NONCLUSTERED INDEX [Lead_convertedToDealId_key]
ON [dbo].[Lead]([convertedToDealId])
WHERE [convertedToDealId] IS NOT NULL;
