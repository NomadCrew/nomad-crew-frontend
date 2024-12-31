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
      console.log('Google Sign-In userInfo:', userInfo); // Debug log
      await handleGoogleSignInSuccess(userInfo);
      } catch (error: any) {
      console.log('Google Sign-In Error Details:', error); // Detailed error log
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Sign in cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Sign in in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.error('Play services not available');
      } else {
        console.error('Google Sign-In Error:', error);
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