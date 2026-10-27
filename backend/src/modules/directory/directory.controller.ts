import { Controller, Get, Query } from '@nestjs/common';
import { DirectoryQueryDto, FeaturedQueryDto } from './dto/directory-query.dto.js';
import { DirectoryService } from './directory.service.js';

// Central site: the public property directory. No sign-in needed.
@Controller('directory')
export class DirectoryController {
  constructor(private readonly directory: DirectoryService) {}

  // One page of property cards, with the total and per-type counts.
  // ?location&name&type (repeatable)&minRating&sort&page&pageSize
  @Get('properties')
  search(@Query() query: DirectoryQueryDto) {
    return this.directory.search(query);
  }

  // Featured placements, in rank order.
  @Get('featured')
  featured(@Query() query: FeaturedQueryDto) {
    return this.directory.featured(query.limit);
  }

  @Get('property-types')
  propertyTypes() {
    return this.directory.propertyTypes();
  }
}
