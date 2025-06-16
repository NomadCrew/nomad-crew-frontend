/**
 * StatusAwareList - Status-aware list component with animations
 * Displays lists with status-based styling and smooth interactions
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useSemanticColors, useAnimationUtils, useComponentUtils } from '../../theme/utils';
import { FadeInView, SlideInView } from './animations/LoadingStates';
import { PresenceIndicator } from './animations/PresenceIndicator';
import { RoleBadge } from './RoleBadge';
import type { TripStatus, MemberRole, PresenceStatus } from '../../theme/types';

// Base item interface
interface BaseListItem {
  id: string;
  title: string;
  subtitle?: string;
  avatar?: string;
  onPress?: () => void;
}

// Different item types
interface TripListItem extends BaseListItem {
  type: 'trip';
  status: TripStatus;
  memberCount?: number;
  startDate?: Date;
}

interface MemberListItem extends BaseListItem {
  type: 'member';
  role: MemberRole;
  presence: PresenceStatus;
  lastSeen?: Date;
}

interface TaskListItem extends BaseListItem {
  type: 'task';
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
}

interface NotificationListItem extends BaseListItem {
  type: 'notification';
  read: boolean;
  timestamp: Date;
  category: 'mention' | 'system' | 'chat' | 'location';
}

type ListItem = TripListItem | MemberListItem | TaskListItem | NotificationListItem;

interface StatusAwareListProps {
  items: ListItem[];
  emptyText?: string;
  emptyIcon?: string;
  animated?: boolean;
  showSeparators?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const StatusAwareList: React.FC<StatusAwareListProps> = ({
  items,
  emptyText = 'No items found',
  emptyIcon = '📭',
  animated = true,
  showSeparators = true,
  onRefresh,
  refreshing = false,
}) => {
  const { theme } = useAppTheme();
  const semantic = useSemanticColors(theme);
  const animations = useAnimationUtils(theme);
  const components = useComponentUtils(theme);
  
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Toggle item selection
  const toggleSelection = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Format date helper
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Render different item types
  const renderTripItem = (item: TripListItem, index: number) => {
    const statusColors = semantic.getTripStatusColors(item.status);
    const isSelected = selectedItems.has(item.id);

    return (
      <SlideInView
        key={item.id}
        direction="right"
        delay={animated ? index * 50 : 0}
        animated={animated}
      >
        <TouchableOpacity
          onPress={item.onPress}
          style={[
            components.list.getListItemStyle(isSelected ? 'selected' : 'default'),
            {
              borderLeftWidth: 3,
              borderLeftColor: statusColors.border,
              backgroundColor: isSelected 
                ? statusColors.background 
                : theme.colors.surface.main,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={components.list.getListItemTitleStyle()}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={components.list.getListItemSubtitleStyle()}>
                {item.subtitle}
              </Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <Text style={{ 
                color: statusColors.content, 
                fontSize: 11, 
                fontWeight: '600' 
              }}>
                {item.status.toUpperCase()}
              </Text>
              {item.memberCount && (
                <Text style={{ color: theme.colors.content.tertiary, fontSize: 11 }}>
                  👥 {item.memberCount}
                </Text>
              )}
              {item.startDate && (
                <Text style={{ color: theme.colors.content.tertiary, fontSize: 11 }}>
                  📅 {formatDate(item.startDate)}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </SlideInView>
    );
  };

  const renderMemberItem = (item: MemberListItem, index: number) => {
    const isSelected = selectedItems.has(item.id);

    return (
      <SlideInView
        key={item.id}
        direction="right"
        delay={animated ? index * 50 : 0}
        animated={animated}
      >
        <TouchableOpacity
          onPress={item.onPress}
          style={[
            components.list.getListItemStyle(isSelected ? 'selected' : 'default'),
            { backgroundColor: isSelected ? theme.colors.primary.surface : 'transparent' },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <PresenceIndicator 
              status={item.presence} 
              size={10}
              showPulse={item.presence === 'online'}
              animated={animated}
            />
            <View style={{ flex: 1 }}>
              <Text style={components.list.getListItemTitleStyle()}>
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={components.list.getListItemSubtitleStyle()}>
                  {item.subtitle}
                </Text>
              )}
              {item.lastSeen && item.presence === 'offline' && (
                <Text style={{ color: theme.colors.content.tertiary, fontSize: 11 }}>
                  Last seen {formatDate(item.lastSeen)}
                </Text>
              )}
            </View>
            <RoleBadge 
              role={item.role} 
              size="sm" 
              variant="minimal"
              animated={animated}
            />
          </View>
        </TouchableOpacity>
      </SlideInView>
    );
  };

  const renderTaskItem = (item: TaskListItem, index: number) => {
    const isSelected = selectedItems.has(item.id);
    const priorityColors = {
      low: theme.colors.content.tertiary,
      medium: theme.colors.warning?.main || '#F59E0B',
      high: theme.colors.error?.main || '#EF4444',
    };

    return (
      <SlideInView
        key={item.id}
        direction="right"
        delay={animated ? index * 50 : 0}
        animated={animated}
      >
        <TouchableOpacity
          onPress={item.onPress}
          style={[
            components.list.getListItemStyle(isSelected ? 'selected' : 'default'),
            { 
              backgroundColor: isSelected ? theme.colors.primary.surface : 'transparent',
              opacity: item.completed ? 0.6 : 1,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: item.completed 
                  ? theme.colors.success?.main || '#10B981'
                  : priorityColors[item.priority],
                backgroundColor: item.completed 
                  ? theme.colors.success?.main || '#10B981'
                  : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.completed && (
                <Text style={{ color: 'white', fontSize: 10 }}>✓</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text 
                style={[
                  components.list.getListItemTitleStyle(),
                  item.completed && { textDecorationLine: 'line-through' },
                ]}
              >
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={components.list.getListItemSubtitleStyle()}>
                  {item.subtitle}
                </Text>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: priorityColors[item.priority],
                  }}
                />
                <Text style={{ color: theme.colors.content.tertiary, fontSize: 11 }}>
                  {item.priority.toUpperCase()}
                </Text>
                {item.dueDate && (
                  <Text style={{ color: theme.colors.content.tertiary, fontSize: 11 }}>
                    Due {formatDate(item.dueDate)}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </SlideInView>
    );
  };

  const renderNotificationItem = (item: NotificationListItem, index: number) => {
    const isSelected = selectedItems.has(item.id);
    const categoryIcons = {
      mention: '💬',
      system: '⚙️',
      chat: '💭',
      location: '📍',
    };

    return (
      <SlideInView
        key={item.id}
        direction="right"
        delay={animated ? index * 50 : 0}
        animated={animated}
      >
        <TouchableOpacity
          onPress={item.onPress}
          style={[
            components.list.getListItemStyle(isSelected ? 'selected' : 'default'),
            { 
              backgroundColor: isSelected 
                ? theme.colors.primary.surface 
                : item.read 
                ? 'transparent' 
                : theme.colors.primary.surface + '20',
              borderLeftWidth: item.read ? 0 : 3,
              borderLeftColor: theme.colors.primary.main,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 16 }}>
              {categoryIcons[item.category]}
            </Text>
            <View style={{ flex: 1 }}>
              <Text 
                style={[
                  components.list.getListItemTitleStyle(),
                  { fontWeight: item.read ? 'normal' : '600' },
                ]}
              >
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={components.list.getListItemSubtitleStyle()}>
                  {item.subtitle}
                </Text>
              )}
              <Text style={{ color: theme.colors.content.tertiary, fontSize: 11, marginTop: 2 }}>
                {formatDate(item.timestamp)}
              </Text>
            </View>
            {!item.read && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: theme.colors.primary.main,
                }}
              />
            )}
          </View>
        </TouchableOpacity>
      </SlideInView>
    );
  };

  // Render item based on type
  const renderItem = (item: ListItem, index: number) => {
    switch (item.type) {
      case 'trip':
        return renderTripItem(item, index);
      case 'member':
        return renderMemberItem(item, index);
      case 'task':
        return renderTaskItem(item, index);
      case 'notification':
        return renderNotificationItem(item, index);
      default:
        return null;
    }
  };

  // Render separator
  const renderSeparator = (index: number) => {
    if (!showSeparators || index === items.length - 1) return null;
    
    return (
      <View
        key={`separator-${index}`}
        style={{
          height: 1,
          backgroundColor: theme.colors.border?.default || theme.colors.surface.variant,
          marginLeft: 16,
        }}
      />
    );
  };

  // Empty state
  if (items.length === 0) {
    return (
      <FadeInView animated={animated} duration={400}>
        <View style={components.list.getListContainerStyle()}>
          <View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
          }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>
              {emptyIcon}
            </Text>
            <Text style={{
              color: theme.colors.content.secondary,
              fontSize: 16,
              textAlign: 'center',
            }}>
              {emptyText}
            </Text>
          </View>
        </View>
      </FadeInView>
    );
  }

  return (
    <ScrollView style={components.list.getListContainerStyle()}>
      {items.map((item, index) => (
        <View key={item.id}>
          {renderItem(item, index)}
          {renderSeparator(index)}
        </View>
      ))}
    </ScrollView>
  );
};

// Export types for consumers
export type { ListItem, TripListItem, MemberListItem, TaskListItem, NotificationListItem }; 