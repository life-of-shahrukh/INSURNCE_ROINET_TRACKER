BEGIN TRY
  BEGIN TRANSACTION;

  -- ── Announcement ──────────────────────────────────────────────────────────────
  CREATE TABLE [Announcement] (
    [id]          NVARCHAR(36)   NOT NULL CONSTRAINT PK_Announcement PRIMARY KEY,
    [title]       NVARCHAR(200)  NOT NULL,
    [content]     NVARCHAR(2000) NOT NULL,
    [targetRoles] NVARCHAR(200)  NOT NULL,
    [severity]    NVARCHAR(20)   NOT NULL DEFAULT 'info',
    [priority]    INT            NOT NULL DEFAULT 0,
    [isActive]    BIT            NOT NULL DEFAULT 1,
    [startsAt]    DATETIME2      NOT NULL,
    [expiresAt]   DATETIME2      NULL,
    [createdBy]   NVARCHAR(36)   NOT NULL,
    [createdAt]   DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
    [updatedAt]   DATETIME2      NOT NULL DEFAULT GETUTCDATE()
  );

  -- ── AnnouncementDismissal ─────────────────────────────────────────────────────
  CREATE TABLE [AnnouncementDismissal] (
    [id]             NVARCHAR(36) NOT NULL CONSTRAINT PK_AnnouncementDismissal PRIMARY KEY,
    [announcementId] NVARCHAR(36) NOT NULL,
    [userId]         NVARCHAR(36) NOT NULL,
    [dismissedAt]    DATETIME2    NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_AnnouncementDismissal_Announcement
      FOREIGN KEY ([announcementId])
      REFERENCES [Announcement]([id])
      ON DELETE CASCADE
  );

  CREATE UNIQUE INDEX [AnnouncementDismissal_announcementId_userId_key]
    ON [AnnouncementDismissal]([announcementId], [userId]);

  COMMIT TRAN;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRAN;
  THROW;
END CATCH;
