import React from 'react';
import { render } from '../../__tests__/test-utils';
import { ThemedText } from '../ThemedText';

describe('ThemedText', () => {
  it('renders correctly', () => {
    const { getByText } = render(<ThemedText>Snapshot test!</ThemedText>);
    expect(getByText('Snapshot test!')).toBeTruthy();
  });
});
