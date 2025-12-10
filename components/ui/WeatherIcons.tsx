import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning } from 'lucide-react-native';

export type WeatherCondition = 'clear' | 'cloudy' | 'rainy' | 'snowy' | 'stormy';

export type WeatherIconComponent =
  | typeof Sun
  | typeof Cloud
  | typeof CloudRain
  | typeof CloudSnow
  | typeof CloudLightning;

export const WeatherIcons: Record<WeatherCondition, WeatherIconComponent> = {
  clear: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  stormy: CloudLightning,
};
