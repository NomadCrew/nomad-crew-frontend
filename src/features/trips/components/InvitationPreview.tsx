import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar, Button } from 'react-native-paper';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { InvitationDetails, InvitationError } from '../types';
import {
  Calendar,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plane,
} from 'lucide-react-native';

interface InvitationPreviewProps {
  invitation: InvitationDetails | null;
  error: InvitationError | null;
  isLoading: boolean;
  isAccepting: boolean;
  isDeclining: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onAction?: () => void;
}

export const InvitationPreview: React.FC<InvitationPreviewProps> = ({
  invitation,
  error,
  isLoading,
  isAccepting,
  isDeclining,
  onAccept,
  onDecline,
  onAction,
}) => {
  const theme = useAppTheme().theme;
  const styles = createStyles(theme);
  const isDark = theme.dark ?? false;

  // Format date range
  const formatDateRange = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return 'Dates not specified';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  // Calculate days until expiration
  const getDaysUntilExpiry = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format role for display
  const formatRole = (role?: string) => {
    if (!role) return 'Member';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorHeader}>
          <AlertCircle size={56} color="#FFFFFF" style={{ opacity: 0.9 }} />
        </View>
        <View style={styles.errorCardBody}>
          <Text style={styles.errorTitle}>{error.title}</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          {error.action && onAction && (
            <Button
              mode="contained"
              onPress={onAction}
              style={styles.errorActionButton}
              labelStyle={styles.acceptButtonLabel}
              contentStyle={styles.buttonContent}
            >
              {error.action === 'go_to_trips' && 'Go to My Trips'}
              {error.action === 'switch_account' && 'Switch Account'}
              {error.action === 'view_trip' && 'View Trip'}
              {error.action === 'retry' && 'Try Again'}
            </Button>
          )}
        </View>
      </View>
    );
  }

  // Loading state
  if (isLoading || !invitation) {
    return (
      <View style={styles.container}>
        {/* Skeleton header */}
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonCircle} />
          <View style={styles.skeletonHeaderTitle} />
        </View>
        {/* Skeleton trip card */}
        <View style={styles.card}>
          <View style={styles.skeletonBlock} />
          <View style={[styles.skeletonLine, { width: '70%' }]} />
          <View style={[styles.skeletonLine, { width: '50%' }]} />
        </View>
        {/* Skeleton details card */}
        <View style={styles.card}>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonAvatar} />
            <View style={{ flex: 1, gap: 8 }}>
              <View style={[styles.skeletonLine, { width: '40%' }]} />
              <View style={[styles.skeletonLine, { width: '60%' }]} />
            </View>
          </View>
          <View style={[styles.skeletonLine, { width: '55%', marginTop: 16 }]} />
        </View>
        {/* Skeleton buttons */}
        <View style={styles.skeletonButton} />
        <View style={[styles.skeletonButton, { opacity: 0.5 }]} />
      </View>
    );
  }

  const daysUntilExpiry = getDaysUntilExpiry(invitation.expiresAt);

  return (
    <View style={styles.container}>
      {/* Warm Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerIconWrapper}>
          <Plane size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.headerTitle}>You're Invited!</Text>
        <Text style={styles.headerSubtitle}>Join an adventure that awaits</Text>
      </View>

      {/* Trip Card */}
      <View style={styles.card}>
        <Text style={styles.tripName}>{invitation.trip?.name || 'Trip'}</Text>

        {invitation.trip?.description && (
          <Text style={styles.tripDescription} numberOfLines={3}>
            {invitation.trip.description}
          </Text>
        )}

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.detailIconWrapper}>
            <Calendar size={16} color={isDark ? '#FCD34D' : '#D97706'} />
          </View>
          <Text style={styles.detailText}>
            {formatDateRange(invitation.trip?.startDate, invitation.trip?.endDate)}
          </Text>
        </View>
      </View>

      {/* Invitation Details Card */}
      <View style={styles.card}>
        {/* Inviter Info */}
        {invitation.inviter && (
          <View style={styles.inviterRow}>
            <Avatar.Text
              size={44}
              label={invitation.inviter.displayName?.substring(0, 2).toUpperCase() || 'U'}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
            <View style={styles.inviterInfo}>
              <Text style={styles.inviterLabel}>Invited by</Text>
              <Text style={styles.inviterName}>
                {invitation.inviter.displayName || invitation.inviter.username}
              </Text>
            </View>
          </View>
        )}

        {/* Role */}
        <View style={styles.detailRow}>
          <View style={styles.detailIconWrapper}>
            <Shield size={16} color={isDark ? '#FCD34D' : '#D97706'} />
          </View>
          <Text style={styles.detailText}>
            You'll join as <Text style={styles.roleText}>{formatRole(invitation.role)}</Text>
          </Text>
        </View>

        {/* Expiration */}
        {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
          <View style={styles.detailRow}>
            <View
              style={[styles.detailIconWrapper, daysUntilExpiry <= 2 && styles.warningIconWrapper]}
            >
              <Clock
                size={16}
                color={
                  daysUntilExpiry <= 2
                    ? theme.colors.status.warning.content
                    : isDark
                      ? '#FCD34D'
                      : '#D97706'
                }
              />
            </View>
            <Text style={[styles.detailText, daysUntilExpiry <= 2 && styles.warningText]}>
              {daysUntilExpiry === 1 ? 'Expires tomorrow' : `Expires in ${daysUntilExpiry} days`}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons - stacked vertically */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={onAccept}
          loading={isAccepting}
          disabled={isAccepting || isDeclining}
          style={styles.acceptButton}
          labelStyle={styles.acceptButtonLabel}
          contentStyle={styles.buttonContent}
          icon={({ size, color }) => <CheckCircle size={size} color={color} />}
        >
          Accept Invitation
        </Button>
        <Button
          mode="outlined"
          onPress={onDecline}
          loading={isDeclining}
          disabled={isAccepting || isDeclining}
          style={styles.declineButton}
          labelStyle={styles.declineButtonLabel}
          contentStyle={styles.buttonContent}
          icon={({ size, color }) => <XCircle size={size} color={color} />}
        >
          Decline
        </Button>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) => {
  const isDark = theme.dark ?? false;

  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      paddingBottom: 40,
    },

    // -- Header section (warm solid background) --
    headerSection: {
      backgroundColor: isDark ? '#92400E' : theme.colors.primary.main,
      borderRadius: 20,
      paddingVertical: 32,
      paddingHorizontal: 24,
      alignItems: 'center',
      marginBottom: 24,
      // No elevation/shadow — avoids Android rectangular artifacts
    },
    headerIconWrapper: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 6,
    },
    headerSubtitle: {
      fontSize: 15,
      color: 'rgba(255, 255, 255, 0.85)',
      textAlign: 'center',
    },

    // -- Cards --
    card: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    },

    // -- Trip info --
    tripName: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.content.primary,
      marginBottom: 6,
    },
    tripDescription: {
      fontSize: 14,
      color: theme.colors.content.secondary,
      lineHeight: 21,
      marginBottom: 4,
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      marginVertical: 14,
    },

    // -- Detail rows --
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 8,
    },
    detailIconWrapper: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.12)' : 'rgba(217, 119, 6, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    warningIconWrapper: {
      backgroundColor: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(245, 158, 11, 0.15)',
    },
    detailText: {
      fontSize: 15,
      color: theme.colors.content.secondary,
      flex: 1,
    },
    roleText: {
      fontWeight: '600',
      color: theme.colors.primary.main,
    },
    warningText: {
      color: theme.colors.status.warning.content,
      fontWeight: '500',
    },

    // -- Inviter --
    inviterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },
    avatar: {
      backgroundColor: isDark ? '#92400E' : theme.colors.primary.main,
    },
    avatarLabel: {
      fontSize: 16,
      fontWeight: '600',
    },
    inviterInfo: {
      marginLeft: 14,
      flex: 1,
    },
    inviterLabel: {
      fontSize: 12,
      color: theme.colors.content.tertiary,
      marginBottom: 2,
    },
    inviterName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.content.primary,
    },

    // -- Action buttons (stacked) --
    buttonContainer: {
      gap: 12,
      marginTop: 8,
    },
    acceptButton: {
      borderRadius: 14,
      backgroundColor: theme.colors.primary.main,
      // No shadow — clean flat button
    },
    acceptButtonLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    declineButton: {
      borderRadius: 14,
      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
      borderWidth: 1.5,
    },
    declineButtonLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.colors.content.tertiary,
    },
    buttonContent: {
      paddingVertical: 6,
    },

    // -- Error state --
    errorHeader: {
      backgroundColor: isDark ? '#7F1D1D' : theme.colors.status.error.content,
      borderRadius: 20,
      paddingVertical: 32,
      paddingHorizontal: 24,
      alignItems: 'center',
      marginBottom: 24,
      // No elevation — avoids Android rectangular artifacts
    },
    errorCardBody: {
      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.status.error.content,
      textAlign: 'center',
      marginBottom: 8,
    },
    errorMessage: {
      fontSize: 15,
      color: theme.colors.content.secondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 20,
    },
    errorActionButton: {
      borderRadius: 14,
      backgroundColor: theme.colors.primary.main,
      minWidth: 180,
    },

    // -- Loading skeleton --
    skeletonHeader: {
      backgroundColor: isDark ? 'rgba(146, 64, 14, 0.4)' : 'rgba(244, 99, 21, 0.15)',
      borderRadius: 20,
      paddingVertical: 32,
      paddingHorizontal: 24,
      alignItems: 'center',
      marginBottom: 24,
    },
    skeletonCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)',
      marginBottom: 16,
    },
    skeletonHeaderTitle: {
      width: 160,
      height: 28,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.5)',
    },
    skeletonBlock: {
      height: 22,
      width: '80%',
      borderRadius: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      marginBottom: 12,
    },
    skeletonLine: {
      height: 14,
      borderRadius: 4,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      marginBottom: 8,
    },
    skeletonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    skeletonAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    },
    skeletonButton: {
      height: 48,
      borderRadius: 14,
      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      marginBottom: 12,
    },
  });
};

export default InvitationPreview;
