export type WeatherCondition = 
  | 'clear'
  | 'cloudy'
  | 'rainy'
  | 'snowy'
  | 'stormy';

export function mapWeatherCode(code: number): WeatherCondition {
  // https://open-meteo.com/en/docs#api_form
  const weatherMap: Record<number, WeatherCondition> = {
    0: 'clear',
    1: 'clear',
    2: 'cloudy',
    3: 'cloudy',
    45: 'cloudy',
    48: 'cloudy',
    51: 'rainy',
    53: 'rainy',
    55: 'rainy',
    56: 'rainy',
    57: 'rainy',
    61: 'rainy',
    63: 'rainy',
    65: 'rainy',
    66: 'rainy',
    67: 'rainy',
    71: 'snowy',
    73: 'snowy',
    75: 'snowy',
    77: 'snowy',
    80: 'rainy',
    81: 'rainy',
    82: 'rainy',
    85: 'snowy',
    86: 'snowy',
    95: 'stormy',
    96: 'stormy',
    99: 'stormy',
  };

  return weatherMap[code] || 'clear';
} 