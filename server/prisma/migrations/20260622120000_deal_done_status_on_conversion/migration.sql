-- Converted deals (won leads with policy #) should always show status Done (D).
UPDATE [dbo].[Deal]
SET [status] = 'D'
WHERE [policyNo] <> ''
  AND [id] IN (
    SELECT [convertedToDealId]
    FROM [dbo].[Lead]
    WHERE [convertedToDealId] IS NOT NULL
  );
