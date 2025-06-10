import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AddressParse } from 'src/common/interfaces/index.interface';

@Injectable()
export class GooglePlacesService {
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY')!;
  }

  async autocompleteAddress(input: string) {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json`;
    const response = await axios.get(url, {
      params: {
        input,
        types: 'address',
        components: 'country:ar',
        key: this.apiKey,
      },
    });

    return response.data.predictions;
  }

  async getPlaceDetails(placeId: string): Promise<AddressParse> {
    const url = `https://maps.googleapis.com/maps/api/place/details/json`;
    const response = await axios.get(url, {
      params: {
        place_id: placeId,
        fields: 'formatted_address,address_components,geometry',
        key: this.apiKey,
      },
    });

    const result = response.data.result;

    const parsed = this.parseAddressComponents(result.address_components);

    return {
      ...parsed,
      formattedAddress: result.formatted_address,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
    };
  }

  private parseAddressComponents(
    components: any[],
  ): Omit<AddressParse, 'formattedAddress' | 'lat' | 'lng'> {
    const get = (type: string) =>
      components.find((c) => c.types.includes(type))?.long_name || '';

    return {
      street: get('route'),
      city: get('locality'),
      province: get('administrative_area_level_1'),
      postalCode: get('postal_code'),
    };
  }

  async getShippingQuote({
    zipCode = 'T4000',
    dimensions = '10x10x10,500',
  }: {
    zipCode: string;
    dimensions: string;
  }) {
    const response = await axios.get(
      'https://api.mercadolibre.com/sites/MLA/shipping_options',
      {
        params: {
          zip_code: zipCode,
          dimensions,
        },
        headers: {
          Authorization: `Bearer ${this.configService.get('MERCADOPAGO_ACCESS_TOKEN')}`,
        },
      },
    );

    return response.data.options;
  }
}
