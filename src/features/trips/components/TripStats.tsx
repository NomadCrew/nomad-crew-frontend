import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import {
  Hourglass,
  CalendarDays,
  CheckCircle2,
  Users,
  ListChecks,
  BarChart3,
} from 'lucide-react-native';
import { useThemedStyles } from '@/src/theme/utils';
import { useTodos } from '@/src/features/todos/hooks';
import { usePolls } from '@/src/features/polls/hooks';
import type { Trip } from '@/src/features/trips/types';

interface TripStatsProps {
  trip: Trip;
  tripId: string;
}

function useCountdown(trip: Trip) {
  return useMemo(() => {
    const now = new Date();
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);

    const diffDays = (a: Date, b: Date) =>
      Math.ceil((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));

    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      const duration = diffDays(end, start);
      return { value: duration, label: 'day trip', icon: CheckCircle2 };
    }
    if (trip.status === 'ACTIVE') {
      const left = diffDays(end, now);
      return {
        value: Math.max(0, left),
        label: left === 1 ? 'day left' : 'days left',
        icon: CalendarDays,
      };
    }
    // PLANNING
    const until = diffDays(start, now);
    return {
      value: Math.max(0, until),
      label: until === 1 ? 'day to go' : 'days to go',
      icon: Hourglass,
    };
  }, [trip.startDate, trip.endDate, trip.status]);
}

export const TripStats: React.FC<TripStatsProps> = ({ trip, tripId }) => {
  const countdown = useCountdown(trip);
  const { data: todosData, isLoading: todosLoading } = useTodos(tripId);
  const { data: pollsData, isLoading: pollsLoading } = usePolls(tripId);

  const memberCount = trip.members?.length ?? trip.participantCount ?? 0;

  const todoStats = useMemo(() => {
    if (!todosData?.data) return { completed: 0, total: 0 };
    const total = todosData.data.length;
    const completed = todosData.data.filter((t) => t.status === 'COMPLETE').length;
    return { completed, total };
  }, [todosData]);

  const activePolls = useMemo(() => {
    if (!pollsData?.data) return 0;
    return pollsData.data.filter((p) => p.status === 'ACTIVE').length;
  }, [pollsData]);

  const styles = useThemedStyles((theme) => {
    const textPrimary = theme?.colors?.content?.primary || '#1A1A1A';
    const textSecondary = theme?.colors?.content?.secondary || '#6B7280';
    const surfaceVariant = theme?.colors?.surface?.variant || '#F3F4F6';
    const spacingInsetMd = theme?.spacing?.inset?.md || 16;
    const spacingStackSm = theme?.spacing?.stack?.sm || 8;

    return {
      statsCard: {
        height: '100%',
        width: '100%',
        padding: spacingInsetMd,
        backgroundColor: surfaceVariant,
        borderRadius: 24,
        flex: 1,
      },
      grid: {
        flex: 1,
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
      },
      cell: {
        width: '50%' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingVertical: spacingStackSm,
      },
      iconRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 4,
      },
      statValue: {
        fontSize: 22,
        fontWeight: '700' as const,
        color: textPrimary,
        lineHeight: 28,
      },
      statLabel: {
        fontSize: 11,
        color: textSecondary,
        marginTop: 2,
        textAlign: 'center' as const,
      },
      skeleton: {
        fontSize: 22,
        fontWeight: '700' as const,
        color: textSecondary,
        opacity: 0.4,
      },
    };
  });

  const CountdownIcon = countdown.icon;

  return (
    <Surface style={styles.statsCard as any} elevation={0}>
      <View style={styles.grid}>
        {/* Countdown */}
        <View style={styles.cell}>
          <View style={styles.iconRow}>
            <CountdownIcon size={16} color={styles.statValue.color} />
            <Text style={styles.statValue}>{countdown.value}</Text>
          </View>
          <Text style={styles.statLabel}>{countdown.label}</Text>
        </View>

        {/* Members */}
        <View style={styles.cell}>
          <View style={styles.iconRow}>
            <Users size={16} color={styles.statValue.color} />
            <Text style={styles.statValue}>{memberCount}</Text>
          </View>
          <Text style={styles.statLabel}>{memberCount === 1 ? 'member' : 'members'}</Text>
        </View>

        {/* Todos */}
        <View style={styles.cell}>
          <View style={styles.iconRow}>
            <ListChecks size={16} color={styles.statValue.color} />
            <Text style={todosLoading ? styles.skeleton : styles.statValue}>
              {todosLoading ? '--' : `${todoStats.completed}/${todoStats.total}`}
            </Text>
          </View>
          <Text style={styles.statLabel}>todos</Text>
        </View>

        {/* Polls */}
        <View style={styles.cell}>
          <View style={styles.iconRow}>
            <BarChart3 size={16} color={styles.statValue.color} />
            <Text style={pollsLoading ? styles.skeleton : styles.statValue}>
              {pollsLoading ? '--' : activePolls}
            </Text>
          </View>
          <Text style={styles.statLabel}>{activePolls === 1 ? 'active poll' : 'active polls'}</Text>
        </View>
      </View>
    </Surface>
  );
};
