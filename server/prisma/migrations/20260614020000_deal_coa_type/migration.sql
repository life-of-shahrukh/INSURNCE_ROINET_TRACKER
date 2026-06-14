-- Add coaType + coaAmount to Deal.
-- coaType  : COA entry mode (PERCENT of premium | AMOUNT in rupees), default AMOUNT.
-- coaAmount: computed effective COA in rupees, used for aggregations.
-- DDL referencing the new columns uses EXEC sp_executesql so SQL Server defers
-- column-name validation until runtime (static references are validated at parse time).

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Deal') AND name = 'coaType')
  EXEC sp_executesql N'ALTER TABLE [Deal] ADD [coaType] NVARCHAR(10) NOT NULL CONSTRAINT [Deal_coaType_df] DEFAULT ''AMOUNT''';

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Deal') AND name = 'coaAmount')
  EXEC sp_executesql N'ALTER TABLE [Deal] ADD [coaAmount] FLOAT(53) NOT NULL CONSTRAINT [Deal_coaAmount_df] DEFAULT 0';

-- Backfill: existing rows were entered as AMOUNT, so effective COA == raw coa.
EXEC sp_executesql N'UPDATE [Deal] SET [coaAmount] = [coa] WHERE [coaAmount] = 0 AND [coa] <> 0';
