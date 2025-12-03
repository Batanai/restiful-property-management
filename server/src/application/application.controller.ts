import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApplicationService,
  CreateApplicationDto,
  UpdateApplicationStatusDto,
  ApplicationQueryParams,
} from './application.service';

@Controller('applications')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get()
  async listApplications(@Query() queryParams: ApplicationQueryParams) {
    try {
      const applications =
        await this.applicationService.listApplications(queryParams);
      return {
        status: HttpStatus.OK,
        message: 'Applications retrieved successfully',
        data: applications,
      };
    } catch (error) {
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }

  @Post()
  async createApplication(@Body() createApplicationDto: CreateApplicationDto) {
    try {
      const application =
        await this.applicationService.createApplication(createApplicationDto);
      return {
        status: HttpStatus.CREATED,
        message: 'Application created successfully',
        data: application,
      };
    } catch (error) {
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }

  @Put(':id/status')
  async updateApplicationStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateApplicationStatusDto,
  ) {
    try {
      const application =
        await this.applicationService.updateApplicationStatus(
          id,
          updateStatusDto,
        );
      return {
        status: HttpStatus.OK,
        message: 'Application status updated successfully',
        data: application,
      };
    } catch (error) {
      // Re-throw to let NestJS exception filter handle it
      throw error;
    }
  }
}
