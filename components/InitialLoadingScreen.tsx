import { View, ActivityIndicator, Image, StyleSheet, Dimensions } from 'react-native';

export function InitialLoadingScreen() {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/images/splash.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <ActivityIndicator size="large" color="#FFFFFF" />
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  backgroundImage: {
    position: 'absolute',
    width,
    height,
    top: 0,
    left: 0,
  }
});