import React from 'react';
import {Image, View} from 'react-native';
import {Colors} from '../../theme/colors';

interface Props {
  name: string;
  size: number;
}

export const ImageView = ({name, size}: Props) => {
  switch (name) {
    case 'google':
      return (
        <View style={{alignSelf: 'center', marginLeft: '3%', marginRight: '5%'}}>
          <Image style={{height: size, width: size}} source={require('../../assets/icons/google-icon.png')} />
        </View>
      );
    case 'apple':
      return (
        <View style={{alignSelf: 'center', marginLeft: '3%', marginRight: '5%'}}>
          <Image style={{height: size, width: size}} source={require('../../assets/icons/apple-icon.png')} />
        </View>
      );
    case 'microsoft':
      return (
        <View style={{alignSelf: 'center', marginLeft: '3%', marginRight: '5%'}}>
          <Image style={{height: size, width: size}} source={require('../../assets/icons/microsoft-icon.png')} />
        </View>
      );

    default:
      return (
        <View style={{alignSelf: 'center', marginLeft: '3%', marginRight: '5%'}}>
          <Image style={{height: size, width: size}} source={require('../../assets/icons/google-icon.png')} />
        </View>
      );
  }
};
