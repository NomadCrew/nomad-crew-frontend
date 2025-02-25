// components/trips/QuickActions.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Text } from 'react-native';
import { Surface } from 'react-native-paper';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useAuthStore } from '@/src/store/useAuthStore';
import { Theme } from '@/src/theme/types';
import { Trip } from '@/src/types/trip';
import { ArrowLeft, ArrowRight, MapPin, MessageSquare, Users, UserPlus, Plus } from 'lucide-react-native';

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
    { 
      icon: (props) => <MapPin {...props} />, 
      label: 'Location', 
      onPress: () => console.log('Location pressed') 
    },
    { 
      icon: (props) => <MessageSquare {...props} />, 
      label: 'Chat', 
      onPress: () => console.log('Chat pressed') 
    },
    { 
      icon: (props) => <Users {...props} />, 
      label: 'Members', 
      onPress: () => console.log('Members pressed') 
    },
    ...(isOwnerOrAdmin
      ? [{ 
          icon: (props) => <UserPlus {...props} />, 
          label: 'Invite', 
          onPress: () => setShowInviteModal(true) 
        }]
      : []),
    { 
      icon: (props) => <Plus {...props} />, 
      label: 'Add Todo', 
      onPress: () => setShowAddTodo(true) 
    },
  ];

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setCanScrollLeft(contentOffset.x > 0);
    setCanScrollRight(contentOffset.x < contentSize.width - layoutMeasurement.width);
  };

  return (
    <Surface style={styles(theme).actionsCard} elevation={0}>
      <View style={styles(theme).fadeContainer}>
        {canScrollLeft && (
          <ArrowLeft size={20} color={theme.colors.content.primary} style={styles(theme).arrow} />
        )}
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles(theme).actionButtons}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles(theme).scrollContent}
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
                {action.icon({ size: 18, color: theme.colors.primary.main })}
              </View>
              <Text style={styles(theme).actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {canScrollRight && (
          <ArrowRight size={20} color={theme.colors.content.primary} style={styles(theme).arrow} />
        )}
      </View>
    </Surface>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  actionsCard: {
    height: '100%',
    width: '100%',
    paddingVertical: theme.spacing.inset.sm,
    backgroundColor: theme.colors.surface.variant,
    borderRadius: 24,
  },
  fadeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.inset.md,
  },
  actionButtons: {
    flexDirection: 'row',
    flexGrow: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.inset.xs,
    justifyContent: 'space-around',
  },
  actionItem: {
    alignItems: 'center',
    marginHorizontal: theme.spacing.stack.xs,
    width: 48,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface.default,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    marginBottom: theme.spacing.stack.xs
  },
  actionLabel: {
    ...theme.typography.body.small,
    color: theme.colors.content.secondary,
    textAlign: 'center',
    marginTop: 2,
    fontSize: 11,
  },
  arrow: {
    marginHorizontal: 5,
  },
});