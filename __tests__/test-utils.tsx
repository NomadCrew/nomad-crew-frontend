import React from 'react';
import { render as rtlRender } from '@testing-library/react-native';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { PaperProvider } from 'react-native-paper';
import { createTheme } from '../src/theme/create-theme';
import { extendTheme } from './mocks/theme-compatibility';

// Mock ThemeProvider to avoid loading delay
jest.mock('../src/theme/ThemeProvider', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  const { createTheme } = require('../src/theme/create-theme');
  const { extendTheme } = require('./mocks/theme-compatibility');
  const baseTheme = createTheme({ isDark: false });
  const theme = extendTheme(baseTheme);

  const ThemeContext = React.createContext(null);

  return {
    ThemeProvider: ({ children }: { children: React.ReactNode }) => {
      const value = {
        theme,
        mode: 'light',
        setMode: jest.fn(),
        toggleColorScheme: jest.fn(),
        isThemeLoaded: true,
      };

      return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
    },
    useTheme: () => ({
      theme,
      mode: 'light',
      setMode: jest.fn(),
      toggleColorScheme: jest.fn(),
      isThemeLoaded: true,
    }),
    ThemeContext,
  };
});

/**
 * Renders a React element wrapped with the mocked ThemeProvider and PaperProvider for tests.
 *
 * @param ui - The React element to render inside the test providers.
 * @param options - Optional render options forwarded to @testing-library/react-native's `render`.
 * @returns The result object returned by `@testing-library/react-native`'s `render` (query utilities and helpers).
 */
function render(ui: React.ReactElement, { ...options } = {}) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider>
        <PaperProvider>{children}</PaperProvider>
      </ThemeProvider>
    );
  }

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything
export * from '@testing-library/react-native';

// Override render method
export { render };

// Add a dummy test to satisfy Jest
describe('test-utils', () => {
  it('exports render function', () => {
    expect(typeof render).toBe('function');
  });
});