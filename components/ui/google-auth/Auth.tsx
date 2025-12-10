import { GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { useGoogleSignIn } from '@/src/hooks/useGoogleSignIn';

interface AuthButtonProps {
  onPress?: () => void;
}

/**
 * Renders a Google sign-in button that invokes an optional callback, then initiates the Google sign-in flow.
 *
 * @param onPress - Optional callback invoked immediately when the button is pressed, before starting sign-in.
 * @returns The configured Google sign-in button element
 */
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