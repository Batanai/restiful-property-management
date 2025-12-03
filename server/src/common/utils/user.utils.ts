import { Logger } from '@nestjs/common';
import { Tenant, Manager } from '@prisma/client';
import { PrismaService } from '../prisma.service';

const logger = new Logger('UserUtils');

export type UserRole = 'tenant' | 'manager';

export interface CreateUserData {
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
}

/**
 * Creates a new user (tenant or manager) in the database
 * This function is called when a user is not found and needs to be created
 * @param cognitoId - The Cognito ID of the user
 * @param role - The role of the user ('tenant' or 'manager')
 * @param userData - User data to create the new user
 * @returns The newly created user (Tenant or Manager)
 */
export async function createUser(
  prisma: PrismaService,
  cognitoId: string,
  role: UserRole,
  userData: CreateUserData,
): Promise<Tenant | Manager> {
  try {
    logger.log(`Creating new ${role} with cognitoId: ${cognitoId}`);

    if (role === 'tenant') {
      const newTenant = await prisma.tenant.create({
        data: {
          cognitoId: userData.cognitoId,
          name: userData.name,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
        },
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
      logger.log(`New tenant created with cognitoId: ${cognitoId}`);
      return newTenant;
    } else {
      const newManager = await prisma.manager.create({
        data: {
          cognitoId: userData.cognitoId,
          name: userData.name,
          email: userData.email,
          phoneNumber: userData.phoneNumber,
        },
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
      logger.log(`New manager created with cognitoId: ${cognitoId}`);
      return newManager;
    }
  } catch (error) {
    logger.error(`Failed to get or create ${role} with cognitoId ${cognitoId}`, error.stack);
    throw error;
  }
}
