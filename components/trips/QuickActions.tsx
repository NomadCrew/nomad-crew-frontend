// components/trips/QuickActions.tsx
import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Surface, IconButton } from 'react-native-paper';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useAuthStore } from '@/src/store/useAuthStore';
import LinearGradient from 'react-native-linear-gradient';
import { Theme } from '@/src/theme/types';
import { Trip } from '@/src/types/trip';

interface QuickActionsProps {
  trip: Trip;
  setShowAddTodo: (show: boolean) => void;
  setShowInviteModal: (show: boolean) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  trip,
  setShowAddTodo,
  setShowInviteModal
}) => {
  const { theme } = useTheme();
  const authStore = useAuthStore();
  const userId = authStore.user?.id;
  
  const isOwner = trip.createdBy === userId;
  const isAdmin = trip.members?.some(
    (member) => member.userId === userId && member.role === 'admin'
  );
  const isOwnerOrAdmin = isOwner || isAdmin;

  const actions = [
    { icon: 'map-marker', label: 'Location', onPress: () => console.log('Location pressed') },
    { icon: 'message-outline', label: 'Chat', onPress: () => console.log('Chat pressed') },
    { icon: 'account-group', label: 'Members', onPress: () => console.log('Members pressed') },
    ...(isOwnerOrAdmin
      ? [{ icon: 'account-plus', label: 'Invite', onPress: () => setShowInviteModal(true) }]
      : []),
    { icon: 'plus', label: 'Add Todo', onPress: () => setShowAddTodo(true) },
  ];

  return (
    <Surface style={styles(theme).actionsCard} elevation={0}>
      <View style={styles(theme).fadeContainer}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.5)', 'transparent']}
          style={styles(theme).fadeLeft}
          pointerEvents="none"
        />
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles(theme).actionButtons}
        >
          {actions.map((action) => (
            <Pressable 
              key={action.label} 
              onPress={action.onPress}
              style={({ pressed }) => [
                styles(theme).actionItem,
                { opacity: pressed ? 0.6 : 1 }
              ]}
            >
              <View style={styles(theme).iconContainer}>
                <IconButton
                  icon={action.icon}
                  size={20}
                  iconColor={theme.colors.content.primary}
                  style={styles(theme).icon}
                />
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.5)']}
          style={styles(theme).fadeRight}
          pointerEvents="none"
        />
      </View>
    </Surface>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  actionsCard: {
    paddingVertical: theme.spacing.inset.sm,
    backgroundColor: theme.colors.surface.default,
    height: '100%',
  },
  fadeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.inset.md,
  },
  fadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    zIndex: 1,
  },
  fadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    zIndex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.inset.sm,
  },
  actionItem: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.stack.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface.default,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.content.primary,
  },
  icon: {
    margin: 0,
  },
});