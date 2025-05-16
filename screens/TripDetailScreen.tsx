import { ChatCard } from '@/src/features/chat/components';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/types/navigation';

interface TripDetailScreenProps {
  trip: {
    id: string;
    name: string;
    [key: string]: any;
  };
}

export const TripDetailScreen = ({ trip }: TripDetailScreenProps) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
}); 