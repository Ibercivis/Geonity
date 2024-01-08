import {useRef} from 'react';
import {Animated,Easing} from 'react-native';

//hoock empleado para hacer pequeñas animaciones jugando con la opacidad

export const useAnimation = () => {
  const opacity = useRef(new Animated.Value(0)).current;
  const position = useRef(new Animated.Value(0)).current;

  const FadeIn = (duration: number = 1000) => {
    Animated.timing(
      opacity, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
    }).start();
  };

  const FadeOut = (duration: number = 700) => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: duration,
      useNativeDriver: true,
    }).start();
  };

  const positionStart = (initPosition: number, duration: number = 700) => {
    position.setValue(initPosition);
    Animated.timing(position, {
      toValue: 0,
      duration: duration,
      useNativeDriver: true,
      easing: Easing.bounce,
    }).start();
  };

  return {
    opacity,
    position,
    FadeIn,
    FadeOut,
    positionStart,
  };
};
