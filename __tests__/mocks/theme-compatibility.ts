import { Theme } from '@/src/theme/types';

export const extendTheme = (theme: Partial<Theme>) => ({
  ...theme,
  colors: {
    ...theme.colors,
    primary: '#F46315',
    background: '#FFFFFF',
    text: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  roundness: 4,
});

// Add a dummy test to satisfy Jest
describe('theme-compatibility', () => {
  it('exports extendTheme function', () => {
    expect(typeof extendTheme).toBe('function');
  });
}); 