import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Mail, Bell } from 'lucide-react-native';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';

export type EmptyStateType = 'invitations' | 'activity' | 'all';

interface EmptyNotificationStateProps {
  type: EmptyStateType;
}

interface EmptyStateConfig {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

/**
 * Empty state component shown when there are no notifications.
 * Shows different content based on the type of notifications being displayed.
 */
export const EmptyNotificationState: React.FC<EmptyNotificationStateProps> = ({ type }) => {
  const { theme } = useAppTheme();
  const themedStyles = styles(theme);

  const config: EmptyStateConfig = React.useMemo(() => {
    switch (type) {
      case 'invitations':
        return {
          icon: <Mail size={64} color={theme.colors.content.tertiary} strokeWidth={1.5} />,
          title: 'No invitations yet',
          subtitle: 'When someone invites you to a trip, it will show up here',
        };
      case 'activity':
        return {
          icon: <Bell size={64} color={theme.colors.content.tertiary} strokeWidth={1.5} />,
          title: 'No activity yet',
          subtitle: 'Updates from your trips will appear here',
        };
      case 'all':
      default:
        return {
          icon: <Bell size={64} color={theme.colors.content.tertiary} strokeWidth={1.5} />,
          title: 'No notifications',
          subtitle: "You're all caught up! Check back later for updates",
        };
    }
  }, [type, theme.colors.content.tertiary]);

  return (
    <View style={themedStyles.container}>
      <View style={themedStyles.iconWrapper}>{config.icon}</View>
      <Text variant="titleMedium" style={themedStyles.title}>
        {config.title}
      </Text>
      <Text variant="bodyMedium" style={themedStyles.subtitle}>
        {config.subtitle}
      </Text>
    </View>
  );
};

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.inset.xl,
      paddingVertical: theme.spacing.inset.xl * 1.5,
    },
    iconWrapper: {
      marginBottom: theme.spacing.stack.lg,
      opacity: 0.6,
    },
    title: {
      color: theme.colors.content.primary,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: theme.spacing.stack.sm,
    },
    subtitle: {
      color: theme.colors.content.secondary,
      textAlign: 'center',
      maxWidth: 280,
    },
  });
