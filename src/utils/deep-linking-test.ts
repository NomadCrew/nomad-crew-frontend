// src/utils/deep-linking-test.ts
import { Linking } from 'react-native';

export async function testDeepLinking() {
  // Test URIs
  const testUrls = [
    'nomadcrew://login',
    'nomadcrew://auth/callback',
    'https://nomadcrew.uk/auth/callback'
  ];

  console.log('🔗 Testing deep linking...');
  
  for (const url of testUrls) {
    try {
      const supported = await Linking.canOpenURL(url);
      console.log(`✓ Can open ${url}: ${supported ? 'Yes' : 'No'}`);

      // If supported, let's also test the URL parsing
      if (supported) {
        const parsed = Linking.parse(url);
        console.log(`  Parsed URL:`, parsed);
      }
    } catch (error) {
      console.error(`✕ Error testing ${url}:`, error);
    }
  }
}