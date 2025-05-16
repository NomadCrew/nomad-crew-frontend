import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Modal, Portal, Text, Button, List, Avatar, Chip, Surface, IconButton, Divider } from 'react-native-paper';
import { Crown, Shield, User, MoreVertical, UserPlus } from 'lucide-react-native';
import { Menu } from 'react-native-paper';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Trip } from '@/src/types/trip';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useTripStore } from '@/src/store/useTripStore';
import { InviteModal } from './InviteModal';

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
  const { theme } = useTheme();
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
        // For other users without names
        displayName = `Member ${item.userId.substring(0, 4)}`;
      }
    }

    // Create a single description text that shows only the role
    // Since Owner = Creator, we don't need to show Creator separately
    // And "You" is already shown in the title
    const descriptionText = getRoleLabel(memberRole);

    return (
      <List.Item
        title={isCurrentUser 
          ? `You${displayName && displayName !== 'You' ? ` (${displayName})` : ''}`
          : displayName || `User ${item.userId.substring(0, 6)}`
        }
        titleStyle={isCurrentUser ? styles.currentUserTitle : undefined}
        description={descriptionText}
        descriptionStyle={styles.descriptionText}
        left={props => (
          <Avatar.Text 
            {...props} 
            size={40} 
            label={getInitials(item.userId, item.name)} 
            style={styles.avatar}
          />
        )}
        right={props => 
          canManageThisMember ? (
            <Menu
              visible={menuVisible === item.userId}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  {...props}
                  icon={({size, color}) => <MoreVertical size={size} color={color} />}
                  onPress={() => setMenuVisible(item.userId)}
                />
              }
            >
              {memberRole !== 'owner' && (
                <Menu.Item
                  onPress={() => handleRoleChange(item.userId, 'owner')}
                  title="Make Owner"
                  leadingIcon={({size, color}) => <RoleIcon size={size} color={color} />}
                  disabled={loading}
                />
              )}
              {memberRole !== 'admin' && (
                <Menu.Item
                  onPress={() => handleRoleChange(item.userId, 'admin')}
                  title="Make Admin"
                  leadingIcon={({size, color}) => <RoleIcon size={size} color={color} />}
                  disabled={loading}
                />
              )}
              {memberRole !== 'member' && (
                <Menu.Item
                  onPress={() => handleRoleChange(item.userId, 'member')}
                  title="Make Member"
                  leadingIcon={({size, color}) => <RoleIcon size={size} color={color} />}
                  disabled={loading}
                />
              )}
              <Divider />
              <Menu.Item
                onPress={() => handleRemoveMember(item.userId)}
                title="Remove"
                leadingIcon="delete"
                disabled={loading}
              />
            </Menu>
          ) : null
        }
      />
    );
  };

  // Render pending invitations
  const renderInvitationItem = ({ item }: { item: TripInvitation }) => (
    <List.Item
      title={item.email}
      description={`Invited • ${item.status}`}
      descriptionStyle={styles.descriptionText}
      left={props => (
        <Avatar.Icon
          {...props}
          size={40}
          icon="email"
          style={styles.avatar}
        />
      )}
      right={props => (
        <IconButton
          {...props}
          icon="close"
          onPress={() => {}}
        />
      )}
    />
  );

  // Prepare invitations array with null check
  const invitations = trip.invitations || [];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={styles.modalContent}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.header}>
              <Text variant="headlineSmall" style={styles.title}>
                Trip Members
              </Text>
              <IconButton
                icon="close"
                onPress={onClose}
                style={styles.closeButton}
              />
            </View>

            {canManageMembers && (
              <Button
                mode="outlined"
                icon={({size, color}) => <UserPlus size={size} color={color} />}
                onPress={() => setShowInviteModal(true)}
                style={styles.inviteButton}
              >
                Invite Members
              </Button>
            )}

            <Divider style={styles.divider} />

            {members.length > 0 ? (
              <List.Section style={styles.listSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Members ({members.length})
                </Text>
                {members.map((member, index) => (
                  <React.Fragment key={member.userId}>
                    {renderMemberItem({ item: member })}
                    {index < members.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List.Section>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No members yet</Text>
                {canManageMembers && (
                  <Button
                    mode="contained"
                    onPress={() => setShowInviteModal(true)}
                    style={styles.emptyButton}
                  >
                    Invite Members
                  </Button>
                )}
              </View>
            )}

            {invitations.length > 0 && (
              <>
                <Divider style={styles.divider} />
                <List.Section style={styles.listSection}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Pending Invitations ({invitations.length})
                  </Text>
                  {invitations.map((invitation, index) => (
                    <React.Fragment key={invitation.email}>
                      {renderInvitationItem({ item: invitation })}
                      {index < invitations.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List.Section>
              </>
            )}
          </ScrollView>
        </Surface>
      </Modal>

      <InviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        tripId={trip.id}
      />
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    padding: 0,
    margin: 0,
  },
  modalContent: {
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
    width: '90%',
    alignSelf: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 0,
  },
  inviteButton: {
    margin: 16,
  },
  divider: {
    marginVertical: 8,
  },
  listSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  avatar: {
    marginVertical: 8,
    backgroundColor: '#666666',
  },
  emptyContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#999',
  },
  emptyButton: {
    marginTop: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666666',
  },
  currentUserTitle: {
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 8,
  },
}); 