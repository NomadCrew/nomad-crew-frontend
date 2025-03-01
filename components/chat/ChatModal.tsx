import React from 'react';
import { Modal, StyleSheet, View, Platform, Dimensions } from 'react-native';
import { MobileChatScreen } from '@/screens/chat/MobileChatScreen';
import { ChatScreen } from '@/screens/chat/ChatScreen';
import { useTheme } from '@/src/theme/ThemeProvider';
import { Theme } from '@/src/theme/types';

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  tripId: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  visible,
  onClose,
  tripId
}) => {
  const { theme } = useTheme();
  const { width } = Dimensions.get('window');
  
  // Determine if we should use the mobile or desktop layout
  const isMobile = Platform.OS !== 'web' || width < 768;
  
  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
    >
      <View style={styles(theme).container}>
        {isMobile ? (
          <MobileChatScreen tripId={tripId} onBack={onClose} />
        ) : (
          <ChatScreen tripId={tripId} />
        )}
      </View>
    </Modal>
  );
};

const styles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
}); 