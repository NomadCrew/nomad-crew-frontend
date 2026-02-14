import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  List,
  Avatar,
  Surface,
  IconButton,
  Divider,
  Snackbar,
} from 'react-native-paper';
import {
  Crown,
  Shield,
  User,
  MoreVertical,
  UserPlus,
  AlertCircle,
  Clock,
  LogOut,
} from 'lucide-react-native';
import { Menu } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { Trip, TripMemberResponse } from '@/src/features/trips/types';
import { useAuthStore } from '@/src/features/auth/store';
import { useTripMembers, useUpdateMemberRole, useRemoveMember } from '@/src/features/trips/hooks';
import { InviteModal } from './InviteModal';
import { useIsOwner, useIsAdminOrOwner, usePermission } from '@/src/features/auth/permissions';
import { formatRelativeTime } from '@/src/utils/dateUtils';

interface MemberManagementModalProps {
  visible: boolean;
  onClose: () => void;
  trip: Trip;
}

type TripMember = {
  userId: string;
  name?: string;
  avatarUrl?: string;
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
  const updateMemberRoleMutation = useUpdateMemberRole();
  const removeMemberMutation = useRemoveMember();
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  const {
    data: memberResponses,
    isLoading: isMembersLoading,
    isError: isMembersError,
    refetch: refetchMembers,
    isRefetching,
  } = useTripMembers(visible ? trip.id : '');

  const showSnackbar = (message: string) => {
    setSnackbar({ visible: true, message });
  };

  const getDisplayName = (userObj: any): string => {
    if (!userObj) return 'Trip Member';
    if (userObj.displayName) return userObj.displayName;
    if (userObj.firstName && userObj.lastName) return `${userObj.firstName} ${userObj.lastName}`;
    if (userObj.firstName) return userObj.firstName;
    if (userObj.lastName) return userObj.lastName;
    if (userObj.username && userObj.username.trim() !== '') return userObj.username;
    if (userObj.email) {
      const emailName = userObj.email.split('@')[0];
      if (emailName.includes('.')) {
        return emailName
          .split('.')
          .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return 'Trip Member';
  };

  const members = React.useMemo(() => {
    if (memberResponses && memberResponses.length > 0) {
      return memberResponses.map((mr: TripMemberResponse) => ({
        userId: mr.membership.userId,
        name: getDisplayName(mr.user),
        avatarUrl: mr.user.avatarUrl,
        role: mr.membership.role.toLowerCase() as 'owner' | 'admin' | 'member',
        joinedAt: mr.membership.createdAt,
      }));
    }

    const membersList =
      Array.isArray(trip.members) && trip.members.length > 0 ? [...trip.members] : [];

    const creatorExists = membersList.some((member) => member.userId === trip.createdBy);
    if (!creatorExists && trip.createdBy) {
      const creatorName = user && user.id === trip.createdBy ? getDisplayName(user) : undefined;
      membersList.push({
        userId: trip.createdBy,
        name: creatorName,
        role: 'owner',
        joinedAt: trip.createdAt,
      });
    }

    if (user && !membersList.some((member) => member.userId === user.id)) {
      const role = user.id === trip.createdBy ? 'owner' : 'member';
      membersList.push({
        userId: user.id,
        name: getDisplayName(user),
        role: role,
        joinedAt: new Date().toISOString(),
      });
    }

    membersList.forEach((member) => {
      if (!member.name && member.userId === user?.id) {
        member.name = getDisplayName(user);
      } else if (!member.name) {
        member.name = `Member ${member.userId.substring(0, 4)}`;
      }
    });

    return membersList;
  }, [memberResponses, trip.members, trip.createdBy, trip.createdAt, user]);

  const isOwner = useIsOwner();
  const canManageMembers = useIsAdminOrOwner();
  const canCreateInvitation = usePermission('create', 'Invitation');

  const handleRoleChange = async (
    memberId: string,
    memberName: string,
    newRole: 'owner' | 'admin' | 'member'
  ) => {
    const roleLabel = newRole === 'owner' ? 'Owner' : newRole === 'admin' ? 'Admin' : 'Member';
    Alert.alert(
      'Change Role',
      `Change ${memberName}'s role to ${roleLabel}?${newRole === 'owner' ? '\n\nThis will transfer trip ownership. You will become an Admin.' : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setLoading(true);
              await updateMemberRoleMutation.mutateAsync({
                tripId: trip.id,
                userId: memberId,
                role: newRole,
              });
              setMenuVisible(null);
              showSnackbar(`${memberName} is now ${roleLabel}`);
            } catch (error) {
              Alert.alert('Error', 'Failed to update member role');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    Alert.alert('Remove Member', `Remove ${memberName} from the trip?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await removeMemberMutation.mutateAsync({ tripId: trip.id, userId: memberId });
            setMenuVisible(null);
            showSnackbar(`${memberName} has been removed`);
          } catch (error) {
            Alert.alert('Error', 'Failed to remove member');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleLeaveTrip = () => {
    if (!user) return;
    Alert.alert(
      'Leave Trip',
      'Are you sure you want to leave this trip? You will lose access unless re-invited.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await removeMemberMutation.mutateAsync({ tripId: trip.id, userId: user.id });
              showSnackbar('You have left the trip');
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to leave the trip');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getInitials = (userId: string, name?: string) => {
    if (name) {
      const nameParts = name.split(' ').filter((part) => part.length > 0);
      if (
        nameParts.length >= 2 &&
        nameParts[0] &&
        nameParts[1] &&
        nameParts[0][0] &&
        nameParts[1][0]
      ) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      } else if (nameParts.length === 1 && nameParts[0] && nameParts[0].length >= 2) {
        return nameParts[0].substring(0, 2).toUpperCase();
      }
    }

    if (user && userId === user.id) {
      if (user.firstName && user.firstName[0] && user.lastName && user.lastName[0]) {
        return (user.firstName[0] + user.lastName[0]).toUpperCase();
      } else if (user.email) {
        const emailName = user.email.split('@')[0];
        if (emailName && emailName.includes('.')) {
          const parts = emailName.split('.').filter((part) => part.length > 0);
          if (parts[0] && parts[1] && parts[0][0] && parts[1][0]) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
          }
        }
      }
    }

    return userId.substring(0, 2).toUpperCase();
  };

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

  const getExpiryText = (expiresAt: string): { text: string; isExpiringSoon: boolean } => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursLeft <= 0) {
      return { text: 'Expired', isExpiringSoon: false };
    }
    if (hoursLeft < 24) {
      const hours = Math.ceil(hoursLeft);
      return { text: `Expires in ${hours}h`, isExpiringSoon: true };
    }
    const days = Math.ceil(hoursLeft / 24);
    return { text: `Expires in ${days}d`, isExpiringSoon: days <= 2 };
  };

  const handleRefresh = useCallback(() => {
    refetchMembers();
  }, [refetchMembers]);

  const renderMemberAvatar = (item: TripMember) => {
    if (item.avatarUrl) {
      return (
        <Avatar.Image
          size={40}
          source={{ uri: item.avatarUrl }}
          style={{ backgroundColor: theme.colors.primary.surface }}
        />
      );
    }
    return (
      <Avatar.Text
        size={40}
        label={getInitials(item.userId, item.name)}
        style={{ backgroundColor: theme.colors.primary.surface }}
        color={theme.colors.content.onSurface}
      />
    );
  };

  const renderMemberItem = ({ item }: { item: TripMember }) => {
    const isCurrentUser = item.userId === user?.id;
    const isCreator = item.userId === trip.createdBy;
    const memberRole = item.role || 'member';

    const RoleIcon = memberRole === 'owner' ? Crown : memberRole === 'admin' ? Shield : User;

    const canManageThisMember =
      !isCurrentUser &&
      ((isOwner && memberRole !== 'owner') ||
        (canManageMembers && !isOwner && memberRole === 'member'));

    let displayName = item.name;
    if (!displayName) {
      if (isCurrentUser && user) {
        if (user.email) {
          const emailName = user.email.split('@')[0];
          if (emailName && emailName.includes('.')) {
            displayName = emailName
              .split('.')
              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
              .join(' ');
          } else if (emailName) {
            displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          } else {
            displayName = 'You';
          }
        } else {
          displayName = 'You';
        }
      } else {
        displayName = `Member ${item.userId.substring(0, 4)}`;
      }
    }

    const descriptionParts: string[] = [];
    if (isCurrentUser) descriptionParts.push('You');
    descriptionParts.push(getRoleLabel(memberRole));
    if (item.joinedAt) {
      descriptionParts.push(`Joined ${formatRelativeTime(new Date(item.joinedAt))}`);
    }

    return (
      <Surface style={styles(theme).memberItemSurface} elevation={1}>
        <List.Item
          title={displayName}
          description={descriptionParts.join(' \u00B7 ')}
          accessibilityLabel={`${displayName}, ${getRoleLabel(memberRole)}${isCurrentUser ? ', you' : ''}`}
          accessibilityRole="button"
          left={() => renderMemberAvatar(item)}
          right={() => (
            <View style={styles(theme).memberActionsContainer}>
              <RoleIcon
                color={theme.colors.content.secondary}
                size={20}
                style={{ marginRight: canManageThisMember ? 8 : 0 }}
              />
              {canManageThisMember && (
                <Menu
                  visible={menuVisible === item.userId}
                  onDismiss={() => setMenuVisible(null)}
                  anchor={
                    <IconButton
                      icon={MoreVertical}
                      onPress={() => setMenuVisible(item.userId)}
                      accessibilityLabel={`Actions for ${displayName}`}
                      accessibilityRole="button"
                    />
                  }
                >
                  {isOwner && (
                    <Menu.Item
                      onPress={() => handleRoleChange(item.userId, displayName || '', 'owner')}
                      title="Make Owner"
                    />
                  )}
                  {canManageMembers && memberRole !== 'admin' && (
                    <Menu.Item
                      onPress={() => handleRoleChange(item.userId, displayName || '', 'admin')}
                      title="Make Admin"
                    />
                  )}
                  {canManageMembers && memberRole !== 'member' && (
                    <Menu.Item
                      onPress={() => handleRoleChange(item.userId, displayName || '', 'member')}
                      title="Make Member"
                    />
                  )}
                  <Divider />
                  <Menu.Item
                    onPress={() => handleRemoveMember(item.userId, displayName || '')}
                    title="Remove from Trip"
                    titleStyle={{ color: theme.colors.error.main }}
                  />
                </Menu>
              )}
            </View>
          )}
          style={styles(theme).listItem}
        />
      </Surface>
    );
  };

  const renderInvitationItem = ({ item }: { item: TripInvitation }) => {
    const expiry = item.expiresAt ? getExpiryText(item.expiresAt) : null;
    const isPending = item.status === 'pending';

    return (
      <Surface style={styles(theme).invitationItemSurface} elevation={0}>
        <List.Item
          title={item.email}
          titleStyle={styles(theme).invitationTitle}
          description={() => (
            <View style={styles(theme).invitationDescriptionRow}>
              <View
                style={[
                  styles(theme).statusBadge,
                  {
                    backgroundColor: isPending
                      ? theme.colors.warning?.surface || theme.colors.surface.variant
                      : theme.colors.surface.variant,
                  },
                ]}
              >
                <Text
                  variant="labelSmall"
                  style={{
                    color: isPending
                      ? theme.colors.warning?.main || theme.colors.content.secondary
                      : theme.colors.content.secondary,
                  }}
                >
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
              {expiry && (
                <View style={styles(theme).expiryContainer}>
                  <Clock
                    size={12}
                    color={
                      expiry.isExpiringSoon
                        ? theme.colors.warning?.main || theme.colors.content.secondary
                        : theme.colors.content.secondary
                    }
                  />
                  <Text
                    variant="labelSmall"
                    style={{
                      color: expiry.isExpiringSoon
                        ? theme.colors.warning?.main || theme.colors.content.secondary
                        : theme.colors.content.secondary,
                      marginLeft: 4,
                    }}
                  >
                    {expiry.text}
                  </Text>
                </View>
              )}
            </View>
          )}
          left={() => (
            <Avatar.Icon
              size={40}
              icon="email-outline"
              style={{ backgroundColor: theme.colors.surface.variant }}
              color={theme.colors.content.secondary}
            />
          )}
          accessibilityLabel={`Invitation to ${item.email}, status ${item.status}`}
          style={styles(theme).listItem}
        />
      </Surface>
    );
  };

  const renderLoadingSkeleton = () => (
    <View style={styles(theme).loadingContainer}>
      {[1, 2, 3].map((i) => (
        <Surface key={i} style={styles(theme).skeletonItem} elevation={0}>
          <View style={styles(theme).skeletonRow}>
            <View style={styles(theme).skeletonAvatar} />
            <View style={styles(theme).skeletonTextContainer}>
              <View style={[styles(theme).skeletonLine, { width: '60%' }]} />
              <View style={[styles(theme).skeletonLine, { width: '40%', marginTop: 6 }]} />
            </View>
          </View>
        </Surface>
      ))}
    </View>
  );

  const renderErrorState = () => (
    <View style={styles(theme).errorContainer}>
      <AlertCircle size={40} color={theme.colors.status.error.content} />
      <Text
        variant="bodyMedium"
        style={[styles(theme).errorText, { color: theme.colors.content.secondary }]}
      >
        Could not load members
      </Text>
      <Button
        mode="outlined"
        onPress={() => refetchMembers()}
        style={styles(theme).retryButton}
        accessibilityLabel="Retry loading members"
        accessibilityRole="button"
      >
        Retry
      </Button>
    </View>
  );

  const isCurrentUserOwner = user?.id === trip.createdBy;
  const memberCount = members.length;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[styles(theme).modalContainer, { overflow: 'hidden' }]}
      >
        <View style={[styles(theme).content, { backgroundColor: theme.colors.background.default }]}>
          <View style={styles(theme).header}>
            <View style={styles(theme).headerTitleRow}>
              <Text variant="headlineSmall">Manage Members</Text>
              {!isMembersLoading && !isMembersError && (
                <Text
                  variant="labelLarge"
                  style={{ color: theme.colors.content.secondary, marginLeft: 8 }}
                >
                  ({memberCount})
                </Text>
              )}
            </View>
            {canCreateInvitation && (
              <IconButton
                icon={UserPlus}
                size={24}
                onPress={() => setShowInviteModal(true)}
                accessibilityLabel="Invite a new member"
                accessibilityRole="button"
              />
            )}
          </View>

          <ScrollView
            style={styles(theme).scrollView}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primary.main}
                colors={[theme.colors.primary.main]}
              />
            }
          >
            <List.Section>
              <List.Subheader accessibilityRole="header">Members</List.Subheader>
              {isMembersLoading
                ? renderLoadingSkeleton()
                : isMembersError
                  ? renderErrorState()
                  : members.map((member) => (
                      <View key={member.userId}>{renderMemberItem({ item: member })}</View>
                    ))}
            </List.Section>

            {trip.invitations && trip.invitations.length > 0 && (
              <List.Section>
                <List.Subheader accessibilityRole="header">
                  Pending Invitations ({trip.invitations.length})
                </List.Subheader>
                {trip.invitations.map((invitation) => (
                  <View key={invitation.token}>{renderInvitationItem({ item: invitation })}</View>
                ))}
              </List.Section>
            )}
          </ScrollView>

          <View style={styles(theme).footer}>
            {!isCurrentUserOwner && user && (
              <Button
                mode="text"
                onPress={handleLeaveTrip}
                textColor={theme.colors.status.error.content}
                icon={({ size, color }) => <LogOut size={size} color={color} />}
                style={styles(theme).leaveButton}
                accessibilityLabel="Leave this trip"
                accessibilityRole="button"
                disabled={loading}
              >
                Leave Trip
              </Button>
            )}
            <Button
              onPress={onClose}
              mode="outlined"
              style={styles(theme).closeButton}
              accessibilityLabel="Close member management"
              accessibilityRole="button"
            >
              Close
            </Button>
          </View>

          <InviteModal
            visible={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            tripId={trip.id}
          />
        </View>
      </Modal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
        action={{ label: 'OK', onPress: () => setSnackbar({ visible: false, message: '' }) }}
      >
        {snackbar.message}
      </Snackbar>
    </Portal>
  );
};

