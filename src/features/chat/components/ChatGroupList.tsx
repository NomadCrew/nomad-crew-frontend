import React from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Text,
  RefreshControl
} from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { ChatGroup } from '@/src/features/chat';
import { ChatGroupItem } from './ChatGroupItem';
import { Theme } from '@/src/theme/types';

interface ChatGroupListProps {
  groups: ChatGroup[];
  selectedGroupId: string | null;
  isLoading: boolean;
  onSelectGroup: (groupId: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const ChatGroupList: React.FC<ChatGroupListProps> = ({
  groups,
  selectedGroupId,
  isLoading,
  onSelectGroup,
  onRefresh,
  isRefreshing = false
}) => {
  const { theme } = useTheme();

  const renderItem = ({ item }: { item: ChatGroup }) => {
    return (
      <ChatGroupItem
        group={item}
        onPress={onSelectGroup}
        isSelected={selectedGroupId === item.id}
      />
    );
  };

  if (isLoading && groups.length === 0) {
    return (
      <View style={styles(theme).loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.default} />
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <View style={styles(theme).emptyContainer}>
        <Text style={styles(theme).emptyText}>
          No chat groups available
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={groups}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles(theme).listContent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.default]}
            tintColor={theme.colors.primary.default}
          />
        ) : undefined
      }
    />
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.stack.lg,
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
}); 