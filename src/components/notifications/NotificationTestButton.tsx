import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useTestNotifications } from '../../hooks/useTestNotifications';

export const NotificationTestButton: React.FC = () => {
  const { 
    addTripInviteNotification,
    addSystemNotification,
    addChatNotification,
    addTripUpdateNotification
  } = useTestNotifications();

  return (
    <View style={styles.buttonContainer}>
      <Button 
        mode="contained" 
        onPress={addTripInviteNotification}
        style={styles.button}
        icon="account-plus"
      >
        Trip Invite
      </Button>
      
      <Button 
        mode="contained" 
        onPress={addSystemNotification}
        style={styles.button}
        icon="information"
      >
        System
      </Button>
      
      <Button 
        mode="contained" 
        onPress={addChatNotification}
        style={styles.button}
        icon="chat"
      >
        Chat
      </Button>
      
      <Button 
        mode="contained" 
        onPress={addTripUpdateNotification}
        style={styles.button}
        icon="calendar-edit"
      >
        Trip Update
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    flex: 1,
    minWidth: '45%',
    marginVertical: 4,
  }
}); 