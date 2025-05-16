/**
 * Color palette for the NomadCrew app using a carefully selected combination
 * of colors for both light and dark modes. Primary orange color (#F46315) 
 * represents energy and adventure, complemented by mint (#61C9A8) for freshness.
 */

const tintColorLight = '#F46315'; // Our primary orange
const tintColorDark = '#FF8A4D';  // Lighter orange for dark mode

export const Colors = {
  light: {
    text: '#1A1A1A',        // Darker gray for better readability
    background: '#FCFCFC',  // Slightly cooler white
    tint: tintColorLight,   // orange
    icon: '#6B7280',        // Medium gray
    tabIconDefault: '#A1A1AA',
    tabIconSelected: tintColorLight, // orange
    accent: '#2F855E',      // Darker mint for better contrast
  },
  dark: {
    text: '#F8FAFC',
    background: '#0F172A',  // Darker base for better contrast
    tint: tintColorDark,    // light orange
    icon: '#94A3B8',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorDark, // light orange
    accent: '#61C9A8',      // mint - keeping same accent for consistency
  },
};