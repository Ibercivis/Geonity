import React from 'react';

import {Header} from '@rneui/base';
import {Dimensions, Text, TouchableOpacity, View} from 'react-native';
import {IconTemp} from './IconTemp';
import {Size} from '../theme/size';
import {FontFamily, FontSize} from '../theme/fonts';
import Back from '../assets/icons/general/chevron-left.svg';
import {RFPercentage} from 'react-native-responsive-fontsize';
import { Colors } from '../theme/colors';

interface Props {
  onPressLeft: () => void;
  onPressRight?: () => void;
  title: string;
  backgroundColor?: string;
  rightIcon?: boolean;
  renderRight?: () => React.ReactNode;
}

export const HeaderComponent = ({
  title,
  onPressLeft,
  onPressRight,
  backgroundColor = 'white',
  rightIcon = true,
  renderRight,
}: Props) => {
  const renderRightIcon = () => {
    if (rightIcon) {
      return (
        <View>
          <TouchableOpacity activeOpacity={0.5} onPress={onPressRight}>
            <View
              style={{
                justifyContent: 'center',
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <IconTemp name="information-variant" size={Size.iconSizeMedium} />
            </View>
          </TouchableOpacity>
        </View>
      );
    } else {
      return <></>;
    }
  };

  const screenWidth = Dimensions.get('window').width;
  const fontSize = screenWidth * 0.04;
  return (
    <Header
      barStyle={'dark-content'}
      containerStyle={{backgroundColor: backgroundColor, marginVertical: '0%', width:'100%',}}
      statusBarProps={{backgroundColor: backgroundColor}}
      leftContainerStyle={{width:'5%', marginRight: '4%'}}
      centerContainerStyle={{flex:7}}
      rightContainerStyle={{flex: 2}}
      leftComponent={
        <View>
          <TouchableOpacity activeOpacity={0.5} onPress={onPressLeft}>
            <View
              style={{
                justifyContent: 'center',
                flexDirection: 'row',
                alignItems: 'center',
                marginLeft: RFPercentage(1),
              }}>
              {/* <IconTemp name="arrow-left" size={Size.iconSizeMedium} /> */}
              <Back
                width={RFPercentage(3)}
                height={RFPercentage(3)}
                fill={'#000000'}
              />
            </View>
          </TouchableOpacity>
        </View>
      }
      centerComponent={
        <Text
          numberOfLines={1}
          style={{
            alignSelf: 'flex-start',
            // fontWeight: 'bold',
            color: Colors.textColorPrimary,
            paddingTop: RFPercentage(0.2),
            width:'100%',
            fontSize: FontSize.fontSizeText18,
            fontFamily: FontFamily.NotoSansDisplaySemiBold,
            flexWrap: 'wrap',
          }}>
          {title}
        </Text>
      }
      rightComponent={renderRight ? <>{renderRight()}</> : <></>}
    />
  );
};
