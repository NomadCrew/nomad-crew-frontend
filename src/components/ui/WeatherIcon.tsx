import React from 'react';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning
} from 'lucide-react-native';
import { WeatherCondition } from '@/src/utils/weather';

type WeatherIconComponent = typeof Sun | typeof Cloud | typeof CloudRain | typeof CloudSnow | typeof CloudLightning;

const WeatherIcons: Record<WeatherCondition, WeatherIconComponent> = {
  clear: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudSnow,
  stormy: CloudLightning,
};

interface WeatherIconProps {
  condition?: WeatherCondition;
  fallback?: WeatherCondition;
  size?: number;
  color?: string;
}

export const WeatherIcon = ({
  condition,
  fallback = 'clear',
  size = 24,
  color = 'white'
}: WeatherIconProps) => {
  const chosenCondition = condition || fallback;
  const IconComponent = WeatherIcons[chosenCondition];

  return (
    <IconComponent size={size} color={color} />
  );
}; 