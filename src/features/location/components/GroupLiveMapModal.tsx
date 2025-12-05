import React from 'react';
import { Modal, StyleSheet, View, Dimensions, TouchableOpacity } from 'react-native';
import { GroupLiveMap } from './GroupLiveMap';
import { Trip } from '@/src/features/trips/types';
import { useAppTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';
import { Portal, IconButton } from 'react-native-paper';
import { BlurView } from 'expo-blur';

interface GroupLiveMapModalProps {
  visible: boolean;
  onClose: () => void;
  trip: Trip;
}

export const GroupLiveMapModal: React.FC<GroupLiveMapModalProps> = ({ visible, onClose, trip }) => {
  const { theme } = useAppTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles(theme).container}>
        <GroupLiveMap trip={trip} onClose={onClose} />
      </View>
    </Modal>
  );
};

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.default,
    },
  });
