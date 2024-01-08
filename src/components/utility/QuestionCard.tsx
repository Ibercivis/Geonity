import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Files from '../../assets/icons/project/files.svg';
import Trash from '../../assets/icons/project/trash.svg';
import Paperclip from '../../assets/icons/project/paperclip.svg';
import Clipboard from '../../assets/icons/project/clipboard.svg';
import {RFPercentage, RFValue} from 'react-native-responsive-fontsize';
import {FontFamily, FontSize} from '../../theme/fonts';
import {Colors} from '../../theme/colors';
import {Switch} from 'react-native-paper';
import {useForm} from '../../hooks/useForm';
import {Question} from '../../interfaces/interfaces';
import { Size } from '../../theme/size';
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen';

interface Props {
  index: number;
  checkbox?: boolean;
  onDelete?: () => void;
  onPress?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onCheck?: () => void;
  question?: string;
  responseType?: string;
  selected?: boolean;
  onFocus?: () => void;
  form: Question;
  onChangeText?: (fieldName: string, value: any) => void;
}

export const QuestionCard = ({
  index,
  checkbox,
  onDelete,
  onPress,
  onEdit,
  onDuplicate,
  onCheck,
  responseType = 'NUM',
  selected = false,
  onFocus,
  form,
  onChangeText = (fieldName: string, value: string) => {},
}: Props) => {
  const questionText = form.question_text;
  const [localResponseType, setLocalResponseType] = useState(responseType);
  const [localResponseTypeText, setLocalResponseTypeText] = useState(responseType);

  useEffect(() => {
    setLocalResponseType(responseType);
  }, [responseType]);

  useEffect(() => {
    onSelectResponseTypeModal();
  }, [localResponseType]);

  const onSelectResponseTypeModal = () => {
    switch (localResponseType.toUpperCase()) {
      case 'STR': //STRING
      setLocalResponseTypeText('Tipo texto');
        break;
      case 'NUM': // NUM
      setLocalResponseTypeText('Tipo numérico');
        break;
      case 'IMG': // IMG
      setLocalResponseTypeText('Tipo imagen');
        break;
      default:
        setLocalResponseTypeText('Tipo de respuesta');
        break;
    }
  };

  return (
    <>
      <TouchableOpacity
        onBlur={onFocus}
        onPress={onPress}
        style={{...styles.card, borderColor: selected ? 'blue' : 'transparent'}}
        activeOpacity={0.9}>
        <View style={{...styles.row, marginBottom: RFPercentage(3)}}>
          <Text style={styles.index}>{index}.</Text>
          <TextInput
            onFocus={onFocus}
            style={{
              ...styles.input,
              borderColor: selected ? 'black' : '#c9c4c4',
            }}
            placeholder="Escribe tu pregunta"
            value={questionText}
            onChangeText={text => onChangeText('question_text', text)}
            textAlignVertical='center'
          />
        </View>
        <View style={{...styles.row, justifyContent: 'space-between'}}>
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                marginRight: RFPercentage(2),
                alignItems: 'center',
              }}
              onPress={onEdit}
              onFocus={onFocus}>
              <Clipboard
                height={RFPercentage(1.8)}
                width={RFPercentage(1.8)}
                fill={selected ? Colors.contentQuaternaryLight : 'black'}
              />
              <Text
                style={{
                  marginLeft: RFPercentage(1),
                  alignSelf: 'center',
                  color: selected ? Colors.contentQuaternaryLight : 'black',
                  fontSize: RFPercentage(1.2),
                }}>
                {localResponseTypeText}
              </Text>
            </TouchableOpacity>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            {/* <TouchableOpacity
              style={{
                marginHorizontal: RFPercentage(0.5),
              }}
              onPress={onDuplicate}>
              <Paperclip height={RFPercentage(1.8)} width={RFPercentage(1.8)} />
            </TouchableOpacity> */}
            <TouchableOpacity
              style={{
                marginHorizontal: RFPercentage(0.5),
              }}
              onPress={onDuplicate}>
              <Files height={RFPercentage(1.8)} width={RFPercentage(1.8)} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                marginHorizontal: RFPercentage(0.5),
              }}
              onPress={onDelete}>
              <Trash height={RFPercentage(1.8)} width={RFPercentage(1.8)} />
            </TouchableOpacity>
            <Text style={styles.separator}>|</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={{
                  alignSelf: 'center',
                  fontSize: RFPercentage(1.2),
                }}>Obligatorio</Text>
              <Switch style={{transform:[{scaleX: .7},{scaleY:.7}]}} value={checkbox} onValueChange={onCheck} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: '5%',
    marginVertical: RFValue(10, Size.globalHeight),
    alignSelf: 'center',
    // width: RFValue(350, Size.globalHeight),
    width: widthPercentageToDP('85%'),
    backgroundColor: 'white',
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 1,
      height: 1.1,
    },
    shadowOpacity: 6.2,
    shadowRadius: 2.41,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    textAlignVertical: 'center',
  },
  index: {
    marginRight: 10,
    fontWeight: 'bold',
    color: 'black',
    fontSize: FontSize.fontSizeText14,
  },
  input: {
    flex: 1,
    // borderBottomWidth: 1,
    // borderBottomColor: 'gray',
    height: heightPercentageToDP(4),
    paddingVertical: heightPercentageToDP(1),
    paddingLeft: RFPercentage(2),
    fontFamily: FontFamily.NotoSansDisplayLight,
    fontWeight: 'normal',
    fontSize: FontSize.fontSizeText13,
    color: 'black',
    alignSelf: 'center',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignContent: 'center',
    borderColor: 'white',
    borderRadius: 10,
    borderWidth: 1.2,
    marginTop: '2.5%',
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 4,

    // elevation: 1.25,
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  separator: {
    marginHorizontal: 5,
    fontWeight: 'bold',
    color: 'black',
    fontSize: FontSize.fontSizeTextSubTitle,
  },
});
