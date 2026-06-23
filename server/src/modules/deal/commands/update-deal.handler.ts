import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UpdateDealCommand } from '../commands/update-deal.command';
import { DealRepository } from '../deal.repository';
import { DealStatusChangedEvent } from '../events/deal-status-changed.event';
import { DealStatus } from '../../../common/constants';
import { Deal } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { assertDealInScope } from '../../../common/auth/scope-assert.util';

@CommandHandler(UpdateDealCommand)
export class UpdateDealHandler implements ICommandHandler<UpdateDealCommand> {
  constructor(
    private readonly dealRepo: DealRepository,
    private readonly eventBus: EventBus,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: UpdateDealCommand): Promise<Deal> {
    await assertDealInScope(this.prisma, command.id, command.hierarchyScope);

    const before = await this.dealRepo.findById(command.id);
    if (!before) {
      throw new NotFoundException(`Deal with ID ${command.id} not found`);
    }

    const dto = { ...command.dto };
    const isConvertedDeal =
      !!before.policyNo?.trim() ||
      (await this.prisma.lead.findFirst({
        where: { convertedToDealId: command.id },
        select: { id: true },
      })) !== null;

    if (isConvertedDeal) {
      dto.status = DealStatus.D;
    }

    const updated = await this.dealRepo.update(command.id, dto);

    if (dto.status && dto.status !== before.status) {
      this.eventBus.publish(
        new DealStatusChangedEvent(
          updated.id,
          before.status as DealStatus,
          updated.status as DealStatus,
        ),
      );
    }

    return updated;
  }
}
