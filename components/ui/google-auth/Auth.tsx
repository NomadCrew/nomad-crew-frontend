import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuthStore } from '@/src/store/useAuthStore';

interface AuthButtonProps {
  onPress?: () => void;
}

export default function AuthButton({ onPress }: AuthButtonProps) {
  const { handleGoogleSignInSuccess } = useAuthStore();

  GoogleSignin.configure({
    scopes: ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/userinfo.profile"],
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
  });

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      await handleGoogleSignInSuccess(userInfo);
      } catch (error: any) {
      // Handle Google Sign-In errors
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // Sign in cancelled
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Sign in in progress
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play services not available
      }
    }
  };

  return (
    <GoogleSigninButton
      style={{ width: 192, height: 48, borderRadius: 50 }}
      size={GoogleSigninButton.Size.Wide}
      color={GoogleSigninButton.Color.Dark}
      onPress={async () => {
        if (onPress) onPress();
        await handleGoogleSignIn();
      }}
    />
  );
}