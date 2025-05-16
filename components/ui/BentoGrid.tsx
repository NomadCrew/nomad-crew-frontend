import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';

interface BentoItem {
  id: string | number;
  element: React.ReactNode;
  height: 'short' | 'normal' | 'tall';
  position: 'left' | 'right';
}

interface BentoGridProps {
  items: BentoItem[];
}

export const BentoGrid: React.FC<BentoGridProps> = ({ items }) => {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  
  // Calculate responsive dimensions
  const GRID_MARGIN = theme.spacing.layout.screen.padding;
  const GRID_GAP = theme.spacing.layout.section.gap;
  const MAX_WIDTH = Math.min(screenWidth, theme.breakpoints.desktop);
  const CONTENT_WIDTH = MAX_WIDTH - (GRID_MARGIN * 2);
  
  // Base and tall card heights
  const BASE_CARD_HEIGHT = 180;
  const SHORT_CARD_HEIGHT = BASE_CARD_HEIGHT / 2;
  const TALL_CARD_HEIGHT = (BASE_CARD_HEIGHT * 2) + GRID_GAP;
  
  // Calculate card width based on available space
  const CARD_WIDTH = (CONTENT_WIDTH - GRID_GAP) / 2;

  // Separate items by position
  const leftItems = items.filter(item => item.position === 'left');
  const rightItems = items.filter(item => item.position === 'right');

  // New height definitions for right column combinations
  const TALL_COLUMN_HEIGHT = (BASE_CARD_HEIGHT * 2) + GRID_GAP;
  const RIGHT_COLUMN_NORMAL = TALL_COLUMN_HEIGHT * 0.75 - GRID_GAP/2;
  const RIGHT_COLUMN_SHORT = TALL_COLUMN_HEIGHT * 0.25 - GRID_GAP/2;

  return (
    <View style={[styles.container, { padding: GRID_MARGIN }]}>
      <View style={styles.grid}>
        {/* Left column */}
        <View style={styles.column}>
          {leftItems.map((item) => (
            <View
              key={item.id}
              style={[
                styles.card,
                {
                  width: CARD_WIDTH,
                  height: item.height === 'tall' ? TALL_CARD_HEIGHT : 
                          item.height === 'short' ? SHORT_CARD_HEIGHT : 
                          BASE_CARD_HEIGHT,
                  backgroundColor: theme.colors.surface.variant,
                },
              ]}
            >
              {item.element}
            </View>
          ))}
        </View>

        {/* Right column */}
        <View style={[styles.column, { marginLeft: GRID_GAP }]}>
          {rightItems.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.card,
                {
                  width: CARD_WIDTH,
                  height: item.height === 'normal' ? RIGHT_COLUMN_NORMAL :
                          item.height === 'short' ? RIGHT_COLUMN_SHORT :
                          BASE_CARD_HEIGHT,
                  marginBottom: index === 0 ? GRID_GAP : 0,
                  backgroundColor: theme.colors.surface.variant,
                },
              ]}
            >
              {item.element}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  column: {
    alignItems: 'flex-start',
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
  },
});