import React from 'react';
import { WeatherIcons, WeatherCondition } from './WeatherIcons';

interface WeatherIconProps {
  condition?: WeatherCondition;
  fallback?: WeatherCondition;
  size?: number;
  color?: string;
}

/**
 * @atomic-level atom
 * @description Weather icon component that displays appropriate weather icons based on conditions
 * @composition Uses lucide-react-native icons
 * @example
 * ```tsx
 * <WeatherIcon condition="sunny" />
 * <WeatherIcon condition="rainy" size={32} color="#3B82F6" />
 * <WeatherIcon condition="cloudy" fallback="clear" />
 * ```
 */
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