import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Application, ApplicationStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateApplicationDto {
  applicationDate: string;
  status: ApplicationStatus;
  propertyId: number;
  tenantCognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
  message?: string;
}

export interface UpdateApplicationStatusDto {
  status: ApplicationStatus;
}

export interface ApplicationQueryParams {
  userId?: string;
  userType?: 'tenant' | 'manager';
}

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  async listApplications(queryParams: ApplicationQueryParams): Promise<any[]> {
    try {
      const { userId, userType } = queryParams;

      let whereClause = {};

      if (userId && userType) {
        if (userType === 'tenant') {
          whereClause = { tenantCognitoId: String(userId) };
        } else if (userType === 'manager') {
          whereClause = {
            property: {
              managerCognitoId: String(userId),
            },
          };
        }
      }

      const applications = await prisma.application.findMany({
        where: whereClause,
        include: {
          property: {
            include: {
              location: true,
              manager: true,
            },
          },
          tenant: true,
        },
      });

      const formattedApplications = await Promise.all(
        applications.map(async (app) => {
          const lease = await prisma.lease.findFirst({
            where: {
              tenant: {
                cognitoId: app.tenantCognitoId,
              },
              propertyId: app.propertyId,
            },
            orderBy: { startDate: 'desc' },
          });

          return {
            ...app,
            property: {
              ...app.property,
              address: app.property.location.address,
            },
            manager: app.property.manager,
            lease: lease
              ? {
                  ...lease,
                  nextPaymentDate: this.calculateNextPaymentDate(
                    lease.startDate,
                  ),
                }
              : null,
          };
        }),
      );

      return formattedApplications;
    } catch (error) {
      this.logger.error('Failed to retrieve applications', error.stack);
      throw new InternalServerErrorException('Failed to retrieve applications');
    }
  }

  async createApplication(data: CreateApplicationDto): Promise<Application> {
    try {
      const property = await prisma.property.findUnique({
        where: { id: data.propertyId },
        select: { pricePerMonth: true, securityDeposit: true },
      });

      if (!property) {
        throw new NotFoundException('Property not found');
      }

      const newApplication = await prisma.$transaction(async (prisma) => {
        // Create lease first
        const lease = await prisma.lease.create({
          data: {
            startDate: new Date(), // Today
            endDate: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1),
            ), // 1 year from today
            rent: property.pricePerMonth,
            deposit: property.securityDeposit,
            property: {
              connect: { id: data.propertyId },
            },
            tenant: {
              connect: { cognitoId: data.tenantCognitoId },
            },
          },
        });

        // Then create application with lease connection
        const application = await prisma.application.create({
          data: {
            applicationDate: new Date(data.applicationDate),
            status: data.status,
            name: data.name,
            email: data.email,
            phoneNumber: data.phoneNumber,
            message: data.message,
            property: {
              connect: { id: data.propertyId },
            },
            tenant: {
              connect: { cognitoId: data.tenantCognitoId },
            },
            lease: {
              connect: { id: lease.id },
            },
          },
          include: {
            property: true,
            tenant: true,
            lease: true,
          },
        });

        return application;
      });

      return newApplication;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error('Failed to create application', error.stack);
      throw new InternalServerErrorException('Failed to create application');
    }
  }

  async updateApplicationStatus(
    id: number,
    data: UpdateApplicationStatusDto,
  ): Promise<Application> {
    try {
      const { status } = data;

      const application = await prisma.application.findUnique({
        where: { id },
        include: {
          property: true,
          tenant: true,
        },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (status === 'Approved') {
        const newLease = await prisma.lease.create({
          data: {
            startDate: new Date(),
            endDate: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1),
            ),
            rent: application.property.pricePerMonth,
            deposit: application.property.securityDeposit,
            propertyId: application.propertyId,
            tenantCognitoId: application.tenantCognitoId,
          },
        });

        // Update the property to connect the tenant
        await prisma.property.update({
          where: { id: application.propertyId },
          data: {
            tenants: {
              connect: { cognitoId: application.tenantCognitoId },
            },
          },
        });

        // Update the application with the new lease ID
        await prisma.application.update({
          where: { id },
          data: { status, leaseId: newLease.id },
        });
      } else {
        // Update the application status (for both "Denied" and other statuses)
        await prisma.application.update({
          where: { id },
          data: { status },
        });
      }

      // Respond with the updated application details
      const updatedApplication = await prisma.application.findUnique({
        where: { id },
        include: {
          property: true,
          tenant: true,
          lease: true,
        },
      });

      if (!updatedApplication) {
        throw new NotFoundException('Application not found after update');
      }

      return updatedApplication;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to update application status for id ${id}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to update application status',
      );
    }
  }

  private calculateNextPaymentDate(startDate: Date): Date {
    const today = new Date();
    const nextPaymentDate = new Date(startDate);
    while (nextPaymentDate <= today) {
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    }
    return nextPaymentDate;
  }
}
