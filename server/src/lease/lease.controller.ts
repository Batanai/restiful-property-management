import {
  Controller,
  Get,
  Param,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { LeaseService } from './lease.service';

@Controller('leases')
export class LeaseController {
  constructor(private readonly leaseService: LeaseService) {}

  @Get()
  async getLeases() {
    try {
      const leases = await this.leaseService.getLeases();
      return {
        status: HttpStatus.OK,
        message: 'Leases retrieved successfully',
        data: leases,
      };
    } catch (error) {
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }

  @Get(':id/payments')
  async getLeasePayments(@Param('id', ParseIntPipe) id: number) {
    try {
      const payments = await this.leaseService.getLeasePayments(id);
      return {
        status: HttpStatus.OK,
        message: 'Lease payments retrieved successfully',
        data: payments,
      };
    } catch (error) {
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }
}
