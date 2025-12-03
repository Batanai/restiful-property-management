import { Controller, Get, Post, Put, Delete, Body, Param, Req, HttpStatus, HttpCode, NotFoundException, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { TenantService, CreateTenantDto, UpdateTenantDto } from './tenant.service';
import { createUser } from '../common/utils/user.utils';
import { PrismaService } from '../common/prisma.service';

@Controller('tenants')
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getTenantDashboard(@Req() req: Request) {
    return {
      message: 'Welcome to tenant dashboard',
      user: req.user,
    };
  }

  @Get(':cognitoId')
  async getTenantByCognitoId(
    @Param('cognitoId') cognitoId: string,
    @Body() createTenantDto?: CreateTenantDto,
  ) {
    try {
      const tenant = await this.tenantService.getTenantByCognitoId(cognitoId);
      return {
        status: HttpStatus.OK,
        message: 'Tenant retrieved successfully',
        data: tenant,
      };
    } catch (error) {
      // If tenant not found and we have user data, create new tenant
      if (error instanceof NotFoundException && createTenantDto) {
        const newTenant = await createUser(
          this.prisma,
          cognitoId,
          'tenant',
          createTenantDto,
        );
        return {
          status: HttpStatus.CREATED,
          message: 'Tenant created successfully',
          data: newTenant,
        };
      }
      
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }

  @Post()
  async createTenant(@Body() createTenantDto: CreateTenantDto) {
    try {
      const tenant = await this.tenantService.createTenant(createTenantDto);
      return {
        status: HttpStatus.CREATED,
        message: 'Tenant created successfully',
        data: tenant,
      };
    } catch (error) {
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }

  @Put(':cognitoId')
  async updateTenant(
    @Param('cognitoId') cognitoId: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    try {
      const tenant = await this.tenantService.updateTenant(cognitoId, updateTenantDto);
      return {
        status: HttpStatus.OK,
        message: 'Tenant updated successfully',
        data: tenant,
      };
    } catch (error) {
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }

  @Get(':cognitoId/current-residences')
  async getCurrentResidences(@Param('cognitoId') cognitoId: string) {
    try {
      const residences = await this.tenantService.getCurrentResidences(cognitoId);
      return {
        status: HttpStatus.OK,
        message: 'Current residences retrieved successfully',
        data: residences,
      };
    } catch (error) {
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }

  @Post(':cognitoId/favorites/:propertyId')
  async addFavoriteProperty(
    @Param('cognitoId') cognitoId: string,
    @Param('propertyId') propertyIdStr: string,
  ) {
    try {
      const propertyId = parseInt(propertyIdStr, 10);
      if (isNaN(propertyId)) {
        throw new BadRequestException(`Invalid propertyId: ${propertyIdStr}`);
      }

      const tenant = await this.tenantService.addFavoriteProperty(cognitoId, propertyId);
      return {
        status: HttpStatus.OK,
        message: 'Favorite property added successfully',
        data: tenant,
      };
    } catch (error) {
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }

  @Delete(':cognitoId/favorites/:propertyId')
  async removeFavoriteProperty(
    @Param('cognitoId') cognitoId: string,
    @Param('propertyId') propertyIdStr: string,
  ) {
    try {
      const propertyId = parseInt(propertyIdStr, 10);
      if (isNaN(propertyId)) {
        throw new BadRequestException(`Invalid propertyId: ${propertyIdStr}`);
      }

      const tenant = await this.tenantService.removeFavoriteProperty(cognitoId, propertyId);
      return {
        status: HttpStatus.OK,
        message: 'Favorite property removed successfully',
        data: tenant,
      };
    } catch (error) {
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }
}
