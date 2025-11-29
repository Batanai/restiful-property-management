import { Controller, Get, Post, Body, Param, Req, HttpStatus, HttpCode, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { TenantService, CreateTenantDto } from './tenant.service';
import { createUser } from '../common/utils/user.utils';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

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
}
