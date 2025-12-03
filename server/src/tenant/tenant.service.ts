import { Injectable, NotFoundException, InternalServerErrorException, ConflictException, Logger } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { wktToGeoJSON } from '@terraformer/wkt';
import { PrismaService } from '../common/prisma.service';

export interface CreateTenantDto {
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
}

export interface UpdateTenantDto {
  name?: string;
  email?: string;
  phoneNumber?: string;
}

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTenantByCognitoId(cognitoId: string): Promise<Tenant> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
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
      const tenant = await this.prisma.tenant.create({
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

  async updateTenant(cognitoId: string, data: UpdateTenantDto): Promise<Tenant> {
    try {
      // First check if tenant exists
      await this.getTenantByCognitoId(cognitoId);

      const tenant = await this.prisma.tenant.update({
        where: { cognitoId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email }),
          ...(data.phoneNumber && { phoneNumber: data.phoneNumber }),
        },
      });

      return tenant;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to update tenant with cognitoId ${cognitoId}`, error.stack);
      throw new InternalServerErrorException('Failed to update tenant');
    }
  }

  async getCurrentResidences(cognitoId: string): Promise<any[]> {
    try {
      const properties = await this.prisma.property.findMany({
        where: { tenants: { some: { cognitoId } } },
        include: {
          location: true,
        },
      });

      const residencesWithFormattedLocation = await Promise.all(
        properties.map(async (property) => {
          const coordinates: { coordinates: string }[] = await this.prisma.$queryRaw`
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

      return residencesWithFormattedLocation;
    } catch (error) {
      this.logger.error(`Failed to retrieve current residences for cognitoId ${cognitoId}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve current residences');
    }
  }

  async addFavoriteProperty(cognitoId: string, propertyId: number): Promise<Tenant> {
    try {
      // Check if property exists
      const property = await this.prisma.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        throw new NotFoundException(`Property with id ${propertyId} not found`);
      }

      const tenant = await this.prisma.tenant.findUnique({
        where: { cognitoId },
        include: { favorites: true },
      });

      if (!tenant) {
        throw new NotFoundException(`Tenant with cognitoId ${cognitoId} not found`);
      }

      const existingFavorites = tenant.favorites || [];

      if (existingFavorites.some((fav) => fav.id === propertyId)) {
        throw new ConflictException('Property already added as favorite');
      }

      const updatedTenant = await this.prisma.tenant.update({
        where: { cognitoId },
        data: {
          favorites: {
            connect: { id: propertyId },
          },
        },
        include: { favorites: true },
      });

      return updatedTenant;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(`Failed to add favorite property ${propertyId} for tenant ${cognitoId}`, error.stack);
      throw new InternalServerErrorException('Failed to add favorite property');
    }
  }

  async removeFavoriteProperty(cognitoId: string, propertyId: number): Promise<Tenant> {
    try {
      // Check if tenant exists
      const tenant = await this.prisma.tenant.findUnique({
        where: { cognitoId },
        include: { favorites: true },
      });

      if (!tenant) {
        throw new NotFoundException(`Tenant with cognitoId ${cognitoId} not found`);
      }

      // Check if property is in favorites
      const isFavorite = tenant.favorites?.some((fav) => fav.id === propertyId);
      if (!isFavorite) {
        // Return tenant as-is if property is not in favorites (idempotent operation)
        return tenant;
      }

      const updatedTenant = await this.prisma.tenant.update({
        where: { cognitoId },
        data: {
          favorites: {
            disconnect: { id: propertyId },
          },
        },
        include: { favorites: true },
      });

      return updatedTenant;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to remove favorite property ${propertyId} for tenant ${cognitoId}`, error.stack);
      throw new InternalServerErrorException('Failed to remove favorite property');
    }
  }
}
