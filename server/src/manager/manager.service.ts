import { Injectable, NotFoundException, InternalServerErrorException, ConflictException, Logger } from '@nestjs/common';
import { PrismaClient, Manager } from '@prisma/client';
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateManagerDto {
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
}

@Injectable()
export class ManagerService {
  private readonly logger = new Logger(ManagerService.name);

  async getManagerByCognitoId(cognitoId: string): Promise<Manager> {
    try {
      const manager = await prisma.manager.findUnique({
        where: { cognitoId },
        include: {
          managedProperties: {
            include: {
              location: true,
              leases: true,
              applications: true,
            },
          },
        },
      });

      if (!manager) {
        throw new NotFoundException(`Manager with cognitoId ${cognitoId} not found`);
      }

      return manager;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to fetch manager with cognitoId ${cognitoId}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch manager data');
    }
  }

  async createManager(data: CreateManagerDto): Promise<Manager> {
    try {
      const manager = await prisma.manager.create({
        data: {
          cognitoId: data.cognitoId,
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
        },
      });

      return manager;
    } catch (error) {
      // Handle unique constraint violation (duplicate cognitoId)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          this.logger.warn(`Attempt to create duplicate manager with cognitoId: ${data.cognitoId}`);
          throw new ConflictException(`Manager with cognitoId ${data.cognitoId} already exists`);
        }
      }

      this.logger.error(`Failed to create manager with cognitoId ${data.cognitoId}`, error.stack);
      throw new InternalServerErrorException('Failed to create manager');
    }
  }
}
