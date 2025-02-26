import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Portal, Modal, Text, Button, Menu, Divider, List, Avatar, IconButton, useTheme, Chip } from 'react-native-paper';
import { Trip } from '@/src/types/trip';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useTripStore } from '@/src/store/useTripStore';
import { Theme } from '@/src/theme/types';
import { MoreVertical, UserPlus, Crown, Shield, User } from 'lucide-react-native';
import { InviteModal } from './InviteModal';

interface MemberManagementModalProps {
  visible: boolean;
  onClose: () => void;
  trip: Trip;
}

export const MemberManagementModal = ({ visible, onClose, trip }: MemberManagementModalProps) => {
  const theme = useTheme();
  const { user } = useAuthStore();
  const { updateMemberRole, removeMember } = useTripStore();
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Create a fallback theme object to handle any missing theme properties
  const safeTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      primary: {
        main: theme.colors?.primary?.main || '#0066cc',
        dark: theme.colors?.primary?.dark || '#8800cc',
        light: theme.colors?.primary?.light || '#666666',
        hover: theme.colors?.primary?.hover || '#0077dd',
        pressed: theme.colors?.primary?.pressed || '#0055bb',
        disabled: theme.colors?.primary?.disabled || '#cccccc',
        text: theme.colors?.primary?.text || '#ffffff',
      },
      content: {
        primary: theme.colors?.content?.primary || '#000000',
        secondary: theme.colors?.content?.secondary || '#666666',
        tertiary: theme.colors?.content?.tertiary || '#999999',
        disabled: theme.colors?.content?.disabled || '#cccccc',
        onImage: theme.colors?.content?.onImage || '#ffffff',
      },
      background: theme.colors?.background || '#ffffff',
      surface: {
        default: theme.colors?.surface?.default || '#ffffff',
        variant: theme.colors?.surface?.variant || '#f5f5f5',
      },
      border: {
        default: theme.colors?.border?.default || '#e0e0e0',
      },
      error: theme.colors?.error || '#ff0000',
      text: {
        primary: theme.colors?.text?.primary || '#000000',
        secondary: theme.colors?.text?.secondary || '#666666',
        disabled: theme.colors?.text?.disabled || '#999999',
      },
    }
  };

  // Debug trip data when modal becomes visible
  useEffect(() => {
    if (visible) {
      console.log('MemberManagementModal opened with trip:', trip);
      console.log('Trip members:', trip.members);
      console.log('Current user:', user);
      
      // Additional detailed logging
      if (trip.members && trip.members.length > 0) {
        console.log('Member IDs in trip:', trip.members.map(m => m.userId));
        if (user) {
          console.log('Current user ID:', user.id);
          console.log('Is current user in members list?', trip.members.some(m => m.userId === user.id));
          
          const currentUserMember = trip.members.find(m => m.userId === user.id);
          if (currentUserMember) {
            console.log('Current user member details:', currentUserMember);
          } else {
            console.log('Current user is NOT in the members list');
          }
        } else {
          console.log('No current user available');
        }
      } else {
        console.log('No members in trip');
      }
    }
  }, [visible, trip, user]);

  // Ensure members array exists and includes the creator as owner if empty
  const members = React.useMemo(() => {
    // If members array exists, use it as a starting point
    const membersList = trip.members && trip.members.length > 0 
      ? [...trip.members] 
      : [];
    
    // Ensure creator is in the list with owner role
    const creatorExists = membersList.some(member => member.userId === trip.createdBy);
    if (!creatorExists && trip.createdBy) {
      console.log('Adding creator to members list with owner role');
      membersList.push({
        userId: trip.createdBy,
        role: 'owner',
        joinedAt: trip.createdAt
      });
    }
    
    // Ensure current user is in the list if they're not already
    if (user && !membersList.some(member => member.userId === user.id)) {
      console.log('Adding current user to members list');
      // Determine the role based on whether they're the creator
      const role = user.id === trip.createdBy ? 'owner' : 'member';
      membersList.push({
        userId: user.id,
        role: role,
        joinedAt: new Date().toISOString()
      });
    }
    
    console.log('Final members list:', membersList);
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

  // Function to get initials from user ID (in a real app, you'd have user details)
  const getInitials = (userId: string) => {
    // This is a placeholder - in a real app, you'd get the user's name
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

  // Function to get role icon
  const getRoleIcon = (role: string, size: number, color: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={size} color={color} />;
      case 'admin':
        return <Shield size={size} color={color} />;
      default:
        return <User size={size} color={color} />;
    }
  };

  // Function to get role chip color
  const getRoleChipStyle = (role: string) => {
    switch (role) {
      case 'owner':
        return styles(safeTheme).ownerChip;
      case 'admin':
        return styles(safeTheme).adminChip;
      default:
        return styles(safeTheme).memberChip;
    }
  };

  // Render member item
  const renderMemberItem = ({ item }: { item: Trip['members'][0] }) => {
    console.log('Rendering member item:', item);
    const isCurrentUser = item.userId === user?.id;
    const memberRole = item.role;
    const isCreator = trip.createdBy === item.userId;
    
    console.log(`Member ${item.userId}: isCurrentUser=${isCurrentUser}, role=${memberRole}, isCreator=${isCreator}`);
    
    // Owner can manage everyone except themselves
    // Admin can manage members but not other admins or owners
    const canManageThisMember = 
      (isOwner && !isCurrentUser) || 
      (isAdmin && memberRole === 'member');

    return (
      <List.Item
        title={isCurrentUser 
          ? `You (${getInitials(item.userId)})` 
          : `User ${getInitials(item.userId)}`
        }
        titleStyle={isCurrentUser ? styles(safeTheme).currentUserTitle : undefined}
        description={
          <View style={styles(safeTheme).chipContainer}>
            <Chip 
              mode="outlined"
              style={[
                styles(safeTheme).roleChip, 
                getRoleChipStyle(memberRole),
                isCurrentUser && styles(safeTheme).currentUserChip
              ]}
              textStyle={styles(safeTheme).chipText}
              icon={({size, color}) => getRoleIcon(memberRole, size-4, color)}
            >
              {getRoleLabel(memberRole)}
            </Chip>
            {isCreator && (
              <Chip 
                mode="outlined"
                style={[
                  styles(safeTheme).creatorChip,
                  isCurrentUser && styles(safeTheme).currentUserCreatorChip
                ]}
                textStyle={styles(safeTheme).chipText}
              >
                Creator
              </Chip>
            )}
            {isCurrentUser && (
              <Chip 
                mode="outlined"
                style={styles(safeTheme).youChip}
                textStyle={styles(safeTheme).chipText}
              >
                You
              </Chip>
            )}
          </View>
        }
        left={props => (
          <Avatar.Text 
            {...props} 
            size={40} 
            label={getInitials(item.userId)} 
            style={[
              styles(safeTheme).avatar,
              memberRole === 'owner' ? styles(safeTheme).ownerAvatar : 
              memberRole === 'admin' ? styles(safeTheme).adminAvatar : 
              styles(safeTheme).memberAvatar,
              isCurrentUser && styles(safeTheme).currentUserAvatar
            ]}
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
                  icon={({ size, color }) => <MoreVertical size={size} color={color} />}
                  onPress={() => setMenuVisible(item.userId)}
                />
              }
            >
              {isOwner && memberRole !== 'owner' && (
                <Menu.Item 
                  onPress={() => handleRoleChange(item.userId, 'owner')} 
                  title="Make Owner" 
                  disabled={loading}
                />
              )}
              {(isOwner || isAdmin) && memberRole !== 'admin' && (
                <Menu.Item 
                  onPress={() => handleRoleChange(item.userId, 'admin')} 
                  title="Make Admin" 
                  disabled={loading}
                />
              )}
              {memberRole !== 'member' && (
                <Menu.Item 
                  onPress={() => handleRoleChange(item.userId, 'member')} 
                  title="Make Member" 
                  disabled={loading}
                />
              )}
              <Divider />
              <Menu.Item 
                onPress={() => handleRemoveMember(item.userId)} 
                title="Remove" 
                disabled={loading}
              />
            </Menu>
          ) : null
        }
      />
    );
  };

  // Render pending invitations
  const renderInvitationItem = ({ item }: { item: Trip['invitations'][0] }) => (
    <List.Item
      title={item.email}
      description={
        <Chip 
          mode="outlined"
          style={styles(safeTheme).pendingChip}
          textStyle={styles(safeTheme).chipText}
        >
          {`Invited • ${item.status}`}
        </Chip>
      }
      left={props => (
        <Avatar.Icon 
          {...props} 
          size={40} 
          icon={({ size, color }) => <UserPlus size={size-16} color={color} />}
          style={styles(safeTheme).avatar}
        />
      )}
    />
  );

  // Sort members to show owner first, then admins, then regular members
  const sortedMembers = React.useMemo(() => {
    console.log('Sorting members array:', members);
    if (!members.length) {
      console.log('No members to sort');
      return [];
    }
    
    const sorted = [...members].sort((a, b) => {
      const roleOrder = { owner: 0, admin: 1, member: 2 };
      return (roleOrder[a.role] || 2) - (roleOrder[b.role] || 2);
    });
    
    console.log('Sorted members result:', sorted);
    return sorted;
  }, [members]);

  console.log('Sorted members:', sortedMembers);

  return (
    <>
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onClose}
          contentContainerStyle={[
            styles(safeTheme).modalContainer,
            { backgroundColor: safeTheme.colors?.background || '#ffffff' }
          ]}
        >
          <View style={styles(safeTheme).header}>
            <Text variant="titleLarge">Trip Members</Text>
            {canManageMembers && (
              <Button 
                mode="contained" 
                onPress={() => {
                  setShowInviteModal(true);
                }}
              >
                Invite
              </Button>
            )}
          </View>

          <Divider />
          
          <View style={styles(safeTheme).content}>
            <Text variant="titleMedium" style={styles(safeTheme).sectionTitle}>Members</Text>
            
            {__DEV__ && (
              <View style={styles(safeTheme).debugContainer}>
                <Text style={styles(safeTheme).debugText}>
                  Debug: {members.length} members found. 
                  {user ? `Current user: ${user.id.substring(0, 8)}...` : 'No current user'}
                  {members.some(m => m.userId === user?.id) 
                    ? ' (You are in the list)' 
                    : ' (You are NOT in the list)'}
                </Text>
              </View>
            )}
            
            <FlatList
              data={sortedMembers}
              keyExtractor={(item) => item.userId}
              renderItem={renderMemberItem}
              ItemSeparatorComponent={Divider}
              contentContainerStyle={styles(safeTheme).listContent}
              ListHeaderComponent={
                sortedMembers.length > 0 ? (
                  <Text style={styles(safeTheme).listHeader}>
                    {sortedMembers.length} member{sortedMembers.length !== 1 ? 's' : ''} in this trip
                  </Text>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles(safeTheme).emptyContainer}>
                  <Text style={styles(safeTheme).emptyText}>
                    No members yet. As the trip owner, you can invite others to join this trip.
                  </Text>
                  {canManageMembers && (
                    <Button 
                      mode="contained" 
                      onPress={() => setShowInviteModal(true)}
                      style={styles(safeTheme).emptyButton}
                    >
                      Invite People
                    </Button>
                  )}
                </View>
              }
            />

            {trip.invitations && trip.invitations.length > 0 && (
              <>
                <Text variant="titleMedium" style={[styles(safeTheme).sectionTitle, { marginTop: 16 }]}>
                  Pending Invitations
                </Text>
                <FlatList
                  data={trip.invitations}
                  keyExtractor={(item) => item.email}
                  renderItem={renderInvitationItem}
                  ItemSeparatorComponent={Divider}
                />
              </>
            )}
          </View>

          <View style={styles(safeTheme).footer}>
            <Button mode="outlined" onPress={onClose}>
              Close
            </Button>
          </View>
        </Modal>
      </Portal>

      <InviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        tripId={trip.id}
      />
    </>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  modalContainer: {
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  footer: {
    padding: 16,
    alignItems: 'flex-end',
  },
  sectionTitle: {
    marginBottom: 8,
  },
  avatar: {
    backgroundColor: theme.colors.primary?.main || '#0066cc',
  },
  ownerAvatar: {
    backgroundColor: theme.colors.primary?.dark || '#8800cc',
  },
  adminAvatar: {
    backgroundColor: theme.colors.primary?.main || '#0066cc',
  },
  memberAvatar: {
    backgroundColor: theme.colors.primary?.light || '#666666',
  },
  emptyContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
    color: theme.colors.text?.secondary || theme.colors.text?.disabled || '#999',
  },
  emptyButton: {
    marginTop: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  roleChip: {
    marginRight: 8,
    marginTop: 4,
    height: 24,
  },
  ownerChip: {
    backgroundColor: 'rgba(136, 0, 204, 0.1)',
    borderColor: theme.colors.primary?.dark || '#8800cc',
  },
  adminChip: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    borderColor: theme.colors.primary?.main || '#0066cc',
  },
  memberChip: {
    backgroundColor: 'rgba(102, 102, 102, 0.1)',
    borderColor: theme.colors.primary?.light || '#666666',
  },
  creatorChip: {
    marginTop: 4,
    height: 24,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderColor: '#ffc107',
  },
  pendingChip: {
    marginTop: 4,
    height: 24,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderColor: '#ff9800',
  },
  chipText: {
    fontSize: 12,
  },
  currentUserTitle: {
    fontWeight: 'bold',
    color: theme.colors.primary?.main || '#0066cc',
  },
  currentUserChip: {
    borderWidth: 2,
  },
  currentUserCreatorChip: {
    borderWidth: 2,
  },
  youChip: {
    marginTop: 4,
    height: 24,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4caf50',
    borderWidth: 2,
  },
  currentUserAvatar: {
    borderWidth: 2,
    borderColor: theme.colors.primary?.main || '#0066cc',
  },
  debugContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: theme.colors.error || '#ff0000',
  },
  listContent: {
    paddingBottom: 8,
  },
  listHeader: {
    fontSize: 14,
    color: theme.colors.content?.secondary || '#666666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  actionLabel: {
    color: theme.colors.content?.secondary || '#666666',
    textAlign: 'center',
    marginTop: 2,
    fontSize: 11,
  },
}); 