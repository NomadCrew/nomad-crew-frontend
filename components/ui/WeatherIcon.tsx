import React from 'react';
import { WeatherIcons, WeatherCondition } from './WeatherIcons';

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