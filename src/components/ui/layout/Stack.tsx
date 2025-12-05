import React from 'react';
import { View, ViewStyle } from 'react-native';
import { spacing, spacingUtils, type Spacing } from '../../../theme/foundations/spacing';

interface StackProps {
  /**
   * Children elements to stack vertically
   */
  children: React.ReactNode;
  
  /**
   * Space between stack items
   * @default 'md'
   */
  space?: Spacing;
  
  /**
   * Horizontal alignment of stack items
   * @default 'stretch'
   */
  align?: 'start' | 'center' | 'end' | 'stretch';
  
  /**
   * Vertical alignment/distribution of stack content
   * @default 'start'
   */
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  
  /**
   * Whether stack should fill available height
   * @default false
   */
  fill?: boolean;
  
  /**
   * Custom padding around the entire stack
   */
  padding?: Spacing;
  
  /**
   * Custom margin around the entire stack
   */
  margin?: Spacing;
  
  /**
   * Additional custom styles
   */
  style?: ViewStyle;
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Stack Component
 * 
 * A flexible layout component for stacking elements vertically with consistent spacing.
 * Provides semantic spacing options and alignment controls.
 * 
 * @example
 * ```tsx
 * <Stack space="lg" align="center" padding="xl">
 *   <Text>Item 1</Text>
 *   <Text>Item 2</Text>
 *   <Text>Item 3</Text>
 * </Stack>
 * ```
 */
export const Stack: React.FC<StackProps> = ({
  children,
  space = 'md',
  align = 'stretch',
  justify = 'start',
  fill = false,
  padding,
  margin,
  style,
  testID,
}) => {
  // Convert alignment props to flexbox values
  const alignItems = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
  }[align] as ViewStyle['alignItems'];

  const justifyContent = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    'space-between': 'space-between',
    'space-around': 'space-around',
    'space-evenly': 'space-evenly',
  }[justify] as ViewStyle['justifyContent'];

  // Create the container style
  const containerStyle: ViewStyle = {
    flexDirection: 'column',
    alignItems,
    justifyContent,
    ...(fill && { flex: 1 }),
    ...(padding && spacingUtils.padding.all(padding)),
    ...(margin && spacingUtils.margin.all(margin)),
    gap: spacing[space],
    ...style,
  };

  return (
    <View style={containerStyle} testID={testID}>
      {children}
    </View>
  );
};

// Export the Stack component as default for easier imports
export default Stack; 