/**
 * Theme Showcase Component
 * Demonstrates the enhanced theme system with semantic colors and utilities
 * This is an example component showing best practices for using the new theme features
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useSemanticColors, useComponentUtils } from '../../theme/utils';
import { useSemanticStyles } from '../../theme/utils/semantic-utils';
import type { TripStatus, MemberRole, PresenceStatus } from '../../theme/types';

export const ThemeShowcase: React.FC = () => {
  const { theme } = useAppTheme();
  const semantic = useSemanticColors();
  const components = useComponentUtils(theme);
  const semanticStyles = useSemanticStyles(theme);

  // Example data
  const tripStatuses: TripStatus[] = ['draft', 'planning', 'active', 'completed', 'cancelled'];
  const memberRoles: MemberRole[] = ['owner', 'admin', 'moderator', 'member', 'viewer'];
  const presenceStatuses: PresenceStatus[] = ['online', 'away', 'busy', 'offline', 'typing'];

  return (
    <ScrollView style={components.list.getListContainerStyle()}>
      <View style={{ padding: 16, gap: 24 }}>
        
        {/* Header */}
        <View style={components.card.getCardStyle('elevated')}>
          <Text style={components.card.getCardTitleStyle()}>
            Enhanced Theme System Showcase
          </Text>
          <Text style={{ color: theme.colors.content.secondary, marginTop: 8 }}>
            Demonstrating semantic colors, component utilities, and styling patterns
          </Text>
        </View>

        {/* Trip Status Section */}
        <View style={components.card.getCardStyle('outlined')}>
          <Text style={components.card.getCardTitleStyle()}>Trip Status Colors</Text>
          <View style={{ gap: 12, marginTop: 16 }}>
            {tripStatuses.map((status) => (
              <View key={status} style={semanticStyles.tripStatus.getTripStatusCard(status)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={semanticStyles.tripStatus.getTripStatusBadge(status)}>
                    <Text style={{ color: semantic.getTripStatusColors(status).content }}>
                      {status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ color: semantic.getTripStatusColors(status).content }}>
                    Example trip in {status} status
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Member Roles Section */}
        <View style={components.card.getCardStyle('outlined')}>
          <Text style={components.card.getCardTitleStyle()}>Member Role Colors</Text>
          <View style={{ gap: 12, marginTop: 16 }}>
            {memberRoles.map((role) => (
              <View key={role} style={semanticStyles.memberRole.getMemberRoleContainer(role)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={semanticStyles.memberRole.getMemberRoleBadge(role)}>
                    <Text style={{ color: '#FFFFFF' }}>
                      {role.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ color: semantic.getMemberRoleColors(role).content }}>
                    User with {role} role
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Presence Indicators Section */}
        <View style={components.card.getCardStyle('outlined')}>
          <Text style={components.card.getCardTitleStyle()}>Presence Indicators</Text>
          <View style={{ gap: 12, marginTop: 16 }}>
            {presenceStatuses.map((status) => (
              <View key={status} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={semanticStyles.presence.getPresenceIndicator(status, 12)} />
                <View style={semanticStyles.presence.getPresenceBadge(status)}>
                  <Text style={{ color: semantic.getPresenceColors(status).content }}>
                    {status.toUpperCase()}
                  </Text>
                </View>
                <Text style={semanticStyles.presence.getPresenceText(status)}>
                  User is {status}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Component Variants Section */}
        <View style={components.card.getCardStyle('outlined')}>
          <Text style={components.card.getCardTitleStyle()}>Component Variants</Text>
          
          {/* Button Examples */}
          <Text style={{ color: theme.colors.content.secondary, marginTop: 16, marginBottom: 8 }}>
            Button Variants:
          </Text>
          <View style={{ gap: 8 }}>
            <View style={components.button.getButtonStyle('primary', 'md')}>
              <Text style={{ color: theme.colors.primary.text }}>Primary Button</Text>
            </View>
            <View style={components.button.getButtonStyle('secondary', 'md')}>
              <Text style={{ color: theme.colors.content.primary }}>Secondary Button</Text>
            </View>
            <View style={components.button.getButtonStyle('outlined', 'md')}>
              <Text style={{ color: theme.colors.primary.main }}>Outlined Button</Text>
            </View>
          </View>

          {/* List Item Examples */}
          <Text style={{ color: theme.colors.content.secondary, marginTop: 24, marginBottom: 8 }}>
            List Item Variants:
          </Text>
          <View style={{ gap: 2 }}>
            <View style={components.list.getListItemStyle('default')}>
              <Text style={{ color: theme.colors.content.primary }}>Default List Item</Text>
            </View>
            <View style={components.list.getListItemStyle('highlighted')}>
              <Text style={{ color: theme.colors.content.primary }}>Highlighted List Item</Text>
            </View>
            <View style={components.list.getListItemStyle('selected')}>
              <Text style={{ color: theme.colors.content.primary }}>Selected List Item</Text>
            </View>
          </View>
        </View>

        {/* Status-Aware List Examples */}
        <View style={components.card.getCardStyle('outlined')}>
          <Text style={components.card.getCardTitleStyle()}>Status-Aware Components</Text>
          <Text style={{ color: theme.colors.content.secondary, marginTop: 8, marginBottom: 16 }}>
            Components that adapt based on semantic status
          </Text>
          
          <View style={{ gap: 8 }}>
            <View style={semanticStyles.statusAwareList.getTripListItem('active')}>
              <Text style={{ color: semantic.getTripStatusColors('active').content }}>
                Active Trip with Status-Aware Styling
              </Text>
            </View>
            
            <View style={semanticStyles.statusAwareList.getMemberListItem('owner', 'online')}>
              <Text style={{ color: semantic.getMemberRoleColors('owner').content }}>
                Owner (Online) - Role + Presence Styling
              </Text>
            </View>
            
            <View style={semanticStyles.statusAwareList.getMemberListItem('member', 'away')}>
              <Text style={{ color: semantic.getMemberRoleColors('member').content }}>
                Member (Away) - Role + Presence Styling
              </Text>
            </View>
          </View>
        </View>

        {/* Usage Examples */}
        <View style={components.card.getCardStyle('elevated')}>
          <Text style={components.card.getCardTitleStyle()}>How to Use</Text>
          <Text style={{ color: theme.colors.content.secondary, marginTop: 8, lineHeight: 20 }}>
            1. Import semantic utilities: {`import { useSemanticColors } from '../../theme/utils';`}{'\n\n'}
            2. Get semantic colors: {`const colors = semantic.getTripStatusColors('active');`}{'\n\n'}
            3. Use in components: {`backgroundColor: colors.background`}{'\n\n'}
            4. Type-safe status props: {`status: TripStatus`}
          </Text>
        </View>

      </View>
    </ScrollView>
  );
}; 