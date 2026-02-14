import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Text,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
} from 'react-native';
import { Surface } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { Trip } from '@/src/features/trips/types';
import {
  ArrowLeft,
  ArrowRight,
  Wallet,
  MapPin,
  Users,
  UserPlus,
  Activity,
  MessageSquare,
} from 'lucide-react-native';
import { useIsOwner, useIsAdminOrOwner, usePermission } from '@/src/features/auth/permissions';

// Define a type for the icon props
type IconProps = {
  size: number;
  color: string;
};

interface QuickActionsProps {
  trip?: Trip;
  setShowInviteModal?: (show: boolean) => void;
  setShowMemberModal?: (show: boolean) => void;
  setShowStatusModal?: (show: boolean) => void;
  onWalletPress?: () => void;
  onLocationPress?: () => void;
  onChatPress?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  trip,
  setShowInviteModal,
  setShowMemberModal,
  setShowStatusModal,
  onWalletPress,
  onLocationPress,
  onChatPress,
}) => {
  const { theme } = useAppTheme();

  // Use the permission system from context (set up by TripDetailScreen)
  // Prefixed with _ since they are imported but not directly used (used in usePermission calls)
  const _isOwner = useIsOwner();
  const _isOwnerOrAdmin = useIsAdminOrOwner();
  // Permission checks using CASL ability
  const canCreateInvitation = usePermission('create', 'Invitation');
  const canUpdateTrip = usePermission('update', 'Trip');

  const actions = [
    {
      icon: (props: IconProps) => <Wallet {...props} />,
      label: 'Wallet',
      onPress: () => onWalletPress && onWalletPress(),
    },
    {
      icon: (props: IconProps) => <MapPin {...props} />,
      label: 'Location',
      onPress: () => onLocationPress && onLocationPress(),
    },
    ...(trip && onChatPress
      ? [
          {
            icon: (props: IconProps) => <MessageSquare {...props} />,
            label: 'Chat',
            onPress: () => onChatPress && onChatPress(),
          },
        ]
      : []),
    ...(trip && setShowMemberModal
      ? [
          {
            icon: (props: IconProps) => <Users {...props} />,
            label: 'Members',
            onPress: () => setShowMemberModal(true),
          },
        ]
      : []),
    ...(canCreateInvitation && setShowInviteModal
      ? [
          {
            icon: (props: IconProps) => <UserPlus {...props} />,
            label: 'Invite',
            onPress: () => setShowInviteModal(true),
          },
        ]
      : []),
    ...(canUpdateTrip && setShowStatusModal
      ? [
          {
            icon: (props: IconProps) => <Activity {...props} />,
            label: 'Status',
            onPress: () => setShowStatusModal(true),
          },
        ]
      : []),
  ];

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [needsScrolling, setNeedsScrolling] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  // Check if scrolling is needed when dimensions change
  useEffect(() => {
    if (contentWidth > 0 && containerWidth > 0) {
      const scrollNeeded = contentWidth > containerWidth;
      setNeedsScrolling(scrollNeeded);
      // Only show right arrow if scrolling is needed and we're at the start
      setCanScrollRight(scrollNeeded);
    }
  }, [contentWidth, containerWidth]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollNeeded = contentSize.width > layoutMeasurement.width;
    setNeedsScrolling(scrollNeeded);
    if (scrollNeeded) {
      setCanScrollLeft(contentOffset.x > 5); // Small threshold to avoid floating point issues
      setCanScrollRight(contentOffset.x < contentSize.width - layoutMeasurement.width - 5);
    } else {
      setCanScrollLeft(false);
      setCanScrollRight(false);
    }
  };

  const handleScrollViewLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const handleContentSizeChange = (width: number) => {
    setContentWidth(width);
  };

  // Use the bottom styles function with theme

  return (
    <>
      <Surface style={styles(theme).actionsCard} elevation={0}>
        <View style={styles(theme).fadeContainer}>
          {needsScrolling && canScrollLeft && (
            <ArrowLeft
              size={16}
              color={theme.colors.content.secondary}
              style={styles(theme).arrow}
            />
          )}

          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bounces={false}
            alwaysBounceVertical={false}
            alwaysBounceHorizontal={false}
            overScrollMode="never"
            nestedScrollEnabled={false}
            scrollsToTop={false}
            style={styles(theme).actionButtons}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles(theme).scrollContent}
            onContentSizeChange={handleContentSizeChange}
            onLayout={handleScrollViewLayout}
          >
            {actions.map((action) => (
              <Pressable
                key={action.label}
                onPress={action.onPress}
                style={({ pressed }) => [styles(theme).actionItem, { opacity: pressed ? 0.6 : 1 }]}
              >
                <View style={styles(theme).iconContainer}>
                  {action.icon({ size: 20, color: theme.colors.primary.main })}
                </View>
                <Text style={styles(theme).actionLabel} numberOfLines={1}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {needsScrolling && canScrollRight && (
            <ArrowRight
              size={16}
              color={theme.colors.content.secondary}
              style={styles(theme).arrow}
            />
          )}
        </View>
      </Surface>
    </>
  );
};

const styles = (theme: Theme) =>
  StyleSheet.create({
    actionsCard: {
      flex: 1,
      justifyContent: 'center',
      borderRadius: theme.shape?.borderRadius.medium ?? 8,
      backgroundColor: 'transparent',
      overflow: 'hidden',
    },
    fadeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.inset.xs,
    },
    arrow: {
      paddingHorizontal: 2,
      opacity: 0.6,
    },
    actionButtons: {
      flexDirection: 'row',
      flex: 1,
    },
    scrollContent: {
      alignItems: 'center',
      paddingVertical: theme.spacing.inset.sm,
      paddingHorizontal: theme.spacing.inset.xs,
    },
    actionItem: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.inset.sm,
      minWidth: 60,
      height: 64,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: theme.shape?.borderRadius.medium ?? 12,
      backgroundColor: theme.colors.primary.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    actionLabel: {
      fontSize: 11,
      color: theme.colors.content.primary,
      textAlign: 'center',
      maxWidth: 60,
    },
  });
