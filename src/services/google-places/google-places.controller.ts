// src/controllers/google-places.controller.ts

import { Controller, Get, Query } from '@nestjs/common';
import { GooglePlacesService } from './google-places.service';

@Controller('google-places')
export class GooglePlacesController {
  constructor(private readonly googlePlacesService: GooglePlacesService) {}

  @Get('autocomplete')
  async autocomplete(@Query('input') input: string) {
    return this.googlePlacesService.autocompleteAddress(input);
  }

  @Get('details')
  async details(@Query('placeId') placeId: string) {
    return this.googlePlacesService.getPlaceDetails(placeId);
  }
}
