import { Controller, Get, Post, Patch, Body, Param, Req, HttpStatus, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { ManagerService, CreateManagerDto, UpdateManagerDto } from './manager.service';
import { createUser } from '../common/utils/user.utils';

@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Get()
  getManagerDashboard(@Req() req: Request) {
    return {
      message: 'Welcome to manager dashboard',
      user: req.user,
    };
  }

  @Get(':cognitoId')
  async getManagerByCognitoId(
    @Param('cognitoId') cognitoId: string,
    @Body() createManagerDto?: CreateManagerDto,
  ) {
    try {
      const manager = await this.managerService.getManagerByCognitoId(cognitoId);
      return {
        status: HttpStatus.OK,
        message: 'Manager retrieved successfully',
        data: manager,
      };
    } catch (error) {
      // If manager not found and we have user data, create new manager
      if (error instanceof NotFoundException && createManagerDto) {
        const newManager = await createUser(
          cognitoId,
          'manager',
          createManagerDto,
        );
        return {
          status: HttpStatus.CREATED,
          message: 'Manager created successfully',
          data: newManager,
        };
      }
      
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }

  @Post()
  async createManager(@Body() createManagerDto: CreateManagerDto) {
    try {
      const manager = await this.managerService.createManager(createManagerDto);
      return {
        status: HttpStatus.CREATED,
        message: 'Manager created successfully',
        data: manager,
      };
    } catch (error) {
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }

  @Patch(':cognitoId')
  async updateManager(
    @Param('cognitoId') cognitoId: string,
    @Body() updateManagerDto: UpdateManagerDto,
  ) {
    try {
      const manager = await this.managerService.updateManager(cognitoId, updateManagerDto);
      return {
        status: HttpStatus.OK,
        message: 'Manager updated successfully',
        data: manager,
      };
    } catch (error) {
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }
}
