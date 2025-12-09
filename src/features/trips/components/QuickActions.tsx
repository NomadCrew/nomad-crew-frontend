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
import { useAuthStore } from '@/src/features/auth/store';
import { Theme } from '@/src/theme/types';
import { Trip } from '@/src/features/trips/types';
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Users,
  UserPlus,
  Activity,
  MessageSquare,
} from 'lucide-react-native';
import { MemberManagementModal } from './MemberManagementModal';
import { TripStatusUpdateModal } from './TripStatusUpdateModal';
import { useIsOwner, useIsAdminOrOwner, usePermission } from '@/src/features/auth/permissions';

// Define a type for the icon props
type IconProps = {
  size: number;
  color: string;
};

interface QuickActionsProps {
  trip?: Trip;
  setShowInviteModal?: (show: boolean) => void;
  onLocationPress?: () => void;
  onChatPress?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  trip,
  setShowInviteModal,
  onLocationPress,
  onChatPress,
}) => {
  const theme = useAppTheme().theme;
  const authStore = useAuthStore();
  const userId = authStore.user?.id;
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Use the permission system from context (set up by TripDetailScreen)
  const isOwner = useIsOwner();
  const isOwnerOrAdmin = useIsAdminOrOwner();
  // Permission checks using CASL ability
  const canCreateInvitation = usePermission('create', 'Invitation');
  const canUpdateTrip = usePermission('update', 'Trip');

  // Helper function to get the best available display name for a user
  const getUserDisplayName = (user: any): string => {
    if (!user) return 'Trip Member';

    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.lastName) {
      return user.lastName;
    } else if (user.username && user.username.trim() !== '') {
      return user.username;
    } else if (user.email) {
      // Extract name from email (e.g., john.doe@example.com -> John Doe)
      const emailName = user.email.split('@')[0];
      if (emailName.includes('.')) {
        return emailName
          .split('.')
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      } else if (emailName.includes('_')) {
        return emailName
          .split('_')
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }
      // Just capitalize the email name if no separator
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    // Fallback to a generic name
    return 'Trip Member';
  };

  const actions = [
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
    ...(trip
      ? [
          {
            icon: (props: IconProps) => <Users {...props} />,
            label: 'Members',
            onPress: () => {
              // Get current user info
              const currentUser = authStore.user;
              const creatorName =
                currentUser && currentUser.id === trip.createdBy
                  ? getUserDisplayName(currentUser)
                  : undefined;

              // Ensure the trip has the creator as a member if members array is empty
              const tripWithMembers = {
                ...trip,
                members:
                  trip.members && trip.members.length > 0
                    ? trip.members
                    : [
                        {
                          userId: trip.createdBy,
                          name: creatorName,
                          role: 'owner',
                          joinedAt: trip.createdAt,
                        },
                      ],
              };

              setShowMemberModal(true);
            },
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
    ...(canUpdateTrip
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
                  {action.icon({ size: 18, color: theme.colors.primary.main })}
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

      {trip && (
        <>
          <MemberManagementModal
            visible={showMemberModal}
            onClose={() => setShowMemberModal(false)}
            trip={(() => {
              // Create a copy of the trip to avoid modifying the original
              const tripCopy = { ...trip };

              // Ensure members array exists
              if (!tripCopy.members) {
                tripCopy.members = [];
              }

              // Ensure creator is in members array with owner role
              const creatorExists = tripCopy.members.some(
                (member) => member.userId === trip.createdBy
              );
              if (!creatorExists) {
                const currentUser = authStore.user;
                const creatorName =
                  currentUser && currentUser.id === trip.createdBy
                    ? getUserDisplayName(currentUser)
                    : undefined;

                tripCopy.members.push({
                  userId: trip.createdBy,
                  name: creatorName,
                  role: 'owner',
                  joinedAt: trip.createdAt,
                });
              }

              // Ensure current user is in members array if they're not already
              if (userId && !tripCopy.members.some((member) => member.userId === userId)) {
                // Determine the role based on whether they're the creator
                const role = userId === trip.createdBy ? 'owner' : 'member';
                const currentUser = authStore.user;

                tripCopy.members.push({
                  userId: userId,
                  name: currentUser ? getUserDisplayName(currentUser) : undefined,
                  role: role,
                  joinedAt: new Date().toISOString(),
                });
              }

              // Make sure all members have names
              if (!Array.isArray(tripCopy.members)) {
                console.error(
                  '[DEBUG] QuickActions: tripCopy.members is not an array:',
                  tripCopy.members,
                  tripCopy
                );
                tripCopy.members = [];
              }
              tripCopy.members = tripCopy.members.map((member) => {
                if (!member.name) {
                  // If member is current user, use their info
                  if (member.userId === userId && authStore.user) {
                    return {
                      ...member,
                      name: getUserDisplayName(authStore.user),
                    };
                  }
                  // For other members without names, add a placeholder
                  return {
                    ...member,
                    name: `Member ${member.userId.substring(0, 4)}`,
                  };
                }
                return member;
              });

              return tripCopy;
            })()}
          />

          <TripStatusUpdateModal
            visible={showStatusModal}
            onClose={() => setShowStatusModal(false)}
            trip={trip}
          />
        </>
      )}
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
      width: 34,
      height: 34,
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
