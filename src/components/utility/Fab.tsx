import React from 'react';
import {StyleProp, View, ViewStyle, StyleSheet, TouchableOpacity} from 'react-native';
import {IconTemp} from './IconTemp';

interface Props {
  iconName: string;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
  size?: number;
  iconSize?: number;
}

export const Fab = ({iconName, onPress, style = {}, size = 50, iconSize = 40}: Props) => {
  return (
    <View style={{...(style as any)}}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={{...styles.blackButton, height: size, width: size, alignItems: 'center', paddingRight: 2}}>
        <IconTemp name={iconName} size={iconSize} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  blackButton: {
    zIndex: 9999,
    height: 50,
    width: 50,
    paddingLeft: 2,
    backgroundColor: 'black',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4.6,
    elevation: 6,
  },
});
