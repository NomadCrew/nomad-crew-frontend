export interface Coordinate {
    latitude: number;
    longitude: number;
  }
  
  export interface PlaceDetailsResponse {
    addressComponents: string[];
    coordinate: Coordinate;
    formattedAddress: string;
    name: string;
    placeId: string;
  }
  
  export type PlaceDetailsWithFullText = PlaceDetailsResponse & { fullText: string };