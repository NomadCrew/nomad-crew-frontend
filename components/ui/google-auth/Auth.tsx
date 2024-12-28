import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';
import { useTheme } from '@/src/theme';
import { getButtonStyles } from '@/src/theme/styles';

export default function AuthButton() {
  GoogleSignin.configure({
    scopes: ["https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/userinfo.profile"],
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
  });
  const { theme } = useTheme();
  const buttonStyles = getButtonStyles(theme);

  return (
    <GoogleSigninButton
      style={{ width: 192, height: 48, borderRadius: 50, }}
      size={GoogleSigninButton.Size.Wide}
      color={GoogleSigninButton.Color.Dark}
      onPress={async () => {
        try{
          console.log(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
          await GoogleSignin.hasPlayServices();
          const userInfo = await GoogleSignin.signIn();
          console.log(JSON.stringify(userInfo, null, 2));
        } catch (error: any) {
          if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            console.log('User cancelled the sign in process');
          } else if (error.code === statusCodes.IN_PROGRESS) {
            console.log('Sign in is in progress');
          } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            console.log('Play services not available or outdated');
          } else {
            console.error('Something went wrong:', error);
      }
    }
  }
}
      // disabled={this.state.isSigninInProgress}
    />
  );
}
