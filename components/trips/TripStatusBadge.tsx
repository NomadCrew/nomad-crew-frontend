import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/src/theme/ThemeProvider';
import { TripStatus } from '@/src/types/trip';
import type { Theme } from '@/src/theme/types';

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
    textStyle
}) => {
    const { theme } = useTheme();
    const styles = makeStyles(theme);

    const getStatusColor = (status: TripStatus) => {
        switch (status) {
            case 'PLANNING':
                return theme.colors.primary.main;
            case 'ACTIVE':
                return theme.colors.status.success.content;
            case 'COMPLETED':
                return theme.colors.content.secondary;
            case 'CANCELLED':
                return theme.colors.status.error.content;
            default:
                return theme.colors.content.secondary;
        }
    };

    const statusColor = getStatusColor(status);

    return (
        <View style={[
            styles.container,
            styles[size],
            { backgroundColor: statusColor + '20' },
            style
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
    },
    text: {
        ...theme.typography.button.small,
        fontWeight: '600',
    },
    small: {
        paddingHorizontal: theme.spacing.inset.xs,
        paddingVertical: theme.spacing.inset.xxs,
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