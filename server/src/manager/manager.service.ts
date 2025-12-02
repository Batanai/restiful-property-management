import { Injectable, NotFoundException, InternalServerErrorException, ConflictException, Logger } from '@nestjs/common';
import { PrismaClient, Manager } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { wktToGeoJSON } from '@terraformer/wkt';

const prisma = new PrismaClient();

export interface CreateManagerDto {
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
}

export interface UpdateManagerDto {
  name?: string;
  email?: string;
  phoneNumber?: string;
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

  async updateManager(cognitoId: string, data: UpdateManagerDto): Promise<Manager> {
    try {
      // First check if manager exists
      await this.getManagerByCognitoId(cognitoId);

      const manager = await prisma.manager.update({
        where: { cognitoId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email }),
          ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
        },
      });

      return manager;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to update manager with cognitoId ${cognitoId}`, error.stack);
      throw new InternalServerErrorException('Failed to update manager');
    }
  }

  async getManagerProperties(cognitoId: string): Promise<any[]> {
    try {
      const properties = await prisma.property.findMany({
        where: { managerCognitoId: cognitoId },
        include: {
          location: true,
        },
      });

      const propertiesWithFormattedLocation = await Promise.all(
        properties.map(async (property) => {
          const coordinates: { coordinates: string }[] = await prisma.$queryRaw`
            SELECT ST_AsText(coordinates) as coordinates 
            FROM "Location" 
            WHERE id = ${property.location.id}
          `;

          const geoJSON: any = wktToGeoJSON(coordinates[0]?.coordinates || '');
          const longitude = geoJSON.coordinates[0];
          const latitude = geoJSON.coordinates[1];

          return {
            ...property,
            location: {
              ...property.location,
              coordinates: {
                longitude,
                latitude,
              },
            },
          };
        })
      );

      return propertiesWithFormattedLocation;
    } catch (error) {
      this.logger.error(`Failed to retrieve manager properties for cognitoId ${cognitoId}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve manager properties');
    }
  }
}
