import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Text, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Surface } from 'react-native-paper';
import { useThemedStyles } from '@/src/theme/utils';
import { useAuthStore } from '@/src/features/auth/store';
import { Trip } from '@/src/features/trips/types'; // Updated path
import { ArrowLeft, ArrowRight, MapPin, Users, UserPlus, Activity, MessageSquare } from 'lucide-react-native';
import { MemberManagementModal } from './MemberManagementModal';
import { TripStatusUpdateModal } from './TripStatusUpdateModal';

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
  const authStore = useAuthStore();
  const userId = authStore.user?.id;
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  const isOwner = trip?.createdBy === userId;
  const members = trip?.members || [];
  const isAdmin = members.some(
    (member) => member.userId === userId && member.role === 'admin'
  );
  const isOwnerOrAdmin = isOwner || isAdmin;

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
        return emailName.split('.')
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      } else if (emailName.includes('_')) {
        return emailName.split('_')
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
      onPress: () => onLocationPress && onLocationPress()
    },
    ...(trip && onChatPress ? [
      { 
        icon: (props: IconProps) => <MessageSquare {...props} />, 
        label: 'Chat', 
        onPress: () => onChatPress && onChatPress()
      }
    ] : []),
    ...(trip ? [
      { 
        icon: (props: IconProps) => <Users {...props} />, 
        label: 'Members', 
        onPress: () => {
          // Get current user info
          const currentUser = authStore.user;
          const creatorName = currentUser && currentUser.id === trip.createdBy
            ? getUserDisplayName(currentUser)
            : undefined;
          
          // Ensure the trip has the creator as a member if members array is empty
          const tripWithMembers = {
            ...trip,
            members: trip.members && trip.members.length > 0 
              ? trip.members 
              : [{ 
                  userId: trip.createdBy,
                  name: creatorName,
                  role: 'owner', 
                  joinedAt: trip.createdAt 
                }]
          };
          
          setShowMemberModal(true);
        } 
      }
    ] : []),
    ...(isOwnerOrAdmin && setShowInviteModal
      ? [{ 
          icon: (props: IconProps) => <UserPlus {...props} />, 
          label: 'Invite', 
          onPress: () => setShowInviteModal(true) 
        }]
      : []),
    ...(isOwner
      ? [{ 
          icon: (props: IconProps) => <Activity {...props} />, 
          label: 'Status', 
          onPress: () => setShowStatusModal(true) 
        }]
      : []),
  ];

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setCanScrollLeft(contentOffset.x > 0);
    setCanScrollRight(contentOffset.x < contentSize.width - layoutMeasurement.width);
  };

  const styles = useThemedStyles((theme, safeAccess) => ({
    actionsCard: {
      borderRadius: safeAccess.borderRadius.get(theme, 'md', 8),
      marginVertical: safeAccess.spacing.get(theme, 'layout.section.gap', 16),
      backgroundColor: safeAccess.colors.get(theme, 'surface.main', '#FFFFFF'),
      overflow: 'hidden' as const,
    },
    fadeContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: safeAccess.spacing.get(theme, 'layout.card.padding.horizontal', 16),
    },
    arrow: {
      paddingHorizontal: safeAccess.spacing.get(theme, 'xs', 4),
    },
    actionButtons: {
      flexDirection: 'row' as const,
      paddingVertical: safeAccess.spacing.get(theme, 'layout.card.padding.vertical', 8),
    },
    scrollContent: {
      alignItems: 'center' as const,
    },
    actionItem: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: safeAccess.spacing.get(theme, 'md', 16),
      minWidth: 80,
      height: 70,
    },
    iconContainer: {
      width: 38,
      height: 38,
      borderRadius: safeAccess.borderRadius.get(theme, 'lg', 12),
      backgroundColor: safeAccess.colors.get(theme, 'primary.container', '#FFF7ED'),
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: safeAccess.spacing.get(theme, 'xs', 4),
    },
    actionLabel: {
      fontSize: 12,
      color: safeAccess.colors.get(theme, 'content.primary', '#1A1A1A'),
      textAlign: 'center' as const,
      marginTop: 4,
    },
    // Helper properties for accessing colors
    primaryColor: safeAccess.colors.get(theme, 'primary.main', '#F46315'),
    contentPrimaryColor: safeAccess.colors.get(theme, 'content.primary', '#1A1A1A'),
  }));

  return (
    <>
      <Surface style={styles.actionsCard} elevation={0}>
        <View style={styles.fadeContainer}>
          {canScrollLeft && (
            <ArrowLeft size={20} color={styles.contentPrimaryColor} style={styles.arrow} />
          )}
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.actionButtons}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.scrollContent}
          >
            {actions.map((action) => (
              <Pressable 
                key={action.label} 
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.actionItem,
                  { opacity: pressed ? 0.6 : 1 }
                ]}
              >
                <View style={styles.iconContainer}>
                  {action.icon({ size: 19, color: styles.primaryColor })}
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {canScrollRight && (
            <ArrowRight size={20} color={styles.contentPrimaryColor} style={styles.arrow} />
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
              const creatorExists = tripCopy.members.some(member => member.userId === trip.createdBy);
              if (!creatorExists) {
                const currentUser = authStore.user;
                const creatorName = currentUser && currentUser.id === trip.createdBy
                  ? getUserDisplayName(currentUser)
                  : undefined;
                  
                tripCopy.members.push({ 
                  userId: trip.createdBy, 
                  name: creatorName,
                  role: 'owner', 
                  joinedAt: trip.createdAt 
                });
              }
              
              // Ensure current user is in members array if they're not already
              if (userId && !tripCopy.members.some(member => member.userId === userId)) {
                // Determine the role based on whether they're the creator
                const role = userId === trip.createdBy ? 'owner' : 'member';
                const currentUser = authStore.user;
                
                tripCopy.members.push({
                  userId: userId,
                  name: currentUser ? getUserDisplayName(currentUser) : undefined,
                  role: role,
                  joinedAt: new Date().toISOString()
                });
              }
              
              // Make sure all members have names
              if (!Array.isArray(tripCopy.members)) {
                console.error('[DEBUG] QuickActions: tripCopy.members is not an array:', tripCopy.members, tripCopy);
                tripCopy.members = [];
              }
              tripCopy.members = tripCopy.members.map(member => {
                if (!member.name) {
                  // If member is current user, use their info
                  if (member.userId === userId && authStore.user) {
                    return {
                      ...member,
                      name: getUserDisplayName(authStore.user)
                    };
                  }
                  // For other members without names, add a placeholder
                  return {
                    ...member,
                    name: `Member ${member.userId.substring(0, 4)}`
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

