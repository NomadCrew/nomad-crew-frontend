import { ImageSourcePropType } from 'react-native';

export interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  backgroundColor: string;
}