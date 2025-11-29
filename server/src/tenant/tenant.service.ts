import { Injectable, NotFoundException, InternalServerErrorException, ConflictException, Logger } from '@nestjs/common';
import { PrismaClient, Tenant } from '@prisma/client';
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTenantDto {
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
}

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  async getTenantByCognitoId(cognitoId: string): Promise<Tenant> {
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { cognitoId },
        include: {
          properties: true,
          favorites: true,
          applications: {
            include: {
              property: true,
            },
          },
          leases: {
            include: {
              property: true,
              payments: true,
            },
          },
        },
      });

      if (!tenant) {
        throw new NotFoundException(`Tenant with cognitoId ${cognitoId} not found`);
      }

      return tenant;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to fetch tenant with cognitoId ${cognitoId}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch tenant data');
    }
  }

  async createTenant(data: CreateTenantDto): Promise<Tenant> {
    try {
      const tenant = await prisma.tenant.create({
        data: {
          cognitoId: data.cognitoId,
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
        },
      });

      return tenant;
    } catch (error) {
      // Handle unique constraint violation (duplicate cognitoId)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          this.logger.warn(`Attempt to create duplicate tenant with cognitoId: ${data.cognitoId}`);
          throw new ConflictException(`Tenant with cognitoId ${data.cognitoId} already exists`);
        }
      }

      this.logger.error(`Failed to create tenant with cognitoId ${data.cognitoId}`, error.stack);
      throw new InternalServerErrorException('Failed to create tenant');
    }
  }
}
