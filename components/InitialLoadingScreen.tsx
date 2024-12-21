import { View, ActivityIndicator } from 'react-native';

export function InitialLoadingScreen() {
  return (
    <View 
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
      }}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}