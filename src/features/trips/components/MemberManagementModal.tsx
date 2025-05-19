import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, List, Avatar, Chip, Surface, IconButton, Divider } from 'react-native-paper';
import { Crown, Shield, User, MoreVertical, UserPlus } from 'lucide-react-native';
import { Menu } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Trip } from '@/src/features/trips/types'; // Updated path
import { useAuthStore } from '@/src/features/auth/store';
import { useTripStore } from '@/src/features/trips/store'; // Updated path
import { InviteModal } from './InviteModal'; // Path should be correct after InviteModal is moved

interface MemberManagementModalProps {
  visible: boolean;
  onClose: () => void;
  trip: Trip;
}

// Define member and invitation types based on Trip interface
type TripMember = {
  userId: string;
  name?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
};

type TripInvitation = {
  email: string;
  status: 'pending' | 'accepted' | 'expired';
  token: string;
  expiresAt: string;
};

export const MemberManagementModal = ({ visible, onClose, trip }: MemberManagementModalProps) => {
  const theme = useAppTheme().theme;
  const { user } = useAuthStore();
  const { updateMemberRole, removeMember } = useTripStore();
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Debug trip data when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Additional detailed logging removed
    }
  }, [visible, trip, user]);

  // Ensure members array exists and includes the creator as owner if empty
  const members = React.useMemo(() => {
    // If members array exists, use it as a starting point
    const membersList = trip.members && trip.members.length > 0 
      ? [...trip.members] 
      : [];
    
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
    
    // Ensure creator is in the list with owner role
    const creatorExists = membersList.some(member => member.userId === trip.createdBy);
    if (!creatorExists && trip.createdBy) {
      // Get creator name if it's the current user
      const creatorName = user && user.id === trip.createdBy
        ? getUserDisplayName(user)
        : undefined;
        
      membersList.push({
        userId: trip.createdBy,
        name: creatorName,
        role: 'owner',
        joinedAt: trip.createdAt
      });
    }
    
    // Ensure current user is in the list if they're not already
    if (user && !membersList.some(member => member.userId === user.id)) {
      // Determine the role based on whether they're the creator
      const role = user.id === trip.createdBy ? 'owner' : 'member';
      membersList.push({
        userId: user.id,
        name: getUserDisplayName(user),
        role: role,
        joinedAt: new Date().toISOString()
      });
    }
    
    // Make sure all members have a name
    membersList.forEach(member => {
      if (!member.name && member.userId === user?.id) {
        member.name = getUserDisplayName(user);
      } else if (!member.name) {
        // For members without names, try to create a name from their userId
        // or use a generic name
        member.name = `Member ${member.userId.substring(0, 4)}`;
      }
    });
    
    return membersList;
  }, [trip.members, trip.createdBy, trip.createdAt, user]);

  // Check if current user is owner or admin
  const currentUserRole = members.find(member => member.userId === user?.id)?.role || 'member';
  const isOwner = currentUserRole === 'owner';
  const isAdmin = currentUserRole === 'admin';
  const canManageMembers = isOwner || isAdmin;

  // Function to handle role change
  const handleRoleChange = async (memberId: string, newRole: 'owner' | 'admin' | 'member') => {
    try {
      setLoading(true);
      await updateMemberRole(trip.id, memberId, newRole);
      setMenuVisible(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to update member role');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle member removal
  const handleRemoveMember = async (memberId: string) => {
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await removeMember(trip.id, memberId);
              setMenuVisible(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Function to get initials from user ID or name
  const getInitials = (userId: string, name?: string) => {
    // If name is provided, use it to generate initials
    if (name) {
      const nameParts = name.split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      } else if (nameParts.length === 1 && nameParts[0].length >= 2) {
        return nameParts[0].substring(0, 2).toUpperCase();
      }
    }
    
    // If user is current user, try to get initials from user object
    if (user && userId === user.id) {
      if (user.firstName && user.lastName) {
        return (user.firstName[0] + user.lastName[0]).toUpperCase();
      } else if (user.email) {
        const emailName = user.email.split('@')[0];
        if (emailName.includes('.')) {
          const parts = emailName.split('.');
          return (parts[0][0] + parts[1][0]).toUpperCase();
        }
      }
    }
    
    // Fallback to using userId
    return userId.substring(0, 2).toUpperCase();
  };

  // Function to get role label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'admin':
        return 'Admin';
      default:
        return 'Member';
    }
  };

  // Render member item
  const renderMemberItem = ({ item }: { item: TripMember }) => {
    const isCurrentUser = item.userId === user?.id;
    const isCreator = item.userId === trip.createdBy;
    const memberRole = item.role || 'member';
    
    // Get role icon
    const RoleIcon = memberRole === 'owner' 
      ? Crown 
      : memberRole === 'admin' 
        ? Shield 
        : User;

    // Owner can manage everyone except themselves
    // Admin can manage members but not other admins or owners
    const canManageThisMember = 
      (isOwner && !isCurrentUser) || 
      (isAdmin && memberRole === 'member');

    // Determine display name
    let displayName = item.name;
    if (!displayName) {
      if (isCurrentUser && user) {
        // For current user, try to get name from user object
        if (user.email) {
          const emailName = user.email.split('@')[0];
          if (emailName.includes('.')) {
            displayName = emailName.split('.')
              .map(part => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ');
          } else {
            displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          }
        } else {
          displayName = 'You';
        }
      } else {
        // For other members, use a generic name if no name is available
        displayName = `Member ${item.userId.substring(0, 4)}`;
      }
    }

    return (
      <Surface style={styles.memberItemSurface} elevation={1}>
        <List.Item
          title={displayName}
          description={isCurrentUser ? 'You' : getRoleLabel(memberRole)}
          left={() => (
            <Avatar.Text 
              size={40} 
              label={getInitials(item.userId, item.name)} 
              style={{ backgroundColor: theme.colors.primaryContainer }} 
              color={theme.colors.onPrimaryContainer} 
            />
          )}
          right={() => (
            <View style={styles.memberActionsContainer}>
              <RoleIcon 
                color={theme.colors.onSurfaceVariant} 
                size={20} 
                style={{ marginRight: canManageThisMember ? 8 : 0 }} 
              />
              {canManageThisMember && (
                <Menu
                  visible={menuVisible === item.userId}
                  onDismiss={() => setMenuVisible(null)}
                  anchor={<IconButton icon={MoreVertical} onPress={() => setMenuVisible(item.userId)} />}
                >
                  {isOwner && memberRole !== 'owner' && (
                    <Menu.Item onPress={() => handleRoleChange(item.userId, 'owner')} title="Make Owner" />
                  )}
                  {canManageMembers && memberRole !== 'admin' && (
                     <Menu.Item onPress={() => handleRoleChange(item.userId, 'admin')} title="Make Admin" />
                  )}
                  {canManageMembers && memberRole !== 'member' && (
                     <Menu.Item onPress={() => handleRoleChange(item.userId, 'member')} title="Make Member" />
                  )}
                  <Divider />
                  <Menu.Item onPress={() => handleRemoveMember(item.userId)} title="Remove from Trip" titleStyle={{ color: theme.colors.error }} />
                </Menu>
              )}
            </View>
          )}
          style={styles.listItem}
        />
      </Surface>
    );
  };

  const renderInvitationItem = ({ item }: { item: TripInvitation }) => (
    <List.Item
      title={item.email}
      description={`Status: ${item.status}`}
      left={() => <List.Icon icon="email-outline" />}
      // Optionally add actions for invitations (e.g., resend, revoke)
    />
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[styles.modalContainer, { overflow: 'hidden' }]}
      >
        <View style={[styles.content, { backgroundColor: theme.colors.background }]}> 
          <View style={styles.header}>
            <Text variant="headlineSmall">Manage Members</Text>
            <IconButton icon={UserPlus} size={24} onPress={() => setShowInviteModal(true)} />
          </View>
          <ScrollView style={styles.scrollView}>
            {/* Render members */}
            <List.Section title="Members">
              {members.map((member) => (
                <View key={member.userId}>
                  {renderMemberItem({ item: member })}
                </View>
              ))}
            </List.Section>

            {/* Render invitations */}
            {trip.invitations && trip.invitations.length > 0 && (
              <List.Section title="Pending Invitations">
                {trip.invitations.map((invitation) => (
                  <View key={invitation.token}> 
                    {renderInvitationItem({ item: invitation })}
                  </View>
                ))}
              </List.Section>
            )}
          </ScrollView>
          <Button onPress={onClose} mode="outlined" style={styles.closeButton}>
            Close
          </Button>
          {/* Invite Modal (nested) */}
          <InviteModal 
            visible={showInviteModal} 
            onClose={() => setShowInviteModal(false)} 
            tripId={trip.id} 
          />
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scrollView: {
    // Styles for the scroll view if needed
  },
  memberItemSurface: {
    borderRadius: 8,
    marginBottom: 8,
    // backgroundColor will be set by Surface based on theme
  },
  listItem: {
    // Removed fixed height to allow dynamic content
    // paddingVertical: 12, // Adjusted padding
  },
  memberActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    marginTop: 20,
  },
  content: {
    // Styles for the content container
  },
}); 