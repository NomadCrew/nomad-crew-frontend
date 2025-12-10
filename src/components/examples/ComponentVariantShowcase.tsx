/**
 * Component Variant Showcase - Phase 3 Demonstration
 * Showcases the complete component variant system with semantic colors and animations
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useComponentUtils } from '../../theme/utils';
import { RoleBadge } from '../ui/RoleBadge';
import { TripStatusCard } from '../ui/TripStatusCard';
import { StatusAwareList, type ListItem } from '../ui/StatusAwareList';
import { EnhancedButton } from '../ui/EnhancedButton';
import { PresenceIndicator } from '../ui/animations/PresenceIndicator';
import { FadeInView } from '../ui/animations/LoadingStates';
import type { TripStatus, MemberRole, PresenceStatus } from '../../theme/types';

export const ComponentVariantShowcase: React.FC = () => {
  const { theme } = useAppTheme();
  const components = useComponentUtils(theme);
  
  // State for interactive demos
  const [selectedRole, setSelectedRole] = useState<MemberRole>('member');
  const [selectedStatus, setSelectedStatus] = useState<TripStatus>('planning');
  const [selectedPresence, setSelectedPresence] = useState<PresenceStatus>('online');

  // Sample data for list components
  const sampleTrips: ListItem[] = [
    {
      id: '1',
      type: 'trip',
      title: 'Tokyo Adventure',
      subtitle: 'Exploring temples and technology',
      status: 'active',
      memberCount: 4,
      startDate: new Date('2025-02-15'),
      onPress: () => console.log('Trip pressed'),
    },
    {
      id: '2',
      type: 'trip',
      title: 'Mountain Hiking',
      subtitle: 'Weekend getaway in the Alps',
      status: 'planning',
      memberCount: 2,
      startDate: new Date('2025-03-01'),
      onPress: () => console.log('Trip pressed'),
    },
    {
      id: '3',
      type: 'trip',
      title: 'Beach Vacation',
      subtitle: 'Relaxing by the ocean',
      status: 'completed',
      memberCount: 6,
      startDate: new Date('2025-01-10'),
      onPress: () => console.log('Trip pressed'),
    },
  ];

  const sampleMembers: ListItem[] = [
    {
      id: '1',
      type: 'member',
      title: 'Alice Johnson',
      subtitle: 'Trip organizer',
      role: 'owner',
      presence: 'online',
      onPress: () => console.log('Member pressed'),
    },
    {
      id: '2',
      type: 'member',
      title: 'Bob Smith',
      subtitle: 'Photography enthusiast',
      role: 'admin',
      presence: 'away',
      onPress: () => console.log('Member pressed'),
    },
    {
      id: '3',
      type: 'member',
      title: 'Charlie Brown',
      subtitle: 'Local guide',
      role: 'moderator',
      presence: 'busy',
      lastSeen: new Date('2025-01-28'),
      onPress: () => console.log('Member pressed'),
    },
    {
      id: '4',
      type: 'member',
      title: 'Diana Ross',
      subtitle: 'Adventure seeker',
      role: 'member',
      presence: 'offline',
      lastSeen: new Date('2025-01-27'),
      onPress: () => console.log('Member pressed'),
    },
  ];

  const sampleTasks: ListItem[] = [
    {
      id: '1',
      type: 'task',
      title: 'Book flights',
      subtitle: 'Compare prices on different airlines',
      completed: true,
      priority: 'high',
      dueDate: new Date('2025-01-30'),
      onPress: () => console.log('Task pressed'),
    },
    {
      id: '2',
      type: 'task',
      title: 'Reserve hotel',
      subtitle: 'Find accommodation near city center',
      completed: false,
      priority: 'high',
      dueDate: new Date('2025-02-01'),
      onPress: () => console.log('Task pressed'),
    },
    {
      id: '3',
      type: 'task',
      title: 'Pack luggage',
      subtitle: 'Check weather forecast',
      completed: false,
      priority: 'medium',
      dueDate: new Date('2025-02-14'),
      onPress: () => console.log('Task pressed'),
    },
  ];

  const sampleNotifications: ListItem[] = [
    {
      id: '1',
      type: 'notification',
      title: 'New message from Alice',
      subtitle: 'Hey, are you ready for the trip?',
      read: false,
      timestamp: new Date('2025-01-29T10:30:00'),
      category: 'chat',
      onPress: () => console.log('Notification pressed'),
    },
    {
      id: '2',
      type: 'notification',
      title: 'Trip status updated',
      subtitle: 'Tokyo Adventure is now active',
      read: true,
      timestamp: new Date('2025-01-28T15:45:00'),
      category: 'system',
      onPress: () => console.log('Notification pressed'),
    },
  ];

  const allRoles: MemberRole[] = ['owner', 'admin', 'moderator', 'member', 'viewer'];
  const allStatuses: TripStatus[] = ['draft', 'planning', 'active', 'completed', 'cancelled'];
  const allPresenceStatuses: PresenceStatus[] = ['online', 'away', 'busy', 'offline', 'typing'];

  return (
    <ScrollView style={components.list.getListContainerStyle()}>
      <View style={{ padding: 16, gap: 24 }}>
        
        {/* Header */}
        <FadeInView duration={300}>
          <View style={components.card.getCardStyle('elevated')}>
            <Text style={components.card.getCardTitleStyle()}>
              Component Variant System
            </Text>
            <Text style={{ color: theme.colors.content.secondary, marginTop: 8 }}>
              Phase 3: Integration of semantic colors with animations for role-based and status-aware UI components
            </Text>
          </View>
        </FadeInView>

        {/* Role Badges */}
        <FadeInView duration={300} delay={100}>
          <View style={components.card.getCardStyle('outlined')}>
            <Text style={components.card.getCardTitleStyle()}>Role-Based Badges</Text>
            <Text style={{ color: theme.colors.content.secondary, marginTop: 4, marginBottom: 16 }}>
              Interactive role badges with semantic colors and animations
            </Text>
            
            {/* Role Selection */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {allRoles.map((role) => (
                <TouchableOpacity key={role} onPress={() => setSelectedRole(role)}>
                  <RoleBadge 
                    role={role} 
                    size="md" 
                    variant={selectedRole === role ? 'filled' : 'outlined'}
                    animated={true}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Size Variants */}
            <Text style={{ color: theme.colors.content.primary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              Size Variants:
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <RoleBadge role={selectedRole} size="sm" variant="filled" />
              <RoleBadge role={selectedRole} size="md" variant="filled" />
              <RoleBadge role={selectedRole} size="lg" variant="filled" />
            </View>

            {/* Style Variants */}
            <Text style={{ color: theme.colors.content.primary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              Style Variants:
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <RoleBadge role={selectedRole} size="md" variant="filled" />
              <RoleBadge role={selectedRole} size="md" variant="outlined" />
              <RoleBadge role={selectedRole} size="md" variant="minimal" />
            </View>
          </View>
        </FadeInView>

        {/* Trip Status Cards */}
        <FadeInView duration={300} delay={200}>
          <View style={components.card.getCardStyle('outlined')}>
            <Text style={components.card.getCardTitleStyle()}>Trip Status Cards</Text>
            <Text style={{ color: theme.colors.content.secondary, marginTop: 4, marginBottom: 16 }}>
              Status-aware cards with semantic colors and smooth animations
            </Text>
            
            {/* Status Selection */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {allStatuses.map((status) => (
                <TouchableOpacity 
                  key={status} 
                  onPress={() => setSelectedStatus(status)}
                  style={[
                    components.button.getButtonStyle(
                      selectedStatus === status ? 'primary' : 'outlined', 
                      'sm'
                    ),
                  ]}
                >
                  <Text style={{ 
                    color: selectedStatus === status 
                      ? theme.colors.primary.text 
                      : theme.colors.primary.main,
                    fontSize: 12,
                  }}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sample Trip Cards */}
            <View style={{ gap: 12 }}>
              <TripStatusCard
                tripId="sample-1"
                title="Sample Trip"
                description="Experience the beautiful destinations with our group"
                status={selectedStatus}
                memberCount={5}
                startDate={new Date('2025-02-15')}
                endDate={new Date('2025-02-22')}
                onPress={() => console.log('Trip card pressed')}
                animated={true}
              />
              
              <TripStatusCard
                tripId="sample-2"
                title="Compact Example"
                status={selectedStatus}
                memberCount={3}
                startDate={new Date('2025-03-01')}
                onPress={() => console.log('Compact trip pressed')}
                animated={true}
                compact={true}
              />
            </View>
          </View>
        </FadeInView>

        {/* Enhanced Buttons */}
        <FadeInView duration={300} delay={300}>
          <View style={components.card.getCardStyle('outlined')}>
            <Text style={components.card.getCardTitleStyle()}>Enhanced Buttons</Text>
            <Text style={{ color: theme.colors.content.secondary, marginTop: 4, marginBottom: 16 }}>
              Buttons with semantic variants, animations, and interactive states
            </Text>
            
            <View style={{ gap: 16 }}>
              {/* Standard Variants */}
              <View>
                <Text style={{ color: theme.colors.content.primary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Standard Variants:
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <EnhancedButton title="Primary" variant="primary" size="sm" />
                  <EnhancedButton title="Secondary" variant="secondary" size="sm" />
                  <EnhancedButton title="Outlined" variant="outlined" size="sm" />
                  <EnhancedButton title="Ghost" variant="ghost" size="sm" />
                  <EnhancedButton title="Destructive" variant="destructive" size="sm" />
                </View>
              </View>

              {/* Semantic Variants */}
              <View>
                <Text style={{ color: theme.colors.content.primary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Trip Status Buttons:
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <EnhancedButton title="Start Planning" tripStatus="planning" size="sm" icon="📋" />
                  <EnhancedButton title="Begin Trip" tripStatus="active" size="sm" icon="✈️" />
                  <EnhancedButton title="Mark Complete" tripStatus="completed" size="sm" icon="✅" />
                </View>
              </View>

              {/* Interactive Features */}
              <View>
                <Text style={{ color: theme.colors.content.primary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Interactive Features:
                </Text>
                <View style={{ gap: 8 }}>
                  <EnhancedButton 
                    title="With Badge" 
                    subtitle="New notifications" 
                    variant="primary" 
                    size="md" 
                    icon="🔔" 
                    badge={3}
                    showBadge={true}
                  />
                  <EnhancedButton 
                    title="Loading State" 
                    variant="secondary" 
                    size="md" 
                    loading={true}
                  />
                  <EnhancedButton 
                    title="Disabled State" 
                    variant="primary" 
                    size="md" 
                    disabled={true}
                  />
                </View>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* Status-Aware Lists */}
        <FadeInView duration={300} delay={400}>
          <View style={components.card.getCardStyle('outlined')}>
            <Text style={components.card.getCardTitleStyle()}>Status-Aware Lists</Text>
            <Text style={{ color: theme.colors.content.secondary, marginTop: 4, marginBottom: 16 }}>
              Dynamic lists with different item types, status-based styling, and animations
            </Text>
            
            <View style={{ gap: 16 }}>
              {/* Trip List */}
              <View>
                <Text style={{ color: theme.colors.content.primary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Trip List:
                </Text>
                <View style={{ maxHeight: 200 }}>
                  <StatusAwareList 
                    items={sampleTrips} 
                    animated={true}
                    showSeparators={true}
                  />
                </View>
              </View>

              {/* Member List */}
              <View>
                <Text style={{ color: theme.colors.content.primary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Member List:
                </Text>
                <View style={{ maxHeight: 200 }}>
                  <StatusAwareList 
                    items={sampleMembers} 
                    animated={true}
                    showSeparators={true}
                  />
                </View>
              </View>

              {/* Task List */}
              <View>
                <Text style={{ color: theme.colors.content.primary, fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                  Task List:
                </Text>
                <View style={{ maxHeight: 150 }}>
                  <StatusAwareList 
                    items={sampleTasks} 
                    animated={true}
                    showSeparators={true}
                  />
                </View>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* Presence System */}
        <FadeInView duration={300} delay={500}>
          <View style={components.card.getCardStyle('outlined')}>
            <Text style={components.card.getCardTitleStyle()}>Presence System Integration</Text>
            <Text style={{ color: theme.colors.content.secondary, marginTop: 4, marginBottom: 16 }}>
              Real-time presence indicators with status-aware animations
            </Text>
            
            {/* Presence Selection */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {allPresenceStatuses.map((presence) => (
                <TouchableOpacity 
                  key={presence} 
                  onPress={() => setSelectedPresence(presence)}
                  style={[
                    components.button.getButtonStyle(
                      selectedPresence === presence ? 'primary' : 'outlined', 
                      'sm'
                    ),
                  ]}
                >
                  <Text style={{ 
                    color: selectedPresence === presence 
                      ? theme.colors.primary.text 
                      : theme.colors.primary.main,
                    fontSize: 12,
                  }}>
                    {presence.charAt(0).toUpperCase() + presence.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Presence Indicators */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PresenceIndicator 
                  status={selectedPresence} 
                  size={8}
                  showPulse={selectedPresence === 'online'}
                  animated={true}
                />
                <Text style={{ color: theme.colors.content.primary, fontSize: 14 }}>
                  Small (8px)
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PresenceIndicator 
                  status={selectedPresence} 
                  size={12}
                  showPulse={selectedPresence === 'online'}
                  animated={true}
                />
                <Text style={{ color: theme.colors.content.primary, fontSize: 14 }}>
                  Medium (12px)
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <PresenceIndicator 
                  status={selectedPresence} 
                  size={16}
                  showPulse={selectedPresence === 'online'}
                  animated={true}
                />
                <Text style={{ color: theme.colors.content.primary, fontSize: 14 }}>
                  Large (16px)
                </Text>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* System Benefits */}
        <FadeInView duration={300} delay={600}>
          <View style={components.card.getCardStyle('elevated')}>
            <Text style={components.card.getCardTitleStyle()}>Phase 3 Benefits</Text>
            <Text style={{ color: theme.colors.content.secondary, marginTop: 8, lineHeight: 20 }}>
              • 🎨 **Semantic Color Integration**: Role and status-based color systems{'\n'}
              • ✨ **Smooth Animations**: Micro-interactions and state transitions{'\n'}
              • 🔧 **Flexible Components**: Multiple variants and configuration options{'\n'}
              • 📱 **Status-Aware UI**: Dynamic styling based on data state{'\n'}
              • 🚀 **Production Ready**: Type-safe, performant, and accessible{'\n'}
              • 🎯 **Consistent UX**: Unified interaction patterns across the app
            </Text>
          </View>
        </FadeInView>

      </View>
    </ScrollView>
  );
}; 