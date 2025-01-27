import React from 'react';
import { WeatherIcons, WeatherCondition } from './WeatherIcons';

interface WeatherIconProps {
  condition?: WeatherCondition;
  fallback?: WeatherCondition;
}

export const WeatherIcon = ({
  condition,
  fallback = 'clear',
}: WeatherIconProps) => {

  const chosenCondition = condition || fallback;

  return <>{WeatherIcons[chosenCondition]}</>;
};