import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {Colors} from '../../theme/colors';
import {FontFamily, FontSize} from '../../theme/fonts';
import {Size} from '../../theme/size';
import {IconTemp} from '../IconTemp';
import {RFPercentage} from 'react-native-responsive-fontsize';

interface Props {
  label?: string;
  onPress: () => void;
  backgroundColor?: string;
  fontColor?: string;
  iconLeft?: string;
  iconRight?: string;
  width?: number;
  height?: number;
  fontFamily?: string;
  fontSize?: number;
  iconColor?: string;
  outlineColor?: string;
  disabled?: boolean;
  borderRadius?: number;
  outStyle?: StyleProp<ViewStyle>;
}

export const CustomButton = ({
  label = '',
  onPress,
  backgroundColor = 'transparent',
  fontColor = '#fff',
  iconLeft = '',
  iconRight = '',
  width,
  height = RFPercentage(4.3),
  iconColor = 'black',
  fontSize = FontSize.fontSizeText14,
  fontFamily = FontFamily.NotoSansDisplayMedium,
  outlineColor,
  disabled = false,
  borderRadius = 12,
  outStyle,
}: Props) => {
  const {fontScale} = useWindowDimensions();
  return (
    <TouchableOpacity
      disabled={disabled}
      activeOpacity={0.6}
      onPress={onPress}
      style={[
        outStyle,
        styles.touchable,
        {
          height: height,
          backgroundColor: backgroundColor,
          borderRadius: borderRadius,
          borderColor: outlineColor,
          borderWidth: outlineColor ? 1 : 0,
        },
      ]}>
      <View
        style={{
          justifyContent: 'center',
          paddingTop: '0%',
          flexDirection: 'row',
          alignContent: 'center',
          backgroundColor: 'transparent',
        }}>
        {iconLeft && (
          <IconTemp
            name={iconLeft}
            size={Size.iconSizeMin}
            style={{alignSelf: 'center'}}
          />
        )}
        {label && (
          <Text
            style={{
              textAlign: 'center',
              fontWeight: '500',
              fontSize: fontSize,
              alignSelf: 'center',
              fontFamily: fontFamily,
              color: fontColor,
            }}>
            {label}
          </Text>
        )}
        {iconRight && (
          <IconTemp
            name={iconRight}
            size={Size.iconSizeMin}
            style={{alignSelf: 'center'}}
            color={iconColor}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    // paddingHorizontal: '5%',
    // paddingVertical: '2%',
    width: '100%',
    justifyContent: 'center',

    // marginBottom: '4%',
    // marginHorizontal: '2%',
    marginTop: '2.5%',
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 3,
    // },
    // shadowOpacity: 0.29,
    // shadowRadius: 5.65,
    // elevation: 1,
  },
});
