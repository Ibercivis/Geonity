import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
} from 'react-native';
import * as RNFS from 'react-native-fs';
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
import {PermissionsContext} from '../../context/PermissionsContext';
import Toast from 'react-native-toast-message';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {launchCamera} from 'react-native-image-picker';
import {baseURL, imageUrl} from '../../api/citmapApi';
import {useLanguage} from '../../hooks/useLanguage';
import {ImageZoom} from '@likashefqet/react-native-image-zoom';
import ImageViewer from 'react-native-image-zoom-viewer';
import {RNCamera} from 'react-native-camera';
import DatePicker from 'react-native-date-picker';

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
  const {fontLanguage} = useLanguage();
  const [images, setImages] = useState<any>();
  const [imageBlob, setImageBlob] = useState<any>();

  const [imageTypeNumber, setImageTypeNumber] = useState(0);
  const [imageType, setImageType] = useState(false);
  const showModalImageType = () => setImageType(true);
  const hideModalImageType = () => setImageType(false);

  const {getFormattedDateTime} = useDateTime();

  const [imageMax, setImageMax] = useState(false);
  const showModalImageMax = () => setImageMax(true);
  const hideModalImageMax = () => setImageMax(false);

  const [imageModal, setImageModal] = useState<any>();

  const {permissions} = useContext(PermissionsContext);

  const [isType3, setIsType3] = useState(false);

  const [date, setDate] = useState(new Date());

  const image = [
    {
      // Simplest usage.
      url: imageModal,
      // Optional, if you know the image size, you can set the optimization performance

      // You can pass props to <Image />.
      props: {
        // headers: ...
      },
    },
  ];

  const selectImage = (type: number) => {
    setImageBlob({});
    setImages(undefined);
    if (permissions.camera !== 'granted') {
      Toast.show({
        type: 'error',
        text1: fontLanguage.map[0].cards.permission_text1,
        text2: fontLanguage.map[0].cards.permission_text2,
      });
      return;
    }
    switch (type) {
      case 1: //openPicker
        setImageTypeNumber(1);
        setTimeout(() => {
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
                // console.log(JSON.stringify(newImage, null, 2));
                setImages(newImage);
                const texto: string = getFormattedDateTime();
                console.log(JSON.stringify(newImage.path, null, 2));
                console.log(JSON.stringify(newImage.mime, null, 2));
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
            console.log(`@CameraModal - handleGALLERY: ${err}`);
            setImageBlob({});
            setImages(null);
            showModal(true);
          });
        }, 200);
        break;
      case 2: //open camera
        setImageTypeNumber(2);
        
          setTimeout(() => {
            launchCamera(
          {
            mediaType: 'photo',
            includeBase64: true,
            maxWidth: 300,
            maxHeight: 300,
          },
          response => {
            if (response.didCancel) {
              console.log('User cancelled camera');
              hideModalImageType();
            } else if (response.errorCode) {
              console.log('Camera Error: ', response.errorMessage);
              hideModalImageType();
            } else {
              if (response && response.assets) {
                if (
                  response.assets[0].fileSize &&
                  response.assets[0].fileSize < 4 * 1024 * 1024
                ) {
                  const newImage = response.assets;
                  // console.log(JSON.stringify(newImage, null, 2));
                  console.log('data:image/jpeg;base64,' + newImage[0].base64);
                  setImages(newImage);
                  // console.log(JSON.stringify(newImage[0].uri, null, 2));
                  // console.log(JSON.stringify(newImage[0].type, null, 2));
                  const texto: string = getFormattedDateTime();
                  onChangeText({
                    uri: newImage[0].uri, // Debes ajustar esto según la estructura de response
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
          },
        );
          }, 200);
        
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
            //   console.log(JSON.stringify(response[0].sourceURL));
            if (response && response.data) {
              if (response.size < 4 * 1024 * 1024) {
                const newImage = response;
                setImages(newImage);
                const texto: string = getFormattedDateTime();
                console.log(JSON.stringify(newImage.path, null, 2));
                console.log(JSON.stringify(newImage.mime, null, 2));
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
            console.log(`@CameraModal - handleTakeAPhoto: ${err}`);
            setImageBlob({});
            setImages(null);
            showModal(true);
          });
        break;
      case 4: // camera nativa
        setIsType3(true);
        setImageTypeNumber(2);
        break;
    }

    hideModalImageType();
  };

  const setToZoom = (type: number) => {
    switch (type) {
      case 1:
        setImageModal('data:image/jpeg;base64,' + images.data);
        break;
      case 2:
        setImageModal('data:image/jpeg;base64,' + images[0].base64);
        break;
      case 3:
        setImageModal(value);
        break;
    }
    showModalImageMax();
  };

  const camera = useRef<any>();

  const takePicture = async () => {
    if (camera.current) {
      try {
        const options = {quality: 0.5, base64: true};
        const data = await camera.current.takePictureAsync(options);

        // Aquí data.uri contiene la URI de la imagen capturada
        const newImage = data.base64;
        setImages(newImage);
        console.log('data:image/jpeg;base64,' + newImage);
        // console.log(JSON.stringify(data, null, 2));
        // Guardar la URI de la imagen en el estado
        onChangeText({
          uri: data.uri,
          type: 'image/jpeg', // Tipo MIME de la imagen (puedes ajustarlo según necesites)
          name: 'cover.jpg', // Nombre de archivo de la imagen (puedes cambiarlo)
        });

        // Guardar la imagen en el sistema de archivos
        // const path = `${RNFS.DocumentDirectoryPath}/imagen_capturada.jpg`;
        // await RNFS.writeFile(path, data.base64, 'base64');
        // console.log('Imagen guardada en:', path);
      } catch (error) {
        console.error('Error al tomar la foto:', error);
      } finally {
        setIsType3(false);
      }
    }
  };

  //#region SECCIÓN RENDERS
  /**
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
                <View style={{marginHorizontal: '2%', marginRight: '5%'}}>
                  <Text
                    style={{
                      fontSize: FontSize.fontSizeText36,
                      color: Colors.contentTertiaryDark,
                    }}>
                    {num}.
                  </Text>
                </View>
                <View
                  style={{
                    width: '75%',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      flexWrap: 'wrap',
                      fontFamily: FontFamily.NotoSansDisplayMedium,
                      fontSize: FontSize.fontSizeText14,
                    }}>
                    {item.question_text}
                  </Text>
                </View>
                {obligatory && (
                  <View
                    style={{
                      justifyContent: 'center',
                      // position: 'relative',
                      // left: RFPercentage(35),
                      // bottom: RFPercentage(2),
                      // backgroundColor:'blue'
                    }}>
                    <Text
                      style={{fontSize: FontSize.fontSizeText18, color: 'red'}}>
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
              <View style={{marginTop: '0%'}}>
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
                          borderBottomColor: '#949494',
                          color: Colors.textColorPrimary,
                          fontFamily: value
                            ? FontFamily.NotoSansDisplayLight
                            : FontFamily.NotoSansDisplayRegular,
                        },
                      ]}
                      textColor='#000000'
                      multiline={true}
                      contentStyle={{bottom: heightPercentageToDP(-0.4)}}
                      placeholder={
                        value || fontLanguage.map[0].cards.text_answer
                      }
                      placeholderTextColor={value ? '#000000' : '#949494'}
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
                <View style={{marginHorizontal: '2%', marginRight: '5%'}}>
                  <Text
                    style={{
                      fontSize: FontSize.fontSizeText36,
                      color: Colors.contentTertiaryDark,
                    }}>
                    {num}.
                  </Text>
                </View>
                <View
                  style={{
                    width: '75%',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      flexWrap: 'wrap',
                      fontFamily: FontFamily.NotoSansDisplayMedium,
                      fontSize: FontSize.fontSizeText14,
                    }}>
                    {item.question_text}
                  </Text>
                </View>
                {obligatory && (
                  <View
                    style={{
                      justifyContent: 'center',
                      // position: 'relative',
                      // left: RFPercentage(35),
                      // bottom: RFPercentage(2),
                      // backgroundColor:'blue'
                    }}>
                    <Text
                      style={{fontSize: FontSize.fontSizeText18, color: 'red'}}>
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
                          borderBottomColor: '#949494',
                          color: Colors.textColorPrimary,
                          fontFamily: value
                            ? FontFamily.NotoSansDisplayLight
                            : FontFamily.NotoSansDisplayRegular,
                        },
                      ]}
                      textColor='#000000'
                      multiline={true}
                      contentStyle={{bottom: heightPercentageToDP(-0.4)}}
                      keyboardType="decimal-pad"
                      placeholder={
                        value || fontLanguage.map[0].cards.number_answer
                      }
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
            <View
              style={{
                flexDirection: 'column',
                height: heightPercentageToDP(22),
              }}>
              <View style={{flexDirection: 'row'}}>
                <View style={{marginHorizontal: '2%', marginRight: '5%'}}>
                  <Text
                    style={{
                      fontSize: FontSize.fontSizeText36,
                      color: Colors.contentTertiaryDark,
                    }}>
                    {num}.
                  </Text>
                </View>
                <View
                  style={{
                    width: '75%',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      flexWrap: 'wrap',
                      fontFamily: FontFamily.NotoSansDisplayMedium,
                      fontSize: FontSize.fontSizeText14,
                    }}>
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
                    <Text
                      style={{fontSize: FontSize.fontSizeText17, color: 'red'}}>
                      *
                    </Text>
                  </View>
                )}
              </View>

              <View style={{alignItems: 'center', marginTop: '2%'}}>
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
                        height: heightPercentageToDP(13),
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
                        onPress={() => showModalImageType()}
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
                  {/* si entra aquí es que está editando y hay foto ya */}
                  {!images && !onlyRead && value && (
                    <View
                      style={{
                        width: '80%',
                        height: heightPercentageToDP(13),
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
                      <TouchableOpacity
                        style={{width: '100%', height: '100%'}}
                        onPress={() => setToZoom(3)}>
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
                  {/* este entra en galería */}
                  {imageTypeNumber === 1 && images && !onlyRead && (
                    <View
                      style={{
                        width: '80%',
                        height: heightPercentageToDP(13),
                        // marginTop: '3.5%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: images
                          ? 'transparent'
                          : Colors.secondaryBackground,
                        borderRadius: 10,
                        padding: '2%',
                      }}>
                      <TouchableOpacity
                        style={{flex: 1, width: '100%', height: '100%'}}
                        onPress={() => setToZoom(1)}>
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
                  {/* este entra en camera si está editando o creando */}
                  {imageTypeNumber === 2 &&
                    images &&
                    // images[0] &&
                    // images[0].base64 &&
                    !onlyRead && (
                      <View
                        style={{
                          width: '80%',
                          height: heightPercentageToDP(13),
                          // marginTop: '3.5%',
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: images
                            ? 'transparent'
                            : Colors.secondaryBackground,
                          borderRadius: 10,
                          padding: '2%',
                        }}>
                        <TouchableOpacity
                          style={{flex: 1, width: '100%', height: '100%'}}
                          onPress={() => setToZoom(2)}>
                          <Image
                            source={{
                              // uri: 'data:image/jpeg;base64,' + images[0].base64,
                              uri: 'data:image/jpeg;base64,' + images,
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: 10,
                              resizeMode: 'cover',
                            }}
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
                  {/* si entra aquí es que está mirando solo, ya que es solo lectura 3*/}
                  {value && onlyRead && (
                    <TouchableOpacity
                      style={{
                        width: '95%',
                        height: heightPercentageToDP(13),
                        marginTop: '6%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 10,
                        padding: '2%',
                        backgroundColor: value ? 'white' : 'grey',
                      }}
                      onPress={() => setToZoom(3)}>
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
                    </TouchableOpacity>
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
                        backgroundColor: 'white',
                      }}>
                      <ImageBackground
                        borderRadius={10}
                        // source={require(urii)}
                        resizeMode="contain"
                        source={
                          value !== ''
                            ? {uri: value}
                            : require('../../assets/backgrounds/noimage.jpg')
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
      case 'DATE':
        let formattedDate = new Date(); 
        let day, month, year;
        if (value != undefined) {
          [day, month, year] = value.split('/').map(Number); // Divide la cadena y convierte cada parte en número
          formattedDate = new Date(year, month - 1, day);
        }
        return (
          <>
            <View style={{flexDirection: 'column'}}>
              <View style={{flexDirection: 'row'}}>
                <View style={{marginHorizontal: '2%', marginRight: '5%'}}>
                  <Text
                    style={{
                      fontSize: FontSize.fontSizeText36,
                      color: Colors.contentTertiaryDark,
                    }}>
                    {num}.
                  </Text>
                </View>
                <View
                  style={{
                    width: '75%',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      flexWrap: 'wrap',
                      fontFamily: FontFamily.NotoSansDisplayMedium,
                      fontSize: FontSize.fontSizeText14,
                    }}>
                    {item.question_text}
                  </Text>
                </View>
                {obligatory && (
                  <View
                    style={{
                      justifyContent: 'center',
                    }}>
                    <Text
                      style={{fontSize: FontSize.fontSizeText18, color: 'red'}}>
                      *
                    </Text>
                  </View>
                )}
              </View>
              <View style={{marginTop: '0%'}}>
                <View
                  style={{
                    width: '100%',
                    marginVertical: RFPercentage(1),
                  }}>
                  <View style={styles.container}>
                    {/* <TextInput
                      disabled={onlyRead}
                      style={[
                        styles.input,
                        {
                          borderBottomColor: '#949494',
                          color: Colors.textColorPrimary,
                          fontFamily: value
                            ? FontFamily.NotoSansDisplayLight
                            : FontFamily.NotoSansDisplayRegular,
                        },
                      ]}
                      multiline={true}
                      contentStyle={{bottom: heightPercentageToDP(-0.4)}}
                      placeholder={
                        value || fontLanguage.map[0].cards.text_answer
                      }
                      placeholderTextColor={value ? '#000000' : '#949494'}
                      onChangeText={value => onChangeText(value)}
                      underlineColorAndroid="transparent"
                    /> */}
                    <DatePicker
                      date={value ? formattedDate : date}
                      onDateChange={val => {
                        onChangeText(val);
                      }}
                      style={{}}
                      mode="date"
                    />
                  </View>
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
          <Modal visible={isType3} transparent={true} animationType="fade">
            <View style={stylesCamera.container}>
              <RNCamera
                ref={ref => {
                  camera.current = ref;
                }}
                style={stylesCamera.preview}
                type={RNCamera.Constants.Type.back}
                flashMode={RNCamera.Constants.FlashMode.auto}
                androidCameraPermissionOptions={{
                  title: 'Permission to use camera',
                  message: 'We need your permission to use your camera',
                  buttonPositive: 'Ok',
                  buttonNegative: 'Cancel',
                }}
              />
              <View
                style={{
                  flex: 0,
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}>
                <TouchableOpacity
                  onPress={() => {
                    takePicture();
                  }}
                  style={stylesCamera.capture}>
                  <Text style={{fontSize: 14}}> Capture </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </Portal>
      </Provider>

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
                        {fontLanguage.map[0].cards.galery}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      style={{...stylesModal.button}}
                      onPress={() => selectImage(3)}>
                      <Text style={stylesModal.textButton}>
                        {fontLanguage.map[0].cards.camera}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
        </Portal>
      </Provider>
      {/* este modal hará un zoom cuando pinches en una imagen */}
      <Provider>
        <Portal>
          <Modal visible={imageMax} transparent={true} animationType="fade">
            {/* <TouchableWithoutFeedback style={{}} onPress={hideModalImageMax}> */}
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                height: '50%',
                alignSelf: 'center',
                alignContent: 'center',
                backgroundColor: 'black',
                // borderRadius: 10,
                // padding: '2%',
              }}>
              {/* <Image
                    source={{
                      uri: value,
                    }}
                    style={{
                      width: '100%',
                      height: '70%',
                      // borderRadius: 10,
                      resizeMode: 'contain',
                    }}
                  /> */}
              <TouchableOpacity
                style={{alignSelf: 'flex-end', margin: '7%'}}
                onPress={hideModalImageMax}>
                <Text
                  style={{color: 'white', fontSize: FontSize.fontSizeText17}}>
                  {fontLanguage.map[0].cards.close}
                </Text>
              </TouchableOpacity>
              <ImageViewer
                style={{
                  width: '100%',
                  // height: '70%',
                  // borderRadius: 10,
                  // resizeMode: 'contain',
                  // backgroundColor: 'red',
                  zIndex: 1,
                }}
                show={true}
                useNativeDriver={true}
                minScale={0.3}
                maxScale={10}
                imageUrls={image}
              />
              {/* <ImageZoom
                style={{
                  width: '100%',
                  // height: '70%',
                  // borderRadius: 10,
                  // resizeMode: 'contain',
                  // backgroundColor: 'red',
                  zIndex: 999,
                }}
                uri={value}
                minScale={0.3}
                maxScale={1.5}
                onInteractionStart={() => console.log('Interaction started')}
                onInteractionEnd={() => console.log('Interaction ended')}
                onPinchStart={() => console.log('Pinch gesture started')}
                onPinchEnd={() => console.log('Pinch gesture ended')}
                onPanStart={() => console.log('Pan gesture started')}
                onPanEnd={() => console.log('Pan gesture ended')}
                onResetAnimationEnd={() => console.log('Reset animation ended')}
                resizeMode="contain"
              /> */}
            </View>
            {/* </TouchableWithoutFeedback> */}
          </Modal>
        </Portal>
      </Provider>
      <Toast position="bottom" />
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
    width: widthPercentageToDP(74),
    fontSize: FontSize.fontSizeText13,
    height: heightPercentageToDP(5),
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

const stylesCamera = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20,
  },
});
