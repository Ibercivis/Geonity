
import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardTypeOptions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../theme/colors';
import {FontSize} from '../../theme/fonts';
import {Size} from '../../theme/size';
import { RFPercentage } from 'react-native-responsive-fontsize';

/**
 * @label nombre visible
 * @icon string nombre icon
 * @inputType [opcional] tipo de campo ['','password']
 * @keyboardType [opcional] opciones de tipo de teclado
 * @fieldButtonLabel [opcional] string nombre botón dentro del input
 * @fieldButtonFunction [opcional] funcion botón opcional
 * @onChangeText funcion del input; requiere valor any
 * @multiline boolean para saber si tiene o no varias lineas
 * @numOfLines numero de lineas [minima 1]
 */
interface Props {
  label: string;
  icon: string;
  inputType?: string;
  keyboardType?: KeyboardTypeOptions;
  fieldButtonLabel?: string;
  fieldButtonFunction?: () => void;
  onChangeText: (value: any) => void;
  multiline: boolean;
  numOfLines: number;
  iconColor?: string;
  value?: string;
  marginBottom?: number;
  maxLength?: number;
}

export const InputField = ({
  label,
  icon,
  inputType,
  keyboardType,
  fieldButtonLabel,
  fieldButtonFunction,
  onChangeText,
  multiline,
  numOfLines,
  iconColor = '#666',
  value,
  marginBottom = RFPercentage(3),
  maxLength = 100
}: Props) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
        paddingBottom: '2%',
        marginBottom: marginBottom,
      }}>
      <Icon name={icon} size={Size.iconSizeMedium} color={iconColor} />
      {inputType == 'password' ? (
        <TextInput
          placeholder={label}
          multiline={multiline}
          numberOfLines={numOfLines}
          keyboardType={keyboardType}
          selectionColor={Colors.primary}
          style={{
            flex: 1,
            paddingVertical: 0,
            // fontFamily: 'roboto',
            fontSize: FontSize.fontSizeText,
            marginLeft: '2%',
          }}
          secureTextEntry={true}
          onChangeText={value => onChangeText(value)}
          // cursorColor={'red'}
          value={value}
          maxLength={maxLength}
        />
      ) : (
        <TextInput
          placeholder={label}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numOfLines}
          selectionColor={Colors.primary}
          // placeholderTextColor={'#5C95FF'}
          style={{
            flex: 1,
            paddingVertical: 0,
            // fontFamily: 'roboto',
            fontSize: FontSize.fontSizeText,
            textAlignVertical: 'top',
            top: '1%',
            marginLeft: '2%'
          }}
          onChangeText={value => onChangeText(value)}
          value={value}
          maxLength={maxLength}
        />
      )}
      <TouchableOpacity onPress={fieldButtonFunction}>
        <Text
          style={{
            color: '#AD40AF',
            fontWeight: '700',
            // fontFamily: 'roboto',
            fontSize: FontSize.fontSizeText,
          }}>
          {fieldButtonLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
