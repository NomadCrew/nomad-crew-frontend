export type WeatherCondition = 
  | 'clear'
  | 'cloudy'
  | 'rainy'
  | 'snowy'
  | 'stormy';

export function mapWeatherCode(code: number): WeatherCondition {
  // WMO codes https://open-meteo.com/en/docs
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

/**
 * Utility functions for weather related operations
 */

/**
 * Convert weather code to human-readable name
 * Based on WMO Weather interpretation codes (WW)
 * https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM
 * 
 * @param code - Weather code
 * @returns Human-readable weather description
 */
export function weatherCodeToName(code: number): string {
  // WMO Weather interpretation codes (WW)
  const weatherCodes: Record<number, string> = {
    0: 'Clear Sky',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    4: 'Foggy',
    5: 'Light Drizzle',
    6: 'Drizzle',
    7: 'Heavy Drizzle',
    8: 'Light Rain',
    9: 'Rain',
    10: 'Heavy Rain',
    11: 'Freezing Rain',
    12: 'Light Snow',
    13: 'Snow',
    14: 'Heavy Snow',
    15: 'Snow Showers',
    16: 'Sleet',
    17: 'Hail',
    18: 'Rain Shower',
    19: 'Thunderstorm',
    20: 'Thunderstorm with Hail',
    21: 'Light Thunderstorm',
    22: 'Heavy Thunderstorm',
    23: 'Storm',
    24: 'Severe Storm',
    25: 'Ice Pellets',
    26: 'Freezing Drizzle',
    27: 'Dust Storm',
    28: 'Smoke',
    29: 'Sand Storm',
    30: 'Dust',
    31: 'Sand',
    32: 'Ash',
    33: 'Squall',
    34: 'Tornado',
    35: 'Hurricane',
    36: 'Cold',
    37: 'Hot',
    38: 'Windy',
    39: 'Haze',
    
    // More detailed WMO codes
    45: 'Fog',
    48: 'Rime Fog',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Dense Drizzle',
    56: 'Freezing Drizzle',
    57: 'Heavy Freezing Drizzle',
    61: 'Light Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    66: 'Light Freezing Rain',
    67: 'Heavy Freezing Rain',
    71: 'Light Snow',
    73: 'Moderate Snow',
    75: 'Heavy Snow',
    77: 'Snow Grains',
    80: 'Light Rain Showers',
    81: 'Moderate Rain Showers',
    82: 'Heavy Rain Showers',
    85: 'Light Snow Showers',
    86: 'Heavy Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Thunderstorm with Heavy Hail'
  };
  
  return weatherCodes[code] || 'Unknown';
} 