import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import {
  PrismaClient,
  Property,
  PropertyType,
  Amenity,
  Highlight,
  Location,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { wktToGeoJSON } from '@terraformer/wkt';
import { uploadFilesToS3 } from '../common/utils/s3.utils';
import { geocodeAddress } from '../common/utils/geocoding.utils';

const prisma = new PrismaClient();

export interface PropertyQueryParams {
  favoriteIds?: string;
  priceMin?: string;
  priceMax?: string;
  beds?: string;
  baths?: string;
  propertyType?: string;
  squareFeetMin?: string;
  squareFeetMax?: string;
  amenities?: string;
  availableFrom?: string;
  latitude?: string;
  longitude?: string;
}

export interface CreatePropertyDto {
  name: string;
  description: string;
  pricePerMonth: number | string;
  securityDeposit: number | string;
  applicationFee: number | string;
  amenities: Amenity[] | string;
  highlights: Highlight[] | string;
  isPetsAllowed: boolean | string;
  isParkingIncluded: boolean | string;
  beds: number | string;
  baths: number | string;
  squareFeet: number | string;
  propertyType: PropertyType;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  managerCognitoId?: string;
}

export interface UpdatePropertyDto {
  name?: string;
  description?: string;
  pricePerMonth?: number;
  securityDeposit?: number;
  applicationFee?: number;
  photoUrls?: string[];
  amenities?: Amenity[];
  highlights?: Highlight[];
  isPetsAllowed?: boolean;
  isParkingIncluded?: boolean;
  beds?: number;
  baths?: number;
  squareFeet?: number;
  propertyType?: PropertyType;
  locationId?: number;
  managerCognitoId?: string;
}

@Injectable()
export class PropertyService {
  private readonly logger = new Logger(PropertyService.name);

  async getAllProperties(queryParams?: PropertyQueryParams): Promise<any[]> {
    try {
      if (!queryParams || Object.keys(queryParams).length === 0) {
        // Simple query without filters
        const properties = await prisma.property.findMany({
          include: {
            location: true,
            manager: true,
            leases: true,
            applications: true,
          },
          orderBy: {
            postedDate: 'desc',
          },
        });
        return properties;
      }

      // Advanced filtering with raw SQL
      const {
        favoriteIds,
        priceMin,
        priceMax,
        beds,
        baths,
        propertyType,
        squareFeetMin,
        squareFeetMax,
        amenities,
        availableFrom,
        latitude,
        longitude,
      } = queryParams;

      let whereConditions: Prisma.Sql[] = [];

      if (favoriteIds) {
        const favoriteIdsArray = favoriteIds.split(',').map(Number);
        whereConditions.push(
          Prisma.sql`p.id IN (${Prisma.join(favoriteIdsArray)})`,
        );
      }

      if (priceMin) {
        whereConditions.push(
          Prisma.sql`p."pricePerMonth" >= ${Number(priceMin)}`,
        );
      }

      if (priceMax) {
        whereConditions.push(
          Prisma.sql`p."pricePerMonth" <= ${Number(priceMax)}`,
        );
      }

      if (beds && beds !== 'any') {
        whereConditions.push(Prisma.sql`p.beds >= ${Number(beds)}`);
      }

      if (baths && baths !== 'any') {
        whereConditions.push(Prisma.sql`p.baths >= ${Number(baths)}`);
      }

      if (squareFeetMin) {
        whereConditions.push(
          Prisma.sql`p."squareFeet" >= ${Number(squareFeetMin)}`,
        );
      }

      if (squareFeetMax) {
        whereConditions.push(
          Prisma.sql`p."squareFeet" <= ${Number(squareFeetMax)}`,
        );
      }

      if (propertyType && propertyType !== 'any') {
        whereConditions.push(
          Prisma.sql`p."propertyType" = ${propertyType}::"PropertyType"`,
        );
      }

      if (amenities && amenities !== 'any') {
        const amenitiesArray = amenities.split(',');
        whereConditions.push(Prisma.sql`p.amenities @> ${amenitiesArray}`);
      }

      if (availableFrom && availableFrom !== 'any') {
        const date = new Date(availableFrom);
        if (!isNaN(date.getTime())) {
          whereConditions.push(
            Prisma.sql`EXISTS (
              SELECT 1 FROM "Lease" l 
              WHERE l."propertyId" = p.id 
              AND l."startDate" <= ${date.toISOString()}
            )`,
          );
        }
      }

      if (latitude && longitude) {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const radiusInKilometers = 1000;
        const degrees = radiusInKilometers / 111; // Converts kilometers to degrees

        whereConditions.push(
          Prisma.sql`ST_DWithin(
            l.coordinates::geometry,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
            ${degrees}
          )`,
        );
      }

      const completeQuery = Prisma.sql`
        SELECT 
          p.*,
          json_build_object(
            'id', l.id,
            'address', l.address,
            'city', l.city,
            'state', l.state,
            'country', l.country,
            'postalCode', l."postalCode",
            'coordinates', json_build_object(
              'longitude', ST_X(l."coordinates"::geometry),
              'latitude', ST_Y(l."coordinates"::geometry)
            )
          ) as location
        FROM "Property" p
        JOIN "Location" l ON p."locationId" = l.id
        ${
          whereConditions.length > 0
            ? Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`
            : Prisma.empty
        }
        ORDER BY p."postedDate" DESC
      `;

      const properties = await prisma.$queryRaw(completeQuery);
      return properties as any[];
    } catch (error) {
      this.logger.error('Failed to fetch all properties', error.stack);
      throw new InternalServerErrorException('Failed to fetch properties');
    }
  }

  async getPropertyById(id: number): Promise<any> {
    try {
      const property = await prisma.property.findUnique({
        where: { id },
        include: {
          location: true,
          manager: true,
          leases: true,
          applications: true,
        },
      });

      if (!property) {
        throw new NotFoundException(`Property with id ${id} not found`);
      }

      // Extract coordinates from PostGIS geometry
      const coordinates: { coordinates: string }[] = await prisma.$queryRaw`
        SELECT ST_AsText(coordinates) as coordinates 
        FROM "Location" 
        WHERE id = ${property.location.id}
      `;

      const geoJSON: any = wktToGeoJSON(coordinates[0]?.coordinates || '');
      const longitude = geoJSON.coordinates[0];
      const latitude = geoJSON.coordinates[1];

      const propertyWithCoordinates = {
        ...property,
        location: {
          ...property.location,
          coordinates: {
            longitude,
            latitude,
          },
        },
      };

      return propertyWithCoordinates;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to fetch property with id ${id}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch property data');
    }
  }

  async createProperty(
    data: CreatePropertyDto,
    files?: Express.Multer.File[],
  ): Promise<Property> {
    try {
      if (!data.managerCognitoId) {
        throw new InternalServerErrorException('Manager ID is required');
      }

      // Upload photos to S3
      const photoUrls =
        files && files.length > 0 ? await uploadFilesToS3(files) : [];

      // Geocode the address
      const { longitude, latitude } = await geocodeAddress(
        data.address,
        data.city,
        data.country,
        data.postalCode,
      );

      // Create location with PostGIS coordinates
      const [location] = await prisma.$queryRaw<Location[]>`
        INSERT INTO "Location" (address, city, state, country, "postalCode", coordinates)
        VALUES (${data.address}, ${data.city}, ${data.state}, ${data.country}, ${data.postalCode}, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
        RETURNING id, address, city, state, country, "postalCode", ST_AsText(coordinates) as coordinates
      `;

      // Parse and convert data types from form data
      const amenities =
        typeof data.amenities === 'string'
          ? (data.amenities.split(',').filter((a) => a.trim()) as Amenity[])
          : data.amenities;

      const highlights =
        typeof data.highlights === 'string'
          ? (data.highlights.split(',').filter((h) => h.trim()) as Highlight[])
          : data.highlights;

      // Create property
      const newProperty = await prisma.property.create({
        data: {
          name: data.name,
          description: data.description,
          pricePerMonth:
            typeof data.pricePerMonth === 'string'
              ? parseFloat(data.pricePerMonth)
              : data.pricePerMonth,
          securityDeposit:
            typeof data.securityDeposit === 'string'
              ? parseFloat(data.securityDeposit)
              : data.securityDeposit,
          applicationFee:
            typeof data.applicationFee === 'string'
              ? parseFloat(data.applicationFee)
              : data.applicationFee,
          photoUrls,
          amenities,
          highlights,
          isPetsAllowed:
            data.isPetsAllowed === 'true' || data.isPetsAllowed === true,
          isParkingIncluded:
            data.isParkingIncluded === 'true' ||
            data.isParkingIncluded === true,
          beds: typeof data.beds === 'string' ? parseInt(data.beds) : data.beds,
          baths:
            typeof data.baths === 'string'
              ? parseFloat(data.baths)
              : data.baths,
          squareFeet:
            typeof data.squareFeet === 'string'
              ? parseInt(data.squareFeet)
              : data.squareFeet,
          propertyType: data.propertyType,
          locationId: location.id,
          managerCognitoId: data.managerCognitoId,
        },
        include: {
          location: true,
          manager: true,
        },
      });

      return newProperty;
    } catch (error) {
      // Handle foreign key constraint violations
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          this.logger.warn(
            `Foreign key constraint failed when creating property`,
          );
          throw new NotFoundException('Manager not found');
        }
      }

      this.logger.error('Failed to create property', error.stack);
      throw new InternalServerErrorException('Failed to create property');
    }
  }

  async updateProperty(
    id: number,
    data: UpdatePropertyDto,
    files?: Express.Multer.File[],
  ): Promise<Property> {
    try {
      // First check if property exists
      const existingProperty = await this.getPropertyById(id);

      // Upload new photos to S3 if provided
      let updatedPhotoUrls = existingProperty.photoUrls;
      if (files && files.length > 0) {
        const newPhotoUrls = await uploadFilesToS3(files);
        updatedPhotoUrls = [...existingProperty.photoUrls, ...newPhotoUrls];
      }

      const property = await prisma.property.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description && { description: data.description }),
          ...(data.pricePerMonth !== undefined && {
            pricePerMonth: data.pricePerMonth,
          }),
          ...(data.securityDeposit !== undefined && {
            securityDeposit: data.securityDeposit,
          }),
          ...(data.applicationFee !== undefined && {
            applicationFee: data.applicationFee,
          }),
          ...(files && files.length > 0 && { photoUrls: updatedPhotoUrls }),
          ...(data.amenities && { amenities: data.amenities }),
          ...(data.highlights && { highlights: data.highlights }),
          ...(data.isPetsAllowed !== undefined && {
            isPetsAllowed: data.isPetsAllowed,
          }),
          ...(data.isParkingIncluded !== undefined && {
            isParkingIncluded: data.isParkingIncluded,
          }),
          ...(data.beds !== undefined && { beds: data.beds }),
          ...(data.baths !== undefined && { baths: data.baths }),
          ...(data.squareFeet !== undefined && { squareFeet: data.squareFeet }),
          ...(data.propertyType && { propertyType: data.propertyType }),
          ...(data.locationId !== undefined && { locationId: data.locationId }),
        },
        include: {
          location: true,
          manager: true,
        },
      });

      return property;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Handle foreign key constraint violations
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          this.logger.warn(`Failed to update property with id ${id}`);
          throw new NotFoundException('Location or Manager not found');
        }
      }

      this.logger.error(`Failed to update property with id ${id}`, error.stack);
      throw new InternalServerErrorException('Failed to update property');
    }
  }

  async deleteProperty(id: number): Promise<Property> {
    try {
      // First check if property exists
      await this.getPropertyById(id);

      const property = await prisma.property.delete({
        where: { id },
      });

      return property;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Handle foreign key constraint violations (e.g., property has leases)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          this.logger.warn(
            `Cannot delete property ${id} due to existing references`,
          );
          throw new ConflictException(
            'Cannot delete property with existing leases or applications',
          );
        }
      }

      this.logger.error(`Failed to delete property with id ${id}`, error.stack);
      throw new InternalServerErrorException('Failed to delete property');
    }
  }
}
