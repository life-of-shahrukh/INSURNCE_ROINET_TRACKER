BEGIN TRY
  BEGIN TRANSACTION;

  -- ── 1. Deduplicate Customer rows by mobile (keep oldest per mobile) ──────────
  -- Before adding a unique constraint we must remove any duplicates.
  -- The CTE assigns row-number 1 to the earliest record per mobile;
  -- all later duplicates (rn > 1) are deleted.
  WITH CTE AS (
    SELECT
      [id],
      ROW_NUMBER() OVER (PARTITION BY [mobile] ORDER BY [createdAt] ASC) AS rn
    FROM [Customer]
  )
  DELETE FROM CTE WHERE rn > 1;

  -- ── 2. Add unique index on Customer.mobile ────────────────────────────────────
  CREATE UNIQUE INDEX [Customer_mobile_key] ON [Customer]([mobile]);

  -- ── 3. Make Deal.pospId nullable ─────────────────────────────────────────────
  -- Must drop the existing FK, alter the column, then recreate the FK.
  ALTER TABLE [Deal] DROP CONSTRAINT [FK_Deal_Posp];
  ALTER TABLE [Deal] ALTER COLUMN [pospId] NVARCHAR(36) NULL;
  ALTER TABLE [Deal] ADD CONSTRAINT [FK_Deal_Posp]
    FOREIGN KEY ([pospId]) REFERENCES [Posp]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

  COMMIT;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK;
  THROW;
END CATCH;
