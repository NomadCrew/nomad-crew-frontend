// components/trips/QuickActions.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Text, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Surface } from 'react-native-paper';
import { useTheme } from '@/src/theme/ThemeProvider';
import { useAuthStore } from '@/src/store/useAuthStore';
import { Theme } from '@/src/theme/types';
import { Trip } from '@/src/types/trip';
import { ArrowLeft, ArrowRight, MapPin, MessageSquare, Users, UserPlus } from 'lucide-react-native';

// Define a type for the icon props
type IconProps = {
  size: number;
  color: string;
};

interface QuickActionsProps {
  trip: Trip;
  setShowInviteModal: (show: boolean) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  trip,
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
      icon: (props: IconProps) => <MapPin {...props} />, 
      label: 'Location', 
      onPress: () => console.log('Location pressed') 
    },
    { 
      icon: (props: IconProps) => <MessageSquare {...props} />, 
      label: 'Chat', 
      onPress: () => console.log('Chat pressed') 
    },
    { 
      icon: (props: IconProps) => <Users {...props} />, 
      label: 'Members', 
      onPress: () => console.log('Members pressed') 
    },
    ...(isOwnerOrAdmin
      ? [{ 
          icon: (props: IconProps) => <UserPlus {...props} />, 
          label: 'Invite', 
          onPress: () => setShowInviteModal(true) 
        }]
      : []),
  ];

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
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
                {action.icon({ size: 19, color: theme.colors.primary.main })}
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
    paddingVertical: theme.spacing.inset.xs,
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
    width: 50,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface.default,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
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