/**
 * Color palette for the NomadCrew app using a carefully selected combination
 * of colors for both light and dark modes. Primary orange color (#F46315) 
 * represents energy and adventure, complemented by mint (#61C9A8) for freshness.
 */

const tintColorLight = '#F46315'; // Our primary orange
const tintColorDark = '#FF8A4D';  // Lighter orange for dark mode

export const Colors = {
  light: {
    text: '#2A2B2A',        // jet
    background: '#FFFAFB',  // snow
    tint: tintColorLight,   // orange
    icon: '#D3C0CD',        // thistle
    tabIconDefault: '#D3C0CD', // thistle
    tabIconSelected: tintColorLight, // orange
    accent: '#61C9A8',      // mint - adding this for accent elements
  },
  dark: {
    text: '#FFFAFB',        // snow
    background: '#2A2B2A',  // jet
    tint: tintColorDark,    // light orange
    icon: '#D3C0CD',        // thistle
    tabIconDefault: '#D3C0CD', // thistle
    tabIconSelected: tintColorDark, // light orange
    accent: '#61C9A8',      // mint - keeping same accent for consistency
  },
};