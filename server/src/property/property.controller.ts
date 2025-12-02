import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpStatus,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
  Req,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import {
  PropertyService,
  CreatePropertyDto,
  UpdatePropertyDto,
  PropertyQueryParams,
} from './property.service';
import { multerConfig } from '../common/config/multer.config';

@Controller('property')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Get()
  async getAllProperties(@Query() queryParams: PropertyQueryParams) {
    try {
      const properties =
        await this.propertyService.getAllProperties(queryParams);
      return {
        status: HttpStatus.OK,
        message: 'Properties retrieved successfully',
        data: properties,
      };
    } catch (error) {
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }

  @Get(':id')
  async getPropertyById(@Param('id', ParseIntPipe) id: number) {
    try {
      const property = await this.propertyService.getPropertyById(id);
      return {
        status: HttpStatus.OK,
        message: 'Property retrieved successfully',
        data: property,
      };
    } catch (error) {
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }

  @Post()
  @UseInterceptors(FilesInterceptor('photos', 10, multerConfig))
  async createProperty(
    @Body() createPropertyDto: CreatePropertyDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    try {
      // Get manager cognitoId from authenticated user
      const managerCognitoId = req.user?.id;

      if (!managerCognitoId) {
        throw new Error('Manager authentication required');
      }

      const propertyData = {
        ...createPropertyDto,
        managerCognitoId,
      };

      const property = await this.propertyService.createProperty(
        propertyData,
        files,
      );
      return {
        status: HttpStatus.CREATED,
        message: 'Property created successfully',
        data: property,
      };
    } catch (error) {
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('photos', 10, multerConfig))
  async updateProperty(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    try {
      const property = await this.propertyService.updateProperty(
        id,
        updatePropertyDto,
        files,
      );
      return {
        status: HttpStatus.OK,
        message: 'Property updated successfully',
        data: property,
      };
    } catch (error) {
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }

  @Delete(':id')
  async deleteProperty(@Param('id', ParseIntPipe) id: number) {
    try {
      const property = await this.propertyService.deleteProperty(id);
      return {
        status: HttpStatus.OK,
        message: 'Property deleted successfully',
        data: property,
      };
    } catch (error) {
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }
}
