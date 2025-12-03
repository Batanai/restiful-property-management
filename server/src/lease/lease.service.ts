import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Lease, Payment } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class LeaseService {
  private readonly logger = new Logger(LeaseService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getLeases(): Promise<Lease[]> {
    try {
      const leases = await this.prisma.lease.findMany({
        include: {
          tenant: true,
          property: true,
        },
      });

      return leases;
    } catch (error) {
      this.logger.error('Failed to fetch leases', error.stack);
      throw new InternalServerErrorException('Failed to fetch leases');
    }
  }

  async getLeasePayments(leaseId: number): Promise<Payment[]> {
    try {
      const payments = await this.prisma.payment.findMany({
        where: { leaseId },
      });

      return payments;
    } catch (error) {
      this.logger.error(
        `Failed to fetch payments for lease ${leaseId}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch lease payments');
    }
  }
}
