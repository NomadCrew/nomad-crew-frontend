import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import type { Theme } from '@/src/theme/types';

export interface AppBottomSheetProps {
  /** Whether the bottom sheet is visible */
  visible: boolean;
  /** Called when the bottom sheet is dismissed */
  onClose: () => void;
  /** Optional title displayed at the top */
  title?: string;
  /** Snap points for the bottom sheet (e.g. ['50%', '90%']) */
  snapPoints?: string[];
  /** Whether the content should be scrollable */
  scrollable?: boolean;
  /** Content to render inside the bottom sheet */
  children: React.ReactNode;
}

const BORDER_RADIUS = 20;
const HANDLE_WIDTH = 40;
const HANDLE_HEIGHT = 4;

/**
 * @atomic-level molecule
 * @description A shared, theme-aware bottom sheet wrapper built on @gorhom/bottom-sheet.
 * Provides a drag handle indicator, dimmed backdrop with tap-to-dismiss,
 * SafeAreaView padding on Android, and optional scrollable content.
 *
 * @example
 * ```tsx
 * <AppBottomSheet visible={isOpen} onClose={() => setIsOpen(false)} title="Options">
 *   <Text>Sheet content</Text>
 * </AppBottomSheet>
 * ```
 */
export const AppBottomSheet: React.FC<AppBottomSheetProps> = ({
  visible,
  onClose,
  title,
  snapPoints: snapPointsProp,
  scrollable = false,
  children,
}) => {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();

  const snapPoints = useMemo(() => snapPointsProp ?? ['50%', '90%'], [snapPointsProp]);

  // Open or close the sheet based on `visible`
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const renderHandle = useCallback(
    () => (
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>
    ),
    [styles]
  );

  // Extra bottom padding for Android to respect safe area / nav bar
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom;

  const ContentWrapper = scrollable ? BottomSheetScrollView : BottomSheetView;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleComponent={renderHandle}
      backgroundStyle={styles.background}
      style={styles.sheet}
    >
      <ContentWrapper style={[styles.contentContainer, { paddingBottom: bottomPadding }]}>
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {children}
      </ContentWrapper>
    </BottomSheet>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    sheet: {
      zIndex: 1,
    },
    background: {
      backgroundColor: theme.colors.surface.default,
      borderTopLeftRadius: BORDER_RADIUS,
      borderTopRightRadius: BORDER_RADIUS,
    },
    handleContainer: {
      alignItems: 'center',
      paddingTop: 12,
      paddingBottom: 4,
    },
    handle: {
      width: HANDLE_WIDTH,
      height: HANDLE_HEIGHT,
      borderRadius: HANDLE_HEIGHT / 2,
      backgroundColor: theme.colors.content.tertiary,
      opacity: 0.5,
    },
    contentContainer: {
      paddingHorizontal: theme.spacing.lg,
    },
    title: {
      fontSize: theme.typography.size.lg,
      fontWeight: '600',
      color: theme.colors.content.primary,
      marginBottom: theme.spacing.md,
    },
  });
