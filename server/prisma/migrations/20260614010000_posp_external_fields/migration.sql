-- Add externalId and gcdCode columns to Posp table.
-- These fields exist in schema.prisma but were omitted from the initial migration.
-- All DDL that references the new columns uses EXEC sp_executesql to defer
-- column-name validation until runtime (SQL Server validates static references at parse time).

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Posp') AND name = 'externalId')
  EXEC sp_executesql N'ALTER TABLE [Posp] ADD [externalId] NVARCHAR(50) NULL';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Posp') AND name = 'gcdCode')
  EXEC sp_executesql N'ALTER TABLE [Posp] ADD [gcdCode] NVARCHAR(100) NULL';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('Posp') AND name = 'Posp_externalId_key')
  EXEC sp_executesql N'CREATE UNIQUE INDEX [Posp_externalId_key] ON [Posp]([externalId]) WHERE [externalId] IS NOT NULL';
