import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GooglePlacesService } from './google-places.service';

@ApiTags('Google Places')
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
