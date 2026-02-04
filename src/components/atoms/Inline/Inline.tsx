import React from 'react';
import { View, ViewStyle } from 'react-native';
import { spacing, spacingUtils, type Spacing } from '../../../theme/foundations/spacing';

export interface InlineProps {
  /**
   * Children elements to arrange horizontally
   */
  children: React.ReactNode;
  
  /**
   * Space between inline items
   * @default 'md'
   */
  space?: Spacing;
  
  /**
   * Vertical alignment of inline items
   * @default 'center'
   */
  align?: 'start' | 'center' | 'end' | 'stretch';
  
  /**
   * Horizontal alignment/distribution of inline content
   * @default 'start'
   */
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  
  /**
   * Whether items should wrap to new lines
   * @default false
   */
  wrap?: boolean;
  
  /**
   * Whether inline should fill available width
   * @default false
   */
  fill?: boolean;
  
  /**
   * Custom padding around the entire inline container
   */
  padding?: Spacing;
  
  /**
   * Custom margin around the entire inline container
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
 * Inline Component
 * 
 * A flexible layout component for arranging elements horizontally with consistent spacing.
 * Provides semantic spacing options, alignment controls, and wrapping support.
 * 
 * @example
 * ```tsx
 * <Inline space="sm" align="center" justify="space-between">
 *   <Button>Cancel</Button>
 *   <Button>Save</Button>
 * </Inline>
 * ```
 */
export const Inline: React.FC<InlineProps> = ({
  children,
  space = 'md',
  align = 'center',
  justify = 'start',
  wrap = false,
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
    flexDirection: 'row',
    alignItems,
    justifyContent,
    flexWrap: wrap ? 'wrap' : 'nowrap',
    ...(fill && { flex: 1 }),
    ...(padding && { padding: spacingUtils.padding.all(padding) }),
    ...(margin && { margin: spacingUtils.margin.all(margin) }),
    gap: spacing[space],
    ...style,
  };

  return (
    <View style={containerStyle} testID={testID}>
      {children}
    </View>
  );
};

// Export the Inline component as default for easier imports
export default Inline; 