export class DeleteDealCommand {
  constructor(
    public readonly id: string,
    public readonly pospId?: string,
  ) {}
}
