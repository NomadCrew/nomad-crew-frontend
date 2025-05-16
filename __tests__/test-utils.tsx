import React from 'react';
import { render as rtlRender } from '@testing-library/react-native';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { PaperProvider } from 'react-native-paper';
import { _createTheme } from '../src/theme/create-theme';
import { _extendTheme } from './mocks/theme-compatibility';

// Mock ThemeProvider to avoid loading delay
jest.mock('../src/theme/ThemeProvider', () => {
  const React = require('react');
  const { _createTheme } = require('../src/theme/create-theme');
  const { _extendTheme } = require('./mocks/theme-compatibility');
  const baseTheme = _createTheme({ isDark: false });
  const theme = _extendTheme(baseTheme);

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

      return (
        <ThemeContext.Provider value={value}>
          {children}
        </ThemeContext.Provider>
      );
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

function render(ui: React.ReactElement, { ...options } = {}) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider>
        <PaperProvider>
          {children}
        </PaperProvider>
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