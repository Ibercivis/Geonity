import React from 'react';
import {TouchableOpacity, Text, View, StyleSheet} from 'react-native';
import {Colors} from '../../theme/colors';
import {FontFamily, FontSize} from '../../theme/fonts';
import {Size} from '../../theme/size';
import {IconTemp} from './IconTemp';
import { ImageView } from './ImageView';

interface Props {
  label?: string;
  onPress: () => void;
  backgroundColor?: string;
  fontColor?: string;
  iconLeft?: string;
  iconRight?: string;
  width?: number;
}

export const CustomButtonOutline = ({
  label = '',
  onPress,
  backgroundColor = Colors.secondary,
  fontColor = '#fff',
  iconLeft = '',
  iconRight = '',
  width,
}: Props) => {
  return (
    <TouchableOpacity
      activeOpacity={0.2}
      onPress={onPress}
      style={{
        ...styles.touchable,
      }}>
      <View
        style={{
          paddingTop: '0%',
          flexDirection: 'row',
          alignContent: 'center',
        }}>
        {iconLeft && (
          // <IconTemp
          //   name={iconLeft}
          //   size={Size.iconSizeMin}
          //   style={{alignSelf: 'center', marginHorizontal: '7%'}}
          // />
            <ImageView name={iconLeft} size={Size.iconSizeMediumPlus} />
        )}
        {label && (
          <Text
            style={{
              textAlign: 'center',
              fontWeight: '400',
              fontSize: FontSize.fontSizeText13,
              alignSelf: 'center',
              justifyContent:'center',
              fontFamily: FontFamily.NotoSansDisplayRegular,
              color: fontColor,
            }}>
            {label}
          </Text>
        )}
        {iconRight && (
          <IconTemp
            name={iconRight}
            size={Size.iconSizeMin}
            style={{alignSelf: 'center', marginHorizontal: '5%'}}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
    justifyContent:'center',
    height: '7%',
    borderRadius: 10,
    borderColor: 'black',
    borderWidth:1,
    flexGrow: 1, 
    marginVertical: '1.5%',
  },
});
