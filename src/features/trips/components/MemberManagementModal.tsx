import React, { useState } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, List, Avatar, IconButton, Divider, Snackbar } from 'react-native-paper';
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
import { AppBottomSheet } from '@/src/components/molecules/AppBottomSheet';

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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return {
          bg: theme.colors.primary.surface,
          text: theme.colors.primary.main,
        };
      case 'admin':
        return {
          bg: theme.colors.status.info.surface,
          text: theme.colors.status.info.content,
        };
      default:
        return {
          bg: theme.colors.surface.variant,
          text: theme.colors.content.tertiary,
        };
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
    const memberRole = item.role || 'member';

    const RoleIcon = memberRole === 'owner' ? Crown : memberRole === 'admin' ? Shield : User;
    const roleColor = getRoleColor(memberRole);

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

    return (
      <View style={styles(theme).memberItemContainer}>
        <View style={styles(theme).memberRow}>
          <View style={styles(theme).memberAvatarWrapper}>{renderMemberAvatar(item)}</View>
          <View style={styles(theme).memberInfo}>
            <View style={styles(theme).memberNameRow}>
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.content.primary, flexShrink: 1 }}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              {isCurrentUser && (
                <Text
                  variant="labelSmall"
                  style={{
                    color: theme.colors.content.tertiary,
                    marginLeft: theme.spacing.inline.xs,
                  }}
                >
                  (you)
                </Text>
              )}
            </View>
            <View style={styles(theme).memberMetaRow}>
              <View style={[styles(theme).roleBadge, { backgroundColor: roleColor.bg }]}>
                <RoleIcon color={roleColor.text} size={12} />
                <Text
                  variant="labelSmall"
                  style={{
                    color: roleColor.text,
                    marginLeft: 4,
                  }}
                >
                  {getRoleLabel(memberRole)}
                </Text>
              </View>
              {item.joinedAt && (
                <Text variant="labelSmall" style={{ color: theme.colors.content.tertiary }}>
                  {formatRelativeTime(new Date(item.joinedAt))}
                </Text>
              )}
            </View>
          </View>
          <View style={styles(theme).memberActionsContainer}>
            {canManageThisMember && (
              <Menu
                visible={menuVisible === item.userId}
                onDismiss={() => setMenuVisible(null)}
                anchor={
                  <IconButton
                    icon={MoreVertical}
                    size={20}
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
        </View>
      </View>
    );
  };

  const renderInvitationItem = ({ item }: { item: TripInvitation }) => {
    const expiry = item.expiresAt ? getExpiryText(item.expiresAt) : null;
    const isPending = item.status === 'pending';

    return (
      <View style={styles(theme).invitationItemContainer}>
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
      </View>
    );
  };

  const renderLoadingSkeleton = () => (
    <View style={styles(theme).loadingContainer}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles(theme).skeletonItem}>
          <View style={styles(theme).skeletonRow}>
            <View style={styles(theme).skeletonAvatar} />
            <View style={styles(theme).skeletonTextContainer}>
              <View style={[styles(theme).skeletonLine, { width: '60%' }]} />
              <View style={[styles(theme).skeletonLine, { width: '40%', marginTop: 6 }]} />
            </View>
          </View>
        </View>
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
    <>
      <AppBottomSheet
        visible={visible}
        onClose={onClose}
        snapPoints={['55%', '85%']}
        scrollable={true}
      >
        {/* Header row: title with count + invite button */}
        <View style={styles(theme).header}>
          <View style={styles(theme).headerTitleRow}>
            <Text
              variant="titleLarge"
              style={{ color: theme.colors.content.primary, fontWeight: '600' }}
            >
              Members
            </Text>
            {!isMembersLoading && !isMembersError && (
              <View style={styles(theme).countBadge}>
                <Text variant="labelSmall" style={{ color: theme.colors.content.tertiary }}>
                  {memberCount}
                </Text>
              </View>
            )}
          </View>
          {canCreateInvitation && (
            <IconButton
              icon={UserPlus}
              size={22}
              onPress={() => setShowInviteModal(true)}
              accessibilityLabel="Invite a new member"
              accessibilityRole="button"
              style={{ margin: 0 }}
            />
          )}
        </View>

        {/* Member list */}
        <View style={styles(theme).sectionContainer}>
          {isMembersLoading
            ? renderLoadingSkeleton()
            : isMembersError
              ? renderErrorState()
              : members.map((member) => (
                  <View key={member.userId}>{renderMemberItem({ item: member })}</View>
                ))}
        </View>

        {/* Pending invitations */}
        {trip.invitations && trip.invitations.length > 0 && (
          <View style={styles(theme).sectionContainer}>
            <Text variant="labelLarge" style={styles(theme).sectionLabel}>
              Pending Invitations ({trip.invitations.length})
            </Text>
            {trip.invitations.map((invitation) => (
              <View key={invitation.token}>{renderInvitationItem({ item: invitation })}</View>
            ))}
          </View>
        )}

        {/* Leave trip - subtle text link at the bottom */}
        {!isCurrentUserOwner && user && (
          <TouchableOpacity
            onPress={handleLeaveTrip}
            disabled={loading}
            style={styles(theme).leaveContainer}
            accessibilityLabel="Leave this trip"
            accessibilityRole="button"
          >
            <LogOut size={16} color={theme.colors.status.error.content} />
            <Text
              variant="labelLarge"
              style={{
                color: theme.colors.status.error.content,
                marginLeft: theme.spacing.inline.xs,
              }}
            >
              Leave Trip
            </Text>
          </TouchableOpacity>
        )}
      </AppBottomSheet>

      {/* InviteModal and Snackbar rendered outside AppBottomSheet -- they create their own portals */}
      <InviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        tripId={trip.id}
      />

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
        action={{ label: 'OK', onPress: () => setSnackbar({ visible: false, message: '' }) }}
      >
        {snackbar.message}
      </Snackbar>
    </>
  );
};

const styles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.stack.md,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.inline.sm,
    },
    countBadge: {
      backgroundColor: theme.colors.surface.variant,
      paddingHorizontal: theme.spacing.inline.sm,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.full,
      minWidth: 24,
      alignItems: 'center',
    },
    sectionContainer: {
      marginBottom: theme.spacing.stack.md,
    },
    sectionLabel: {
      color: theme.colors.content.secondary,
      marginBottom: theme.spacing.stack.sm,
      paddingHorizontal: theme.spacing.inline.xs,
    },
    memberItemContainer: {
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      borderRadius: theme.borderRadius.sm,
      marginBottom: theme.spacing.stack.xs,
      backgroundColor: theme.colors.background.card,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.inset.sm,
      paddingHorizontal: theme.spacing.inset.md,
    },
    memberAvatarWrapper: {
      marginRight: theme.spacing.inline.md,
    },
    memberInfo: {
      flex: 1,
    },
    memberNameRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    memberMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      gap: theme.spacing.inline.sm,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.inline.sm,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.full,
    },
    memberActionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: theme.spacing.inline.xs,
    },
    invitationItemContainer: {
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      borderRadius: theme.borderRadius.sm,
      marginBottom: theme.spacing.stack.xs,
      borderStyle: 'dashed',
      backgroundColor: theme.colors.background.card,
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
    leaveContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.stack.md,
      marginTop: theme.spacing.stack.sm,
    },
    loadingContainer: {
      paddingVertical: theme.spacing.stack.sm,
    },
    skeletonItem: {
      borderRadius: theme.borderRadius.sm,
      marginBottom: theme.spacing.stack.xs,
      padding: theme.spacing.inset.md,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      backgroundColor: theme.colors.background.card,
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
