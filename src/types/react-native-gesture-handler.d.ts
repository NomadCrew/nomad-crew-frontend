declare module 'react-native-gesture-handler' {
  import { ComponentType, ReactNode } from 'react';
  export * from 'react-native';
  
  // Re-export common gesture handler components and functions
  export const GestureHandlerRootView: ComponentType<{ children: ReactNode; style?: any }>;
  export const TapGestureHandler: React.ComponentType<any>;
  export const PanGestureHandler: React.ComponentType<any>;
  export const PinchGestureHandler: React.ComponentType<any>;
  export const RotationGestureHandler: React.ComponentType<any>;
  export const LongPressGestureHandler: React.ComponentType<any>;
  export const ForceTouchGestureHandler: React.ComponentType<any>;
  export const NativeViewGestureHandler: React.ComponentType<any>;
  export const RawButton: React.ComponentType<any>;
  export const BaseButton: React.ComponentType<any>;
  export const RectButton: React.ComponentType<any>;
  export const BorderlessButton: React.ComponentType<any>;
  export const TouchableOpacity: React.ComponentType<any>;
  export const TouchableHighlight: React.ComponentType<any>;
  export const TouchableWithoutFeedback: React.ComponentType<any>;
  export const TouchableNativeFeedback: React.ComponentType<any>;
  export const Swipeable: React.ComponentType<any>;
  export const DrawerLayout: React.ComponentType<any>;
  
  export const State: {
    UNDETERMINED: number;
    FAILED: number;
    BEGAN: number;
    CANCELLED: number;
    ACTIVE: number;
    END: number;
  };
  
  export const Directions: {
    RIGHT: number;
    LEFT: number;
    UP: number;
    DOWN: number;
  };
}