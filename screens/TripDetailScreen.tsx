import { ChatCard } from '@/components/chat/ChatCard';

export const TripDetailScreen = () => {
  const handleNavigateToChat = () => {
    navigation.navigate('Chat', { tripId: trip.id });
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chat</Text>
        <ChatCard 
          tripId={trip.id} 
          onPress={handleNavigateToChat} 
        />
      </View>
    </View>
  );
}; 