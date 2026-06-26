-- Add missing columns to Customer table
-- clientCode: human-readable CRM code (e.g. CLT-2026-00001)
ALTER TABLE [dbo].[Customer] ADD [clientCode] NVARCHAR(30) NULL;

-- mobileVerified: tracks OTP verification status
ALTER TABLE [dbo].[Customer] ADD [mobileVerified] BIT NOT NULL DEFAULT 0;

-- Unique filtered index on clientCode (allows multiple NULLs in SQL Server)
CREATE UNIQUE NONCLUSTERED INDEX [Customer_clientCode_key]
  ON [dbo].[Customer]([clientCode])
  WHERE [clientCode] IS NOT NULL;

-- Create OtpRequest table
CREATE TABLE [dbo].[OtpRequest] (
  [id]        NVARCHAR(36)  NOT NULL,
  [mobile]    NVARCHAR(20)  NOT NULL,
  [codeHash]  NVARCHAR(255) NOT NULL,
  [expiresAt] DATETIME2     NOT NULL,
  [used]      BIT           NOT NULL DEFAULT 0,
  [createdAt] DATETIME2     NOT NULL DEFAULT GETDATE(),
  CONSTRAINT [OtpRequest_pkey] PRIMARY KEY ([id])
);

CREATE INDEX [OtpRequest_mobile_idx] ON [dbo].[OtpRequest]([mobile]);

-- Create Sequence table (for clientCode / proposalCode counters)
CREATE TABLE [dbo].[Sequence] (
  [id]        NVARCHAR(50) NOT NULL,
  [year]      INT          NOT NULL,
  [lastValue] INT          NOT NULL DEFAULT 0,
  [updatedAt] DATETIME2    NOT NULL,
  CONSTRAINT [Sequence_pkey] PRIMARY KEY ([id])
);

CREATE UNIQUE INDEX [Sequence_id_year_key] ON [dbo].[Sequence]([id], [year]);
