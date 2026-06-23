import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { DeleteDealCommand } from '../commands/delete-deal.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { assertDealInScope } from '../../../common/auth/scope-assert.util';

@CommandHandler(DeleteDealCommand)
export class DeleteDealHandler implements ICommandHandler<DeleteDealCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteDealCommand): Promise<void> {
    await assertDealInScope(this.prisma, command.id, command.hierarchyScope);

    const deal = await this.prisma.deal.findUnique({
      where: { id: command.id },
      select: { id: true, pospId: true },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID ${command.id} not found`);
    }

    if (command.pospId && deal.pospId !== command.pospId) {
      throw new NotFoundException(`Deal with ID ${command.id} not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.lead.updateMany({
        where: { convertedToDealId: command.id },
        data: {
          convertedToDealId: null,
          convertedAt: null,
          status: 'QUALIFIED',
        },
      });

      const result = command.pospId
        ? await tx.deal.deleteMany({
            where: { id: command.id, pospId: command.pospId },
          })
        : await tx.deal.deleteMany({ where: { id: command.id } });

      if (result.count === 0) {
        throw new NotFoundException(`Deal with ID ${command.id} not found`);
      }
    });
  }
}
