export class GetActiveAnnouncementsQuery {
  constructor(
    public readonly userRole: string,
    public readonly userId: string,
  ) {}
}
