import React from 'react';
import { Text } from 'react-native';
import { render } from './test-utils';

// Mock any dependencies that might cause issues
jest.mock('expo-router/entry');
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

describe('Basic Test Setup', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Text>Hello, NomadCrew!</Text>);
    expect(getByText('Hello, NomadCrew!')).toBeTruthy();
  });
}); 