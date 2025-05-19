import { Stack } from 'expo-router';
import { useAppTheme } from '@/src/theme/ThemeProvider';

export default function ChatLayout() {
  const { theme } = useAppTheme();
  
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