import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Text, Button, Switch, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '../../theme/utils/useAppTheme';
import { spacing } from '../../theme/foundations/spacing';

// Layout Components
import Stack from '../ui/layout/Stack';
import Inline from '../ui/layout/Inline';
import Container from '../ui/layout/Container';

// Navigation Components
import StatusAwareHeader from '../ui/navigation/StatusAwareHeader';

// UI Components for examples
import { RoleBadge } from '../ui/RoleBadge';
import { TripStatusCard } from '../ui/TripStatusCard';
import { PresenceIndicator } from '../ui/PresenceIndicator';
import { EnhancedButton } from '../ui/EnhancedButton';

import type { TripStatus, MemberRole, PresenceStatus } from '../../types/app.types';

/**
 * LayoutSystemShowcase Component
 *
 * Interactive showcase demonstrating Phase 4 layout system components:
 * - Layout components (Stack, Inline, Container)
 * - Navigation patterns (StatusAwareHeader)
 * - Component composition patterns
 * - Responsive and accessible design patterns
 */
export const LayoutSystemShowcase: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  // State for interactive demos
  const [headerElevated, setHeaderElevated] = useState(false);
  const [headerBadgeCount, setHeaderBadgeCount] = useState(3);
  const [containerScrollable, setContainerScrollable] = useState(false);
  const [stackSpace, setStackSpace] = useState<'sm' | 'md' | 'lg'>('md');
  const [inlineJustify, setInlineJustify] = useState<'start' | 'center' | 'space-between'>('start');

  // Mock data for examples
  const mockTripContext = {
    status: 'active' as TripStatus,
    memberCount: 8,
    activeMembers: 5,
  };

  const currentUserRole: MemberRole = 'admin';
  const currentPresenceStatus: PresenceStatus = 'online';

  const headerActions = [
    {
      icon: 'search' as const,
      onPress: () => Alert.alert('Search', 'Search functionality'),
      label: 'Search',
    },
    {
      icon: 'notifications' as const,
      onPress: () => Alert.alert('Notifications', 'Notifications panel'),
      label: 'Notifications',
      badge: headerBadgeCount,
    },
    {
      icon: 'settings' as const,
      onPress: () => Alert.alert('Settings', 'Settings panel'),
      label: 'Settings',
    },
  ];

  const renderSection = (title: string, children: React.ReactNode) => (
    <Container variant="section" margin="md">
      <Stack space="lg">
        <Text variant="headlineSmall" style={{ color: theme.colors.content.onSurface }}>
          {title}
        </Text>
        {children}
      </Stack>
    </Container>
  );

  const renderStackDemo = () => (
    <Stack space="lg">
      <Stack space="sm">
        <Text variant="titleMedium">Stack Component</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.content.onSurfaceVariant }}>
          Vertical layout with consistent spacing and alignment options.
        </Text>
      </Stack>

      {/* Stack Configuration */}
      <Container variant="card">
        <Stack space="md">
          <Text variant="titleSmall">Configuration</Text>
          <Inline space="md" wrap>
            <Button
              mode={stackSpace === 'sm' ? 'contained' : 'outlined'}
              onPress={() => setStackSpace('sm')}
              compact
            >
              Small
            </Button>
            <Button
              mode={stackSpace === 'md' ? 'contained' : 'outlined'}
              onPress={() => setStackSpace('md')}
              compact
            >
              Medium
            </Button>
            <Button
              mode={stackSpace === 'lg' ? 'contained' : 'outlined'}
              onPress={() => setStackSpace('lg')}
              compact
            >
              Large
            </Button>
          </Inline>
        </Stack>
      </Container>

      {/* Stack Examples */}
      <Container variant="card">
        <Stack space="md">
          <Text variant="titleSmall">Stack Example (space={stackSpace})</Text>
          <Stack
            space={stackSpace}
            padding="md"
            style={{ backgroundColor: theme.colors.surface.variant, borderRadius: 8 }}
          >
            <RoleBadge role="owner" />
            <RoleBadge role="admin" />
            <RoleBadge role="member" />
            <RoleBadge role="viewer" />
          </Stack>
        </Stack>
      </Container>

      {/* Stack Alignment Demo */}
      <Container variant="card">
        <Stack space="md">
          <Text variant="titleSmall">Stack Alignment Variants</Text>
          <Stack space="sm">
            {(['start', 'center', 'end'] as const).map((align) => (
              <View key={align}>
                <Text variant="bodySmall" style={{ marginBottom: spacing.xs }}>
                  align="{align}"
                </Text>
                <Stack
                  space="xs"
                  align={align}
                  padding="sm"
                  style={{ backgroundColor: theme.colors.surface.variant, borderRadius: 6 }}
                >
                  <Button mode="contained" compact>
                    Button 1
                  </Button>
                  <Button mode="outlined" compact>
                    Button 2
                  </Button>
                </Stack>
              </View>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Stack>
  );

  const renderInlineDemo = () => (
    <Stack space="lg">
      <Stack space="sm">
        <Text variant="titleMedium">Inline Component</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.content.onSurfaceVariant }}>
          Horizontal layout with flexible spacing and alignment.
        </Text>
      </Stack>

      {/* Inline Configuration */}
      <Container variant="card">
        <Stack space="md">
          <Text variant="titleSmall">Configuration</Text>
          <Inline space="md" wrap>
            <Button
              mode={inlineJustify === 'start' ? 'contained' : 'outlined'}
              onPress={() => setInlineJustify('start')}
              compact
            >
              Start
            </Button>
            <Button
              mode={inlineJustify === 'center' ? 'contained' : 'outlined'}
              onPress={() => setInlineJustify('center')}
              compact
            >
              Center
            </Button>
            <Button
              mode={inlineJustify === 'space-between' ? 'contained' : 'outlined'}
              onPress={() => setInlineJustify('space-between')}
              compact
            >
              Space Between
            </Button>
          </Inline>
        </Stack>
      </Container>

      {/* Inline Examples */}
      <Container variant="card">
        <Stack space="md">
          <Text variant="titleSmall">Inline Example (justify={inlineJustify})</Text>
          <Inline
            space="sm"
            justify={inlineJustify}
            padding="md"
            style={{ backgroundColor: theme.colors.surface.variant, borderRadius: 8 }}
          >
            <PresenceIndicator status="online" size="md" />
            <PresenceIndicator status="away" size="md" />
            <PresenceIndicator status="busy" size="md" />
            <PresenceIndicator status="offline" size="md" />
          </Inline>
        </Stack>
      </Container>

      {/* Inline Wrapping Demo */}
      <Container variant="card">
        <Stack space="md">
          <Text variant="titleSmall">Inline with Wrapping</Text>
          <Inline
            space="xs"
            wrap
            padding="md"
            style={{ backgroundColor: theme.colors.surface.variant, borderRadius: 8 }}
          >
            <RoleBadge role="owner" size="sm" />
            <RoleBadge role="admin" size="sm" />
            <RoleBadge role="moderator" size="sm" />
            <RoleBadge role="member" size="sm" />
            <RoleBadge role="viewer" size="sm" />
            <RoleBadge role="owner" size="sm" />
            <RoleBadge role="admin" size="sm" />
            <RoleBadge role="member" size="sm" />
          </Inline>
        </Stack>
      </Container>
    </Stack>
  );

  const renderContainerDemo = () => (
    <Stack space="lg">
      <Stack space="sm">
        <Text variant="titleMedium">Container Component</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.content.onSurfaceVariant }}>
          Semantic containers for different content types with built-in styling.
        </Text>
      </Stack>

      {/* Container Configuration */}
      <Container variant="card">
        <Stack space="md">
          <Text variant="titleSmall">Configuration</Text>
          <Inline space="md" align="center">
            <Text>Scrollable:</Text>
            <Switch value={containerScrollable} onValueChange={setContainerScrollable} />
          </Inline>
        </Stack>
      </Container>

      {/* Container Variants */}
      <Stack space="md">
        {(['card', 'section', 'content'] as const).map((variant) => (
          <Container key={variant} variant={variant}>
            <Stack space="sm">
              <Text variant="titleSmall">variant="{variant}"</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.content.onSurfaceVariant }}>
                This is a {variant} container with automatic styling and spacing.
              </Text>
              {variant === 'card' && (
                <Inline space="sm">
                  <Button mode="contained" compact>
                    Action
                  </Button>
                  <Button mode="outlined" compact>
                    Cancel
                  </Button>
                </Inline>
              )}
            </Stack>
          </Container>
        ))}
      </Stack>
    </Stack>
  );

  const renderNavigationDemo = () => (
    <Stack space="lg">
      <Stack space="sm">
        <Text variant="titleMedium">StatusAware Navigation</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.content.onSurfaceVariant }}>
          Context-aware header that adapts to trip status and user role.
        </Text>
      </Stack>

      {/* Header Configuration */}
      <Container variant="card">
        <Stack space="md">
          <Text variant="titleSmall">Configuration</Text>
          <Stack space="sm">
            <Inline space="md" align="center">
              <Text>Elevated:</Text>
              <Switch value={headerElevated} onValueChange={setHeaderElevated} />
            </Inline>
            <Inline space="md" align="center">
              <Text>Badge Count:</Text>
              <Inline space="xs">
                <Button
                  mode="outlined"
                  onPress={() => setHeaderBadgeCount(Math.max(0, headerBadgeCount - 1))}
                  compact
                >
                  -
                </Button>
                <Text style={{ minWidth: 30, textAlign: 'center' }}>{headerBadgeCount}</Text>
                <Button
                  mode="outlined"
                  onPress={() => setHeaderBadgeCount(headerBadgeCount + 1)}
                  compact
                >
                  +
                </Button>
              </Inline>
            </Inline>
          </Stack>
        </Stack>
      </Container>

      {/* Header Demo */}
      <Container variant="card" padding="none">
        <StatusAwareHeader
          title="Tokyo Adventure 2024"
          subtitle="8 members • 5 active"
          tripContext={mockTripContext}
          userRole={currentUserRole}
          presenceStatus={currentPresenceStatus}
          actions={headerActions.map((action) => ({
            ...action,
            badge: action.icon === 'notifications' ? headerBadgeCount : undefined,
          }))}
          elevated={headerElevated}
          onBack={() => Alert.alert('Navigation', 'Back button pressed')}
        />
      </Container>
    </Stack>
  );

  const renderCompositionDemo = () => (
    <Stack space="lg">
      <Stack space="sm">
        <Text variant="titleMedium">Component Composition</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.content.onSurfaceVariant }}>
          Complex layouts using composition of layout components.
        </Text>
      </Stack>

      {/* Trip Dashboard Composition */}
      <Container variant="card">
        <Stack space="lg">
          <Stack space="sm">
            <Text variant="titleSmall">Trip Dashboard Layout</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.content.onSurfaceVariant }}>
              Complex composition using Stack, Inline, and semantic components.
            </Text>
          </Stack>

          <Stack space="md">
            {/* Trip Header */}
            <Inline justify="space-between" align="center">
              <Stack space="xs">
                <Text variant="titleMedium">Tokyo Adventure 2024</Text>
                <Inline space="sm" align="center">
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.content.onSurfaceVariant }}
                  >
                    Dec 15-22, 2024
                  </Text>
                  <RoleBadge role={currentUserRole} size="sm" />
                </Inline>
              </Stack>
              <PresenceIndicator status={currentPresenceStatus} size="lg" showPulse />
            </Inline>

            <Divider />

            {/* Trip Stats */}
            <Inline justify="space-between" wrap>
              <Container variant="section" style={{ flex: 1, margin: spacing.xs }}>
                <Stack space="xs" align="center">
                  <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                    8
                  </Text>
                  <Text variant="bodySmall">Members</Text>
                </Stack>
              </Container>

              <Container variant="section" style={{ flex: 1, margin: spacing.xs }}>
                <Stack space="xs" align="center">
                  <Text variant="headlineSmall" style={{ color: theme.colors.secondary }}>
                    5
                  </Text>
                  <Text variant="bodySmall">Active</Text>
                </Stack>
              </Container>

              <Container variant="section" style={{ flex: 1, margin: spacing.xs }}>
                <Stack space="xs" align="center">
                  <Text variant="headlineSmall" style={{ color: theme.colors.tertiary }}>
                    12
                  </Text>
                  <Text variant="bodySmall">Tasks</Text>
                </Stack>
              </Container>
            </Inline>

            <Divider />

            {/* Quick Actions */}
            <Stack space="sm">
              <Text variant="titleSmall">Quick Actions</Text>
              <Inline space="sm" wrap>
                <EnhancedButton
                  variant="primary"
                  size="md"
                  icon="chat"
                  onPress={() => Alert.alert('Action', 'Open chat')}
                >
                  Chat
                </EnhancedButton>
                <EnhancedButton
                  variant="secondary"
                  size="md"
                  icon="location"
                  onPress={() => Alert.alert('Action', 'View locations')}
                >
                  Locations
                </EnhancedButton>
                <EnhancedButton
                  variant="surface"
                  size="md"
                  icon="list"
                  onPress={() => Alert.alert('Action', 'View todos')}
                >
                  Todos
                </EnhancedButton>
              </Inline>
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Stack>
  );

  return (
    <Container variant="screen" scrollable fill>
      <Stack space="xxxl">
        {/* Header */}
        <Stack space="md" align="center">
          <Text variant="displaySmall" style={{ color: theme.colors.primary }}>
            Layout System
          </Text>
          <Text
            variant="titleMedium"
            style={{ color: theme.colors.content.onSurfaceVariant, textAlign: 'center' }}
          >
            Phase 4: Advanced UI/UX Patterns
          </Text>
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.content.onSurfaceVariant, textAlign: 'center' }}
          >
            Interactive showcase of layout components and navigation patterns
          </Text>
        </Stack>

        {/* Sections */}
        {renderSection('Stack Layout', renderStackDemo())}
        {renderSection('Inline Layout', renderInlineDemo())}
        {renderSection('Container Variants', renderContainerDemo())}
        {renderSection('Navigation Patterns', renderNavigationDemo())}
        {renderSection('Component Composition', renderCompositionDemo())}

        {/* Footer */}
        <Container variant="section" center>
          <Stack space="sm" align="center">
            <Text variant="bodyMedium" style={{ color: theme.colors.content.onSurfaceVariant }}>
              Phase 4 Layout System Complete
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.content.onSurfaceVariant }}>
              All components are production-ready and fully integrated
            </Text>
          </Stack>
        </Container>
      </Stack>
    </Container>
  );
};

// Export the showcase component
export default LayoutSystemShowcase;
