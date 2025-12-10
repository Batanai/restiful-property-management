import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    // Disable TLS certificate verification for self-signed certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ 
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
    const adapter = new PrismaPg(pool);
    
    this.prisma = new PrismaClient({ adapter });
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  // Expose PrismaClient methods
  get tenant() {
    return this.prisma.tenant;
  }

  get manager() {
    return this.prisma.manager;
  }

  get property() {
    return this.prisma.property;
  }

  get location() {
    return this.prisma.location;
  }

  get application() {
    return this.prisma.application;
  }

  get lease() {
    return this.prisma.lease;
  }

  get payment() {
    return this.prisma.payment;
  }

  get $queryRaw() {
    return this.prisma.$queryRaw.bind(this.prisma);
  }

  get $transaction() {
    return this.prisma.$transaction.bind(this.prisma);
  }
}