const styles = (theme: Theme) => {
  const screenWidth = Dimensions.get('window').width;
  const horizontalPadding = 24;
  const modalWidth = screenWidth - 2 * horizontalPadding;

  return StyleSheet.create({
    modalContainer: {
      alignSelf: 'center',
      width: modalWidth,
      marginHorizontal: horizontalPadding,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.inset.lg,
      maxHeight: '85%',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.stack.md,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    scrollView: {
      flexGrow: 0,
      flexShrink: 1,
    },
    memberItemSurface: {
      borderRadius: theme.borderRadius.sm,
      marginBottom: theme.spacing.stack.xs,
    },
    invitationItemSurface: {
      borderRadius: theme.borderRadius.sm,
      marginBottom: theme.spacing.stack.xs,
      borderWidth: 1,
      borderColor: theme.colors.surface.variant,
      borderStyle: 'dashed',
    },
    invitationTitle: {
      color: theme.colors.content.secondary,
    },
    invitationDescriptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.xs,
    },
    expiryContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    listItem: {},
    memberActionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    footer: {
      marginTop: theme.spacing.stack.md,
    },
    leaveButton: {
      marginBottom: theme.spacing.stack.sm,
    },
    closeButton: {},
    content: {
      width: '100%',
      overflow: 'hidden',
    },
    loadingContainer: {
      paddingVertical: theme.spacing.stack.sm,
    },
    skeletonItem: {
      borderRadius: theme.borderRadius.sm,
      marginBottom: theme.spacing.stack.xs,
      padding: theme.spacing.inset.md,
    },
    skeletonRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    skeletonAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surface.variant,
    },
    skeletonTextContainer: {
      marginLeft: 16,
      flex: 1,
    },
    skeletonLine: {
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.surface.variant,
    },
    errorContainer: {
      alignItems: 'center',
      paddingVertical: theme.spacing.stack.lg,
    },
    errorText: {
      marginTop: theme.spacing.stack.sm,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: theme.spacing.stack.md,
    },
  });
};
