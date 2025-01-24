import React from 'react';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning
} from 'lucide-react-native';

export type WeatherCondition =
  | 'clear'
  | 'cloudy'
  | 'rainy'
  | 'snowy'
  | 'stormy';

export const WeatherIcons: Record<WeatherCondition, React.JSX.Element> = {
  clear: <Sun size={24} color="#fff" />,
  cloudy: <Cloud size={24} color="#fff" />,
  rainy: <CloudRain size={24} color="#fff" />,
  snowy: <CloudSnow size={24} color="#fff" />,
  stormy: <CloudLightning size={24} color="#fff" />,
};