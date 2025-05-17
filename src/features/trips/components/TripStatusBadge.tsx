import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { TripStatus } from '@/src/features/trips/types'; // Updated path
import type { Theme } from '@/src/theme/types';
import { logger } from '@/src/utils/logger';

interface TripStatusBadgeProps {
    status: TripStatus;
    size?: 'small' | 'medium' | 'large';
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const TripStatusBadge: React.FC<TripStatusBadgeProps> = ({
    status,
    size = 'medium',
    style,
    textStyle,
}) => {
    const { theme } = useTheme();
    const styles = makeStyles(theme);

    const getStatusColorAndBackground = (status: TripStatus, theme: Theme) => {
        switch (status) {
            case 'PLANNING':
                return { content: theme.colors.status.planning.content, background: theme.colors.status.planning.background };
            case 'ACTIVE':
                return { content: theme.colors.status.success.content, background: theme.colors.status.success.background };
            case 'COMPLETED':
                return { content: theme.colors.status.completed.content, background: theme.colors.status.completed.background };
            case 'CANCELLED':
                return { content: theme.colors.status.error.content, background: theme.colors.status.error.background };
            default:
                logger.warn('TRIP', `Unexpected TripStatus: ${status}`);
                return { content: theme.colors.content.secondary, background: theme.colors.primary.hover };
        }
    };

    const { content: statusColor, background: backgroundColor } = getStatusColorAndBackground(status, theme);

    return (
        <View style={[
            styles.container,
            styles[size],
            style,
            { backgroundColor }
        ]}>
            <Text style={[
                styles.text,
                styles[`${size}Text`],
                { color: statusColor },
                textStyle
            ]}>
                {status}
            </Text>
        </View>
    );
};

const makeStyles = (theme: Theme) => StyleSheet.create({
    container: {
        borderRadius: theme.spacing.inset.sm,
        alignSelf: 'flex-start',
        // backgroundColor: theme.colors.primary.hover, // Removed - handled dynamically
    },
    text: {
        ...theme.typography.button.small,
        fontWeight: '600',
    },
    small: {
        paddingHorizontal: theme.spacing.inset.xs,
        paddingVertical: theme.spacing.inset.xs,
    },
    medium: {
        paddingHorizontal: theme.spacing.inset.sm,
        paddingVertical: theme.spacing.inset.xs,
    },
    large: {
        paddingHorizontal: theme.spacing.inset.md,
        paddingVertical: theme.spacing.inset.sm,
    },
    smallText: {
        fontSize: theme.typography.caption.fontSize,
    },
    mediumText: {
        fontSize: theme.typography.button.small.fontSize,
    },
    largeText: {
        fontSize: theme.typography.button.medium.fontSize,
    },
}); 