declare module 'react-native-onboarding-swiper' {
  import React from 'react';
  import { StyleProp, TextStyle, ViewStyle, ImageStyle } from 'react-native';

  export interface OnboardingProps {
    pages: Page[];
    bottomBarColor?: string;
    bottomBarHeight?: number;
    bottomBarHighlight?: boolean;
    containerStyles?: StyleProp<ViewStyle>;
    controlStatusBar?: boolean;
    flatlistProps?: any;
    imageContainerStyles?: StyleProp<ViewStyle>;
    nextLabel?: string | React.ReactNode;
    onDone?: () => void;
    onSkip?: () => void;
    showDone?: boolean;
    showSkip?: boolean;
    showNext?: boolean;
    skipLabel?: string | React.ReactNode;
    skipToPage?: number;
    pageIndexCallback?: (index: number) => void;
    transitionAnimationDuration?: number;
    allowFontScaling?: boolean;
    titleStyles?: StyleProp<TextStyle>;
    subTitleStyles?: StyleProp<TextStyle>;
    NextButtonComponent?: React.ComponentType<any>;
    DoneButtonComponent?: React.ComponentType<any>;
    SkipButtonComponent?: React.ComponentType<any>;
    DotComponent?: React.ComponentType<any>;
  }

  export interface Page {
    backgroundColor: string;
    image: React.ReactNode;
    title: string | React.ReactNode;
    subtitle: string | React.ReactNode;
    titleStyles?: StyleProp<TextStyle>;
    subTitleStyles?: StyleProp<TextStyle>;
    imageStyles?: StyleProp<ImageStyle>;
  }

  export default class Onboarding extends React.Component<OnboardingProps> {}
} 