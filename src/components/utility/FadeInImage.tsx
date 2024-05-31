import React from 'react';
import {View, Animated, ActivityIndicator, StyleProp, ImageStyle} from 'react-native';
import {useAnimation} from '../../hooks/useAnimation';
import {useState} from 'react';

//componente que permite al pasarle una url de una imagen + un estilo, hacer una pequeña animación para mostrarlo

interface Props {
  uri: string;
  style?: StyleProp<ImageStyle>;
}

export const FadeInImage = ({uri, style}: Props) => {
  const {opacity, FadeIn} = useAnimation();
  const [isLoaded, setIsLoaded] = useState(false);

  const finishLoading = () => {
    setIsLoaded(false);
    FadeIn();
  }

  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      {isLoaded && (
        <ActivityIndicator
          style={{position: 'absolute'}}
          size={20}
          color="#5856D6"
        />
      )}
      <Animated.Image
        source={{uri: uri}}
        onLoadEnd={finishLoading}
        style={{...style as any, opacity}}
      />
    </View>
  );
};
