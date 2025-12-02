import axios from 'axios';

export interface GeocodingResult {
  longitude: number;
  latitude: number;
}

export const geocodeAddress = async (
  address: string,
  city: string,
  country: string,
  postalCode: string
): Promise<GeocodingResult> => {
  try {
    const geocodingUrl = `https://nominatim.openstreetmap.org/search?${new URLSearchParams(
      {
        street: address,
        city,
        country,
        postalcode: postalCode,
        format: 'json',
        limit: '1',
      }
    ).toString()}`;

    const geocodingResponse = await axios.get(geocodingUrl, {
      headers: {
        'User-Agent': 'RealEstateApp (justsomedummyemail@gmail.com)',
      },
    });

    const [longitude, latitude] =
      geocodingResponse.data[0]?.lon && geocodingResponse.data[0]?.lat
        ? [
            parseFloat(geocodingResponse.data[0]?.lon),
            parseFloat(geocodingResponse.data[0]?.lat),
          ]
        : [0, 0];

    return { longitude, latitude };
  } catch (error) {
    // Return default coordinates if geocoding fails
    return { longitude: 0, latitude: 0 };
  }
};
