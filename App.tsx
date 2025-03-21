import React, { useEffect } from 'react';
import { View, LogBox, Platform, UIManager } from 'react-native';

// Existing imports...

export default function App() {
  useEffect(() => {
    // Enable LayoutAnimation for Android
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    
    // Ignore specific warnings that don't affect app functionality
    LogBox.ignoreLogs([
      'Non-serializable values were found in the navigation state',
    ]);
  }, []);

  // Existing app code...
  // ...
} 