export class DismissAnnouncementCommand {
  constructor(
    public readonly announcementId: string,
    public readonly userId: string,
  ) {}
}
