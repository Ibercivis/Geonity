import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Colors} from '../../theme/colors';
import {IconBootstrap} from './IconBootstrap';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Plus from '../../assets/icons/general/plus-square.svg';
import Home from '../../assets/icons/general/home.svg';
import Profile from '../../assets/icons/general/person.svg';
import { FontSize } from '../../theme/fonts';

interface Props {
  label: string;
  route: string;
  focused: boolean;
  onPress: () => void;
  icon: string;
  isCenter?: boolean;
}

const CustomTab = ({
  label,
  route,
  icon,
  focused = false,
  onPress,
  isCenter = false,
}: Props) => {
  const navigation = useNavigation();

  const tabStyle = {
    // Estilos personalizados
    backgroundColor: focused ? Colors.primaryLigth : 'transparent',
    borderRadius: 20,
    padding: RFPercentage(1.5),
    height: RFPercentage(5),
    marginTop: RFPercentage(4),
    marginBottom: RFPercentage(0.4),
    width: RFPercentage(15),
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 0.1,
    // },
    // shadowOpacity: 0.2,
    // shadowRadius: 1.41,
    // elevation: 2,
  };

  const textStyle = {
    // Estilos de texto personalizados
    color: focused ? '#FFFFFF' : '#000000',
    fontSize: FontSize.fontSizeText14,
    marginHorizontal: RFPercentage(1),
    bottom:RFPercentage(0.45),
    // alignItems: 'center',
    // fontWeight: 'bold',
  };

  const onPressTouchable = () => {
    onPress();
    navigation.navigate(route as never);
  };

  return (
    <SafeAreaView style={{flex: 1 , alignItems: 'center', justifyContent: 'center' }}>
      <TouchableOpacity style={tabStyle} onPress={onPressTouchable}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignContent: 'center',
            alignItems: 'center',
            alignSelf: 'center',
          }}>
          {!isCenter ? (
            <>
              <View
                style={{
                  marginHorizontal: '5%',
                  justifyContent: 'center',
                  // top: RFPercentage(0.18),
                  alignSelf: 'center',
                  alignContent: 'center',
                  alignItems: 'center',
                  left: RFPercentage(0.1),
                  bottom: RFPercentage(0.2)
                }}>
                  {/* TODO cambiar iconos  */}

                {
                  icon.toLocaleLowerCase() === 'home' ? (
                    <Home width={RFPercentage(3)} height={RFPercentage(3)} fill={focused ? '#FFFFFF' : '#000000'} />
                  ) : (
                    <Profile width={RFPercentage(3)} height={RFPercentage(3)} fill={focused ? '#FFFFFF' : '#000000'} />
                  )
                }

                {/* <IconBootstrap
                  name={icon}
                  size={RFPercentage(2.2)}
                  color={focused ? '#FFFFFF' : '#000000'}
                /> */}
              </View>
              {focused ? <Text style={textStyle}>{label}</Text> : <></>}
            </>
          ) : (
            <View style={{alignSelf: 'center', justifyContent: 'center'}}>
              <Plus
                width={RFPercentage(2)}
                height={RFPercentage(2)}
                fill={'black'}
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default CustomTab;
