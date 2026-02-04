import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/src/components/ThemedView';
import { ThemedText } from '@/src/components/ThemedText';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Wallet, Plane, Hotel, Ticket, Sparkles } from 'lucide-react-native';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ThemedView style={styles.header}>
        <ThemedText variant="display.medium">Wallet</ThemedText>
      </ThemedView>

      <ThemedView style={styles.content}>
        {/* Coming Soon Badge */}
        <View style={[styles.badge, { backgroundColor: theme.colors.primary.surface }]}>
          <Sparkles size={16} color={theme.colors.primary.main} />
          <ThemedText style={[styles.badgeText, { color: theme.colors.primary.main }]}>
            Coming Soon
          </ThemedText>
        </View>

        {/* Wallet Icon */}
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary.surface }]}>
          <Wallet size={48} color={theme.colors.primary.main} />
        </View>

        <ThemedText variant="heading.h2" style={styles.title}>
          Your Travel Wallet
        </ThemedText>

        <ThemedText
          variant="body.large"
          style={[styles.description, { color: theme.colors.content.secondary }]}
        >
          All your boarding passes, hotel bookings, and tickets in one place. Share with your travel
          crew or keep them personal.
        </ThemedText>

        {/* Feature Preview */}
        <View style={styles.featuresContainer}>
          {[
            { icon: Plane, label: 'Boarding Passes' },
            { icon: Hotel, label: 'Hotel Bookings' },
            { icon: Ticket, label: 'Event Tickets' },
          ].map((feature, index) => (
            <View
              key={feature.label}
              style={[styles.featureItem, { backgroundColor: theme.colors.background.surface }]}
            >
              <feature.icon
                size={24}
                color={theme.colors.content.secondary}
                style={styles.featureIcon}
              />
              <ThemedText variant="body.medium" style={{ color: theme.colors.content.secondary }}>
                {feature.label}
              </ThemedText>
            </View>
          ))}
        </View>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
    gap: 6,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 32,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  featureIcon: {
    opacity: 0.7,
  },
});
