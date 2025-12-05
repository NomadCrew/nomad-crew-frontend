import { GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { useGoogleSignIn } from '@/src/hooks/useGoogleSignIn';

interface AuthButtonProps {
  onPress?: () => void;
}

export default function AuthButton({ onPress }: AuthButtonProps) {
  const { signIn } = useGoogleSignIn();

  return (
    <GoogleSigninButton
      style={{ width: 192, height: 48, borderRadius: 50 }}
      size={GoogleSigninButton.Size.Wide}
      color={GoogleSigninButton.Color.Dark}
      onPress={async () => {
        if (onPress) onPress();
        await signIn();
      }}
    />
  );
}
