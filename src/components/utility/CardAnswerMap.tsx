import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  TouchableWithoutFeedback,
  Modal,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Question} from '../../interfaces/interfaces';
import {InputText} from './InputText';
import {IconButton, Portal, Provider, TextInput} from 'react-native-paper';
import {FontSize, FontFamily} from '../../theme/fonts';
import ImagePicker from 'react-native-image-crop-picker';
import PlusImg from '../../assets/icons/general/Plus-img.svg';
import Person from '../../assets/icons/general/person.svg';
import FrontPage from '../../assets/icons/project/image.svg';
import {Size} from '../../theme/size';
import {Colors} from '../../theme/colors';
import {useDateTime} from '../../hooks/useDateTime';
import { PermissionsContext } from '../../context/PermissionsContext';
import Toast from 'react-native-toast-message';
import { launchCamera } from 'react-native-image-picker';

interface Props {
  //   onChangeText?: (fieldName: string, value: any) => void;
  onChangeText: (value: any) => void;
  question: Question;
  index: number;
  showModal: (value: boolean) => void;
  value?: any;
  obligatory?: boolean;
  onlyRead?: boolean;
  isEditing?: boolean;
}

export const CardAnswerMap = ({
  question,
  index,
  onChangeText,
  showModal,
  value,
  obligatory = false,
  onlyRead = false,
  isEditing = false,
}: Props) => {
  // useEffect(() => {
  //     card(question, index)
  //   }, []);

  const [images, setImages] = useState<any>();
  const [imageBlob, setImageBlob] = useState<any>();

  const [imageType, setImageType] = useState(false);
  const showModalImageType = () => setImageType(true);
  const hideModalImageType = () => setImageType(false);

  const {getFormattedDateTime} = useDateTime();

  const {permissions} =
    useContext(PermissionsContext);

  const selectImage = (type: number) => {
    setImageBlob({});
    setImages({});
    if (permissions.camera !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Sin permisos',
        text2: 'No se concedieron los permisos para acceder a la camara',
      });
      return;
    }
    
    switch (type) {
      case 1: //openPicker
        ImagePicker.openPicker({
          mediaType: 'photo',
          multiple: false,
          quality: 1,
          maxWidth: 300,
          maxHeight: 300,
          includeBase64: true,
        })
          .then(response => {
              
            if (response && response.data) {
              if (response.size < 4 * 1024 * 1024) {
                const newImage = response;
                setImages(newImage);
                const texto: string = getFormattedDateTime();
                onChangeText({
                  uri: newImage.path, // Debes ajustar esto según la estructura de response
                  type: newImage.mime, // Tipo MIME de la imagen
                  name: texto + 'cover.jpg', // Nombre de archivo de la imagen (puedes cambiarlo)
                });
              } else {
                showModal(true);
                setImages(undefined);
              }
            }
            hideModalImageType();
          })
          .catch(err => {
            hideModalImageType();
            console.log(`@CameraModal - handleGALLERY: ${err}`)
            setImageBlob({});
            setImages(null);
            showModal(true);
          });
          // hideModalImageType();
        break;
      case 2:
        const options = {
          mediaType: 'photo',
          includeBase64: false,
          maxHeight: 2000,
          maxWidth: 2000,
        };
      
        launchCamera({
          mediaType: 'photo',
          includeBase64: true,
          maxHeight: 2000,
          maxWidth: 2000,
        }, response => {
          if (response.didCancel) {
            console.log('User cancelled camera');
            hideModalImageType();
          } else if (response.errorCode) {
            console.log('Camera Error: ', response.errorMessage);
            hideModalImageType();
          } else {
            if(response && response.assets){
              if (response.assets[0].fileSize && response.assets[0].fileSize < 4 * 1024 * 1024 ) {
              const newImage = response.assets;
              console.log(JSON.stringify(newImage, null, 2))
              setImages(newImage);
              const texto: string = getFormattedDateTime();
              onChangeText({
                uri: newImage[0].originalPath, // Debes ajustar esto según la estructura de response
                type: newImage[0].type, // Tipo MIME de la imagen
                name: texto + 'cover.jpg', // Nombre de archivo de la imagen (puedes cambiarlo)
              });
            } else {
              showModal(true);
              setImages(undefined);
            }
            hideModalImageType();
            }
            
          }
        });
        break;
      case 3: //openCamera
        ImagePicker.openCamera({
          mediaType: 'photo',
          multiple: false,
          quality: 1,
          maxWidth: 300,
          maxHeight: 300,
          includeBase64: true,
        })
          .then(response => {
              
            if (response && response.data) {
              if (response.size < 4 * 1024 * 1024) {
                const newImage = response;
                setImages(newImage);
                const texto: string = getFormattedDateTime();
                onChangeText({
                  uri: newImage.path, // Debes ajustar esto según la estructura de response
                  type: newImage.mime, // Tipo MIME de la imagen
                  name: texto + 'cover.jpg', // Nombre de archivo de la imagen (puedes cambiarlo)
                });
              } else {
                showModal(true);
                setImages(undefined);
              }
              hideModalImageType();
            }
          })
          .catch(err => {
            hideModalImageType();
            console.log(`@CameraModal - handleTakeAPhoto: ${err}`)
            setImageBlob({});
            setImages(null);
            showModal(true);
          });
          // hideModalImageType();
        break;
    }

    
  };

  //#region SECCIÓN RENDERS
  /**
   * TODO ESTO HAY QUE SACARLO A UN COMPONENTE DIFERENTE
   * Metodo que devuelve el tipo de card
   * en el componente, cada respuesta será de un tipo u otro, así solo se permite en el input
   * poner ese tipo de dato
   * la imagen será un cuadradito selector
   * @param item el tipo de dato, que es de tipo Question; dentro el type puede ser IMG = 3, STR = 2, NUM = 1
   */
  const card = (item: Question, num: number) => {
    switch (item.answer_type) {
      case 'STR':
        return (
          <>
            <View style={{flexDirection: 'column'}}>
              <View style={{flexDirection: 'row'}}>
                <View style={{marginHorizontal: '2%'}}>
                  <Text>{num}</Text>
                </View>
                <View
                  style={{
                    width: '80%',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text style={{flexWrap: 'wrap',}}>
                    {item.question_text}
                  </Text>
                </View>
                {obligatory && (
                  <View
                    style={{
                      justifyContent: 'flex-start',
                      // position: 'relative',
                      // left: RFPercentage(35),
                      // bottom: RFPercentage(2),
                      // backgroundColor:'blue'
                    }}>
                    <Text style={{fontSize: FontSize.fontSizeText10, color:'red'}}>
                      *
                    </Text>
                  </View>
                )}
              </View>
              {/* {obligatory && (
                <View
                  style={{
                    justifyContent: 'flex-end',
                    position: 'relative',
                    left: RFPercentage(35),
                    bottom: RFPercentage(2),
                  }}>
                  <Text
                    style={{
                      fontSize: FontSize.fontSizeText10,
                      color: Colors.textColorPrimary,
                    }}>
                    Obligatoria
                  </Text>
                </View>
              )} */}
              <View style={{marginTop: '1%'}}>
                <View
                  style={{
                    width: '100%',
                    marginVertical: RFPercentage(1),
                  }}>
                  {/* <InputText
                    // isInputText={() => setIsInputText(!isInputText)}
                    label={item.question_text}
                    keyboardType="default"
                    multiline={false}
                    numOfLines={1}
                    onChangeText={(value) => onChangeText(value)}
                    // value={user.username}
                  /> */}
                  <View style={styles.container}>
                    <TextInput
                      disabled={onlyRead}
                      style={[
                        styles.input,
                        {
                          borderBottomColor: '#bab9b9',
                          color: Colors.textColorPrimary,
                        },
                      ]}
                      placeholder={value || item.question_text}
                      placeholderTextColor={value ? '#000000' : '#bab9b9'}
                      onChangeText={value => onChangeText(value)}
                      underlineColorAndroid="transparent"
                      // value={value}
                    />
                  </View>
                </View>
              </View>
            </View>
          </>
        );
      case 'NUM':
        return (
          <>
            <View style={{flexDirection: 'column'}}>
              <View style={{flexDirection: 'row'}}>
                <View style={{marginHorizontal: '2%'}}>
                  <Text>{num}</Text>
                </View>
                <View
                  style={{
                    width: '80%',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text style={{flexWrap: 'wrap',}}>
                    {item.question_text}
                  </Text>
                </View>
                {obligatory && (
                  <View
                    style={{
                      justifyContent: 'flex-start',
                      // position: 'relative',
                      // left: RFPercentage(35),
                      // bottom: RFPercentage(2),
                      // backgroundColor:'blue'
                    }}>
                    <Text style={{fontSize: FontSize.fontSizeText10, color:'red'}}>
                      *
                    </Text>
                  </View>
                )}
              </View>
              {/* {obligatory && (
                <View
                  style={{
                    justifyContent: 'flex-end',
                    position: 'relative',
                    left: RFPercentage(35),
                    bottom: RFPercentage(2),
                  }}>
                  <Text
                    style={{
                      fontSize: FontSize.fontSizeText10,
                      color: Colors.textColorPrimary,
                    }}>
                    Obligatoria
                  </Text>
                </View>
              )} */}
              <View style={{marginTop: '1%'}}>
                <View
                  style={{
                    width: '100%',
                    marginVertical: RFPercentage(1),
                  }}>
                  <View style={styles.container}>
                    <TextInput
                      disabled={onlyRead}
                      style={[
                        styles.input,
                        {
                          borderBottomColor: '#bab9b9',
                          color: Colors.textColorPrimary,
                        },
                      ]}
                      keyboardType="number-pad"
                      placeholder={value || item.question_text}
                      placeholderTextColor={value ? '#000000' : '#bab9b9'}
                      onChangeText={value => onChangeText(value)}
                      underlineColorAndroid="transparent"
                      // value={value}
                    />
                  </View>
                </View>
              </View>
            </View>
          </>
        );
      case 'IMG':
        return (
          <>
            <View style={{flexDirection: 'column', height: RFPercentage(20)}}>
              <View style={{flexDirection: 'row'}}>
                <View style={{marginHorizontal: '2%'}}>
                  <Text>{num}</Text>
                </View>
                <View
                  style={{
                    width: '80%',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text style={{flexWrap: 'wrap',}}>
                    {item.question_text}
                  </Text>
                </View>
                {obligatory && (
                  <View
                    style={{
                      justifyContent: 'flex-start',
                      // position: 'relative',
                      // left: RFPercentage(35),
                      // bottom: RFPercentage(2),
                      // backgroundColor:'blue'
                    }}>
                    <Text style={{fontSize: FontSize.fontSizeText10, color:'red'}}>
                      *
                    </Text>
                  </View>
                )}
              </View>

              <View style={{alignItems: 'center', marginTop: '1%'}}>
                <View
                  style={{
                    // marginVertical: RFPercentage(1),
                    alignItems: 'center',
                    marginTop: '1%',
                    width: '60%',
                    height: '80%',
                  }}>
                  {!images && !onlyRead && !value && (
                    <View
                      style={{
                        width: '80%',
                        height: '100%',
                        // marginTop: '4%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: Colors.secondaryBackground,
                        borderRadius: 10,
                        padding: '2%',
                        //   paddingBottom: '2%'
                      }}>
                      <TouchableOpacity onPress={() => showModalImageType()}>
                        <FrontPage
                          fill={'#000'}
                          width={RFPercentage(7)}
                          height={RFPercentage(7)}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                      onPress={showModalImageType}
                        style={{
                          width: RFPercentage(4),
                          position: 'absolute',
                          bottom: RFPercentage(-1),
                          left: RFPercentage(17),
                          zIndex: 999,
                          backgroundColor: 'white',
                          borderRadius: 50,
                        }}>
                        <PlusImg
                          width={RFPercentage(4)}
                          height={RFPercentage(4)}
                          fill={'#0059ff'}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                  {!images && !onlyRead && value && (
                    <View
                      style={{
                        width: '80%',
                        height: '100%',
                        // marginTop: '3.5%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor:
                          images || value
                            ? 'transparent'
                            : Colors.secondaryBackground,
                        borderRadius: 10,
                        padding: '2%',
                      }}>
                      <Image
                        source={{
                          uri: value,
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 10,
                          resizeMode: 'cover',
                        }}
                      />

                      <TouchableOpacity
                        onPress={() => {
                          showModalImageType();
                        }}
                        style={{
                          width: RFPercentage(4),
                          position: 'absolute',
                          bottom: RFPercentage(-1),
                          left: RFPercentage(17),
                          zIndex: 999,
                          backgroundColor: 'white',
                          borderRadius: 50,
                        }}>
                        <PlusImg
                          width={RFPercentage(4)}
                          height={RFPercentage(4)}
                          fill={'#0059ff'}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                  {images && !onlyRead && (
                    <View
                      style={{
                        width: '80%',
                        height: '100%',
                        // marginTop: '3.5%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: images
                          ? ''
                          : Colors.secondaryBackground,
                        borderRadius: 10,
                        padding: '2%',
                      }}>
                      <Image
                        source={{
                          uri: 'data:image/jpeg;base64,' + images.data,
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 10,
                          resizeMode: 'cover',
                        }}
                      />

                      <TouchableOpacity
                        onPress={showModalImageType}
                        style={{
                          width: RFPercentage(4),
                          position: 'absolute',
                          bottom: RFPercentage(-1),
                          left: RFPercentage(17),
                          zIndex: 999,
                          backgroundColor: 'white',
                          borderRadius: 50,
                        }}>
                        <PlusImg
                          width={RFPercentage(4)}
                          height={RFPercentage(4)}
                          fill={'#0059ff'}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                  {value && onlyRead && (
                    <View
                      style={{
                        width: '95%',
                        height: '110%',
                        marginTop: '6%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 10,
                        padding: '2%',
                        backgroundColor: value ? 'transparent' : 'grey',
                      }}>
                      <ImageBackground
                        borderRadius={10}
                        // source={require(urii)}
                        source={
                          value !== ''
                            ? {uri: value}
                            : require('../../assets/backgrounds/nuevoproyecto.jpg')
                        }
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 10,
                          // resizeMode: 'cover',
                        }}
                      />
                    </View>
                  )}
                  {!value && onlyRead && (
                    <View
                      style={{
                        width: '95%',
                        // height: '110%',
                        marginTop: '6%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 10,
                        padding: '2%',
                        backgroundColor: value ? 'transparent' : 'white',
                      }}>
                      <ImageBackground
                        borderRadius={10}
                        resizeMode='contain'
                        // source={require(urii)}
                        source={
                          require('../../assets/backgrounds/noimage.jpg')
                        }
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 10,
                          // resizeMode: 'cover',
                        }}
                      />
                    </View>
                  )}
                </View>
              </View>
            </View>
          </>
        );
      default:
        return <></>;
    }
  };
  //#endregion

  return (
    <View style={styles.card}>
      {card(question, index)}
      <Provider>
        <Portal>
          <Modal visible={imageType} transparent>
            <TouchableWithoutFeedback onPress={hideModalImageType}>
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <View
                  style={{
                    ...stylesModal.container,
                  }}>
                  <View
                    style={{
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      marginTop: '5%',
                      width: '100%',
                    }}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={{...stylesModal.button}}
                      onPress={() => selectImage(1)}>
                      <Text
                        style={{
                          ...stylesModal.textButton,
                        }}>
                        Galería
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={{...stylesModal.button}}
                      onPress={() => selectImage(2)}>
                      <Text style={stylesModal.textButton}>Camara</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </Portal>
      </Provider>
      <Toast position='bottom' />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: RFPercentage(2),
    marginVertical: RFPercentage(1),
    alignSelf: 'center',
    width: RFPercentage(45),
    backgroundColor: 'white',
    //   borderWidth: 1,
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 1,
      height: 1.1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.41,
    elevation: 1,
  },
  container: {
    marginBottom: 8, // Ajusta el margen inferior según tus preferencias
    width: '100%', // Opcional: establece el ancho completo
  },
  input: {
    width: '90%',
    fontSize: FontSize.fontSizeText13,
    fontFamily: FontFamily.NotoSansDisplayLight,
    fontWeight: '300',
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
});

const stylesModal = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '70%',
    alignItems: 'center',
    height: '20%',
    justifyContent: 'center',
    paddingHorizontal: '11%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4.41,
    elevation: 4,
  },
  openButton: {
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '70%',
  },
  acceptButton: {
    marginTop: '18%',
    borderRadius: 10,
    width: '50%',
    alignSelf: 'center',
  },
  buttonLabel: {
    fontWeight: 'bold',
  },
  button: {
    minWidth: RFPercentage(8),
    marginBottom: RFPercentage(2),
    backgroundColor: 'white',
    padding: RFPercentage(1),
    borderRadius: 10,
    paddingVertical: '5%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0.1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  textButton: {
    textAlign: 'center',
    textAlignVertical: 'center',
    alignSelf: 'center',
  },
});
