-- Add Cognitensor geography ID fields to Posp table.
-- stateId and cityId are synced from ListPospData on every SSO login.
ALTER TABLE [Posp] ADD [stateId] NVARCHAR(50);
ALTER TABLE [Posp] ADD [cityId]  NVARCHAR(50);
