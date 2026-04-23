import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get('city-counts')
  getCityCounts() {
    return this.propertiesService.getCityCounts();
  }

  @Get()
  search(@Query() query: any) {
    return this.propertiesService.search({
      query: query.query,
      location: query.location,
      type: query.type,
      minPrice: query.minPrice ? Number(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? Number(query.maxPrice) : undefined,
      bedrooms: query.bedrooms ? Number(query.bedrooms) : undefined,
      latitude: query.latitude ? Number(query.latitude) : undefined,
      longitude: query.longitude ? Number(query.longitude) : undefined,
      radiusKm: query.radiusKm ? Number(query.radiusKm) : undefined,
      state: query.state,
      city: query.city,
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
    });
  }

  @Get('landlord/me')
  @UseGuards(JwtAuthGuard)
  getMyListings(@Request() req: any) {
    return this.propertiesService.findByLandlord(req.user.id);
  }

  /** Alias for agents — they are stored as landlordId when they create listings */
  @Get('agent/me')
  @UseGuards(JwtAuthGuard)
  getAgentListings(@Request() req: any) {
    return this.propertiesService.findByLandlord(req.user.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.propertiesService.findById(id, !!req.user);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() body: any) {
    return this.propertiesService.create(req.user.id, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.propertiesService.update(id, req.user.id, body);
  }

  @Patch(':id/rented')
  @UseGuards(JwtAuthGuard)
  markRented(@Param('id') id: string, @Request() req: any) {
    return this.propertiesService.markRented(id, req.user.id, req.user.role);
  }

  @Patch(':id/available')
  @UseGuards(JwtAuthGuard)
  markAvailable(@Param('id') id: string, @Request() req: any) {
    return this.propertiesService.markAvailable(id, req.user.id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.propertiesService.delete(id, req.user.id);
  }
}
