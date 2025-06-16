/**
 * Semantic utilities for enhanced theme tokens
 * Provides ready-to-use style objects for trip status, member roles, and presence indicators
 */

import type { ViewStyle, TextStyle } from 'react-native';
import type { Theme, TripStatus, MemberRole, PresenceStatus } from '../types';
import { createSemanticColorHelpers } from '../utils';

/**
 * Create trip status badge styles
 */
export const createTripStatusBadgeStyles = (theme: Theme) => {
  const semantic = createSemanticColorHelpers(theme);
  
  return {
    getTripStatusBadge: (status: TripStatus): ViewStyle & TextStyle => {
      const colors = semantic.getTripStatusColors(status);
      return {
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        color: colors.content,
        fontSize: 12,
        fontWeight: '600' as const,
        textAlign: 'center' as const,
      };
    },
    
    getTripStatusCard: (status: TripStatus): ViewStyle => {
      const colors = semantic.getTripStatusColors(status);
      return {
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
      };
    },
  };
};

/**
 * Create member role badge styles
 */
export const createMemberRoleBadgeStyles = (theme: Theme) => {
  const semantic = createSemanticColorHelpers(theme);
  
  return {
    getMemberRoleBadge: (role: MemberRole): ViewStyle & TextStyle => {
      const colors = semantic.getMemberRoleColors(role);
      return {
        backgroundColor: colors.badge,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700' as const,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
      };
    },
    
    getMemberRoleContainer: (role: MemberRole): ViewStyle => {
      const colors = semantic.getMemberRoleColors(role);
      return {
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
      };
    },
    
    getMemberRoleIcon: (role: MemberRole): TextStyle => {
      const colors = semantic.getMemberRoleColors(role);
      return {
        color: colors.icon,
        fontSize: 16,
      };
    },
  };
};

/**
 * Create presence indicator styles
 */
export const createPresenceIndicatorStyles = (theme: Theme) => {
  const semantic = createSemanticColorHelpers(theme);
  
  return {
    getPresenceIndicator: (status: PresenceStatus, size: number = 8): ViewStyle => {
      return semantic.getPresenceIndicatorStyle(status, size);
    },
    
    getPresenceBadge: (status: PresenceStatus): ViewStyle & TextStyle => {
      const colors = semantic.getPresenceColors(status);
      return {
        backgroundColor: colors.background,
        borderColor: colors.indicator,
        borderWidth: 2,
        borderRadius: 16,
        paddingHorizontal: 8,
        paddingVertical: 4,
        color: colors.content,
        fontSize: 11,
        fontWeight: '600' as const,
        textAlign: 'center' as const,
      };
    },
    
    getPresenceText: (status: PresenceStatus): TextStyle => {
      const colors = semantic.getPresenceColors(status);
      return {
        color: colors.content,
        fontSize: 12,
        fontWeight: '500' as const,
      };
    },
    
    // Special styling for typing indicator
    getTypingIndicator: (): ViewStyle => {
      const colors = semantic.getPresenceColors('typing');
      return {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: colors.background,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
      };
    },
  };
};

/**
 * Create status-aware list item styles
 */
export const createStatusAwareListStyles = (theme: Theme) => {
  const tripStyles = createTripStatusBadgeStyles(theme);
  const roleStyles = createMemberRoleBadgeStyles(theme);
  const presenceStyles = createPresenceIndicatorStyles(theme);
  
  return {
    getTripListItem: (status: TripStatus): ViewStyle => ({
      ...tripStyles.getTripStatusCard(status),
      marginVertical: 4,
      marginHorizontal: 16,
    }),
    
    getMemberListItem: (role: MemberRole, presence: PresenceStatus): ViewStyle => {
      const roleColors = createSemanticColorHelpers(theme).getMemberRoleColors(role);
      const presenceColors = createSemanticColorHelpers(theme).getPresenceColors(presence);
      
      return {
        backgroundColor: roleColors.background,
        borderLeftColor: presenceColors.indicator,
        borderLeftWidth: 4,
        borderRadius: 8,
        padding: 12,
        marginVertical: 2,
      };
    },
  };
};

/**
 * Hook to get all semantic style utilities
 */
export const useSemanticStyles = (theme: Theme) => ({
  tripStatus: createTripStatusBadgeStyles(theme),
  memberRole: createMemberRoleBadgeStyles(theme),
  presence: createPresenceIndicatorStyles(theme),
  statusAwareList: createStatusAwareListStyles(theme),
}); 