-- Add proposalCode to Lead table
-- Auto-generated proposal code: PROP-YYYY-NNNNN (populated when status → PROPOSAL_SENT)
ALTER TABLE [dbo].[Lead] ADD [proposalCode] NVARCHAR(30) NULL;

-- SQL Server: filtered unique index so multiple NULLs are allowed
CREATE UNIQUE NONCLUSTERED INDEX [Lead_proposalCode_key]
ON [dbo].[Lead]([proposalCode])
WHERE [proposalCode] IS NOT NULL;
