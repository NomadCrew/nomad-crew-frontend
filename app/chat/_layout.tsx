import { Stack } from 'expo-router';
import { useTheme } from '@/src/theme/ThemeProvider';

export default function ChatLayout() {
  const { theme } = useTheme();
  
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: theme?.colors?.background?.default || '#FFFFFF',
        }
      }}
    />
  );
} 