import React, {useState} from 'react';
import {
  Dimensions,
  KeyboardTypeOptions,
  Pressable,
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import {Colors} from '../../theme/colors';
import {FontFamily, FontSize, fonts} from '../../theme/fonts';
import {useTogglePasswordVisibility} from '../../hooks/useTogglePasswordVisibility';
import {IconBootstrap} from './IconBootstrap';
import {TextInput} from 'react-native-paper';
import {globalStyles} from '../../theme/theme';
import { RFPercentage } from 'react-native-responsive-fontsize';

const window = Dimensions.get('window');

/**
 * @label nombre visible
 * @icon [opcional] string nombre icon
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
  iconLeft?: string;
  iconRight?: string;
  inputType?: boolean;
  keyboardType?: KeyboardTypeOptions;
  fieldButtonLabel?: string;
  fieldButtonFunction?: () => void;
  onPressIn?: () => void;
  onChangeText: (value: any) => void;
  multiline: boolean;
  numOfLines?: number;
  iconColor?: string;
  value?: string;
  marginBottom?: string | number;
  maxLength?: number;
  isSecureText?: boolean;
  ref?: any;
  isValid?: boolean;
  style?: StyleProp<TextStyle>;
  editable?: boolean;
}
export const InputText = ({
  label,
  iconLeft,
  iconRight,
  inputType,
  keyboardType,
  fieldButtonFunction,
  onChangeText,
  multiline,
  numOfLines,
  iconColor = '#666',
  value,
  maxLength = 100,
  isSecureText = false,
  ref,
  isValid = true,
  onPressIn,
  style,
  editable= true,
}: Props) => {
  // variable que establece por defecto el color del input cuando no es presionado y que al ser presionado, cambiará
  const [onBlurInput, setOnBlurInput] = useState('#c9c4c4');
  const [onBlurTextInput, setOnBlurTextInput] = useState('#c9c4c4');
  const [iconColorFocus, setIconColorFocus] = useState('#c9c4c4');
  const {passwordVisibility, rightIcon, handlePasswordVisibility} =
    useTogglePasswordVisibility();
  const {fontScale} = useWindowDimensions();
  /**
   * Establece el color del borde del input y del placeholder a negro cuando el focus está en el
   */
  const customFocus = () => {
    setOnBlurInput('black');
    // setOnBlurTextInput('#000000');
    setIconColorFocus('#000000');
  };
  /**
   * Establece el color del borde del input y del placeholder a gris cuando se sale del focus
   */
  const customBlurColor = () => {
    setOnBlurInput('#c9c4c4');
    setOnBlurTextInput('#c9c4c4');
    setIconColorFocus('#c9c4c4');
  };

  return (
    // <View style={styles.container}>
    <View
      style={{
        ...globalStyles.inputContainer,
        borderColor: isValid ? onBlurInput : Colors.semanticWarningDark,
        // width: '100%',
      }}>
      {iconLeft && (
        <View
          style={{
            // flex: 1,
            marginLeft: '5%',
            // alignItems: 'center',
            justifyContent: 'center',
            top: 1,
          }}>
          <IconBootstrap name={iconLeft} size={RFPercentage(2)} color={iconColorFocus} />
        </View>
      )}
      <TextInput
        // theme={{
        //   fonts: {FontFamily: FontFamily.NotoSansDisplayLight},
        // }}
        style={[
          style,
          {
            width: '100%',
            fontSize: FontSize.fontSizeText13,
            fontFamily: FontFamily.NotoSansDisplayLight,
            fontWeight: '300',
            alignSelf: 'center',
            backgroundColor: 'transparent',
            height: multiline ? 0 : window.height * 0.04,
          },
        ]}
        contentStyle={{color:'black'}}
        ref={ref}
        placeholderTextColor={onBlurTextInput}
        mode="flat"
        underlineColor="transparent"
        activeUnderlineColor="transparent"
        textAlignVertical="center"
        autoCapitalize="none"
        outlineStyle={{borderWidth: 0}}
        secureTextEntry={isSecureText ? passwordVisibility : false}
        placeholder={label}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numOfLines}
        selectionColor={Colors.textColorPrimary}
        editable={editable}
        value={value}
        maxLength={maxLength}
        onChangeText={(value: any) => onChangeText(value)}
        onBlur={customBlurColor}
        onFocus={customFocus}
        onPressIn={onPressIn}
      />
      {inputType && !iconRight && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={handlePasswordVisibility}
          style={{
            // ...styles.touchable,
            // maxHeight: 35,
            // marginRight: '1%',
            flex: 1,
            alignItems: 'flex-end',
            justifyContent: 'center',
            top: '1%',
            // backgroundColor: 'red',
          }}>
          {/* <MaterialCommunityIcons
              name={rightIcon}
              size={15}
              color="#232323"
            /> */}
          <IconBootstrap name={rightIcon} size={20} color={iconColorFocus} />
        </TouchableOpacity>
      )}
      {iconRight && !inputType && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={fieldButtonFunction}
          style={{
            marginRight: '2%',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            top: '1%',
          }}>
          <IconBootstrap name={iconRight} size={RFPercentage(2)} color={'black'} />
        </TouchableOpacity>
      )}
    </View>
    // </View>
  );
};
