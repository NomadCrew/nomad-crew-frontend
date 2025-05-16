import { ImageSourcePropType, StyleProp, TextStyle, ViewStyle } from 'react-native';

export interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  backgroundColor: string;
  titleStyles?: StyleProp<TextStyle>;
  subtitleStyles?: StyleProp<TextStyle>;
  imageStyles?: StyleProp<ViewStyle>;
  backgroundOpacity?: number;
}