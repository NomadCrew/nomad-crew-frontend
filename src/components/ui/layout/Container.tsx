import React from 'react';
import { View, ViewStyle, ScrollView, ScrollViewProps } from 'react-native';
import { spacing, spacingUtils, grid, type Spacing } from '../../../theme/foundations/spacing';
import { useAppTheme } from '../../../theme/utils/useAppTheme';

interface ContainerProps {
  /**
   * Children content to contain
   */
  children: React.ReactNode;
  
  /**
   * Container variant for different use cases
   * @default 'screen'
   */
  variant?: 'screen' | 'content' | 'card' | 'section' | 'modal';
  
  /**
   * Whether container should be scrollable
   * @default false
   */
  scrollable?: boolean;
  
  /**
   * Custom padding override
   */
  padding?: Spacing;
  
  /**
   * Custom margin override
   */
  margin?: Spacing;
  
  /**
   * Whether container should fill available space
   * @default true for screen variant, false for others
   */
  fill?: boolean;
  
  /**
   * Whether to center content horizontally
   * @default false
   */
  center?: boolean;
  
  /**
   * Background color variant
   * @default 'background' for screen, 'surface' for others
   */
  background?: 'background' | 'surface' | 'surface-variant' | 'transparent';
  
  /**
   * Additional custom styles
   */
  style?: ViewStyle;
  
  /**
   * ScrollView props when scrollable=true
   */
  scrollProps?: Omit<ScrollViewProps, 'children' | 'style'>;
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Container Component
 * 
 * A versatile layout component for creating consistent content containers.
 * Provides semantic variants for different use cases and automatic styling.
 * 
 * @example
 * ```tsx
 * // Screen container with scrolling
 * <Container variant="screen" scrollable>
 *   <Text>Screen content</Text>
 * </Container>
 * 
 * // Card container
 * <Container variant="card" center>
 *   <Text>Card content</Text>
 * </Container>
 * ```
 */
export const Container: React.FC<ContainerProps> = ({
  children,
  variant = 'screen',
  scrollable = false,
  padding,
  margin,
  fill,
  center = false,
  background,
  style,
  scrollProps,
  testID,
}) => {
  const theme = useAppTheme();
  
  // Determine default values based on variant
  const shouldFill = fill !== undefined ? fill : variant === 'screen';
  
  // Get variant-specific styles
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'screen':
        return {
          padding: spacing[padding || 'xl'],
          backgroundColor: theme.colors[background || 'background'],
        };
      case 'content':
        return {
          padding: spacing[padding || 'lg'],
          maxWidth: grid.container.maxWidth,
          backgroundColor: theme.colors[background || 'surface'],
        };
      case 'card':
        return {
          padding: spacing[padding || 'xl'],
          borderRadius: 12,
          backgroundColor: theme.colors[background || 'surface'],
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        };
      case 'section':
        return {
          padding: spacing[padding || 'lg'],
          backgroundColor: theme.colors[background || 'surface-variant'],
        };
      case 'modal':
        return {
          padding: spacing[padding || 'xxl'],
          borderRadius: 16,
          backgroundColor: theme.colors[background || 'surface'],
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 12,
        };
      default:
        return {};
    }
  };

  // Create the container style
  const containerStyle: ViewStyle = {
    ...getVariantStyles(),
    ...(shouldFill && { flex: 1 }),
    ...(center && { 
      alignItems: 'center',
      justifyContent: 'center',
    }),
    ...(margin && spacingUtils.margin.all(margin)),
    ...style,
  };

  // Render scrollable container
  if (scrollable) {
    return (
      <ScrollView
        style={[containerStyle, !shouldFill && { flexGrow: 0 }]}
        contentContainerStyle={shouldFill ? { flexGrow: 1 } : undefined}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        testID={testID}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    );
  }

  // Render static container
  return (
    <View style={containerStyle} testID={testID}>
      {children}
    </View>
  );
};

// Export the Container component as default for easier imports
export default Container; 