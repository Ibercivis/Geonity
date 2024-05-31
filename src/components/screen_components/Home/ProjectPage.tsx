import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Image,
  ImageBackground,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  Share,
  Linking,
} from 'react-native';
import {Text} from 'react-native-paper';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Size} from '../../../theme/size';
import {StackScreenProps} from '@react-navigation/stack';
import {StackParams} from '../../../navigation/HomeNavigator';
import Carousel, {Pagination} from 'react-native-snap-carousel';
import {ScrollView} from 'react-native';
import {FontSize} from '../../../theme/fonts';
import HeartFill from '../../../assets/icons/general/heart-fill.svg';
import Heart from '../../../assets/icons/general/heart.svg';
import ShareIcon from '../../../assets/icons/general/share.svg';
import People from '../../../assets/icons/general/people.svg';
import Chevron from '../../../assets/icons/general/chevron-left-1_circle_new.svg';
import PencilSquare from '../../../assets/icons/general/pencil-square.svg';
import Download from '../../../assets/icons/general/cloud-download.svg';
import {CustomButton} from '../../utility/CustomButton';
import {Colors} from '../../../theme/colors';
import {
  Organization,
  ShowProject,
  User,
  UserInfo,
} from '../../../interfaces/interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import citmapApi, {imageUrl} from '../../../api/citmapApi';
import {HasTag, Topic} from '../../../interfaces/appInterfaces';
import {LoadingScreen} from '../../../screens/LoadingScreen';
import {PassModal, SaveProyectModal} from '../../utility/Modals';
import {
  CommonActions,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import {Spinner} from '../../utility/Spinner';
import {PermissionsContext} from '../../../context/PermissionsContext';
import {
  PERMISSIONS,
  PermissionStatus,
  request,
  check,
  openSettings,
} from 'react-native-permissions';
import Toast from 'react-native-toast-message';
import RNFS from 'react-native-fs';
import {heightPercentageToDP} from 'react-native-responsive-screen';
import {useLanguage} from '../../../hooks/useLanguage';
import ShareComponent from 'react-native-share';

const data = [
  require('../../../assets/backgrounds/login-background.jpg'),
  require('../../../assets/backgrounds/login-background.jpg'),
  // Agrega más imágenes y títulos según necesites
];

interface Props extends StackScreenProps<StackParams, 'ProjectPage'> {}


export const ProjectPage = (props: Props) => {
  const {fontLanguage} = useLanguage();
  //#region estados y referencias
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isAllCharged, setIsAllCharged] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [wantParticipate, setWantParticipate] = useState(false);
  const [waitingData, setWaitingData] = useState(false);
  const [like, setLike] = useState(false);
  const [numlike, setNumlike] = useState(0);

  const [project, setProject] = useState<ShowProject>();
  const [creator, setCreator] = useState('');
  const [hastags, setHastags] = useState<Topic[]>([]);
  const [imagesCharged, setImagesCharged] = useState<any[]>([]);
  const [isValidPass, setIsValidPass] = useState(true);

  //#region MODAL NEW
  /**
   * Elementos del modal
   */
  const [saveModal, setSaveModal] = useState(false);
  const showModalSave = () => setSaveModal(true);
  const hideModalSave = () => setSaveModal(false);
  const [passModal, setPassModal] = useState(false);
  const showModalPass = () => setPassModal(true);
  const hideModalPass = () => setPassModal(false);
  //#endregion

  const {permissions, checkLocationPErmission, askLocationPermission} =
    useContext(PermissionsContext);

  useEffect(() => {
    if (permissions.locationStatus === 'granted' && wantParticipate) {
      setHasPermission(true);
      navigateToMap();
    }
  }, [permissions]);

  //#endregion

  //#region USEEFECT

  useEffect(() => {
    getProjectApi();
  }, []);

  useEffect(() => {
    // si existe el proyecto
    if (project) {
      // si no hay hastags en project
      if (project.hasTag.length <= 0) {
        setIsAllCharged(true);
      } else {
        // si hay hastags en project
        // si el numero de hastags que hemos guardado coincide con el numero de hastags del project
        if (hastags.length === project.hasTag.length) {
          setIsAllCharged(true);
        }
      }
    }
    setWaitingData(false);
  }, [hastags]);

  useEffect(() => {
    if (project) {
      getHastagApi();
    }
  }, [project]);

  useFocusEffect(
    React.useCallback(() => {
      // Aquí puedes cargar de nuevo los datos, por ejemplo, realizando una llamada a la API
      // Puedes usar la variable "route.params.id" para obtener el ID necesario
      getProjectApi();
      setWantParticipate(false);
      // Código para cargar los datos de la organización
    }, [props.route.params.id]),
  );

  //#endregion

  //#region METODOS

  /**
   * Metodo para compartir, en message pones lo que quieres compartir
   */
  const onShare = async () => {
    try {
      const result = await Share.share({
        message:
          'https://play.google.com/store/apps/details?id=com.reactnativeplantilla',
        title: 'Compartir el proyecto con:',
        url: 'https://play.google.com/store/apps/details?id=com.reactnativeplantilla',
      });
      console.log(result);
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
          console.log(result.activityType);
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error: any) {}

    // try {
    //   const deepLink = 'tu_ruta_de_enlace_profundo'; // Reemplaza con tu enlace profundo
    //   const result = await Share.share({
    //     message: deepLink,
    //     title: 'Compartir el proyecto con:',
    //   });
  
    //   console.log(result);
  
    //   if (result.action === Share.sharedAction) {
    //     if (result.activityType) {
    //       // Compartido con el tipo de actividad result.activityType
    //       console.log(result.activityType);
    //     } else {
    //       // Compartido
    //     }
    //   } else if (result.action === Share.dismissedAction) {
    //     // Descartado
    //   }
    // } catch (error: any) {
    //   console.error('Error al compartir:', error);
    // }
  };

  // Función para abrir el enlace profundo en la aplicación o en la tienda de aplicaciones
const openDeepLink = async (deepLink: string) => {
  try {
    const supported = await Linking.canOpenURL(deepLink);
    if (supported) {
      await Linking.openURL(deepLink);
    } else {
      // Si el enlace profundo no es compatible, abre la tienda de aplicaciones
      const storeLink = 'https://play.google.com/store/apps/details?id=com.reactnativeplantilla';
      await Linking.openURL(storeLink);
    }
  } catch (error) {
    console.error('Error al abrir el enlace profundo:', error);
  }
};



  /**
   * Metodo para volver atrás
   */
  const onBack = () => {
    if (props.route.params.isNew) {
      props.navigation.navigate('HomeScreen' as never);
    } else {
      props.navigation.goBack();
    }
  };

  /**
   * metodo para ir al mapa
   */
  const navigateToMap = () => {
    if (project) {
      if (project.is_private) {
        showModalPass();
      } else {
        setWantParticipate(true);
        if (permissions.locationStatus === 'granted') {
          // checkLocationPErmission();
          // props.navigation.navigate("PermissionsScreen")
          props.navigation.navigate('ParticipateMap', {id: project.id!});
        } else {
          setHasPermission(false);
          return (
            <View style={stylesPermission.container}>
              <Text>{fontLanguage.project[0].location_permission}</Text>
              <TouchableOpacity
                style={stylesPermission.touchable}
                onPress={checkLocationPermission}
                activeOpacity={0.6}>
                <Text style={stylesPermission.touchableText}>
                  {fontLanguage.project[0].give_permissions}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }
      }
    }
  };

  /**
   * consulta los permisos
   */
  const checkLocationPermission = async () => {
    askLocationPermission();
  };

  /**
   * metodo para ir a la edición del proyecto
   */
  const editProyect = () => {
    if (project) {
      props.navigation.dispatch(
        CommonActions.navigate({
          name: 'CreateProject',
          params: {id: project.id},
        }),
      );
    }
  };

  /**
   * Comprueba si necesita contraseña o no. Después, si tiene permisos de location, si no los tiene, muestra una pantalla para que se proporcionen
   * @param value1 contiene la contraseña para participar en el proyecto, si no es privado, ni se evalua, puede ser undefined
   * @returns 
   */
  const navigateToMapPass = async (value1?: string) => {
    if (project?.is_private) {
      if (value1) {
        try {
          const token = await AsyncStorage.getItem('token');
          const isValid = await citmapApi.post(
            `/projects/${project.id}/validate-password/`,
            {password: value1},
            {
              headers: {
                Authorization: token,
              },
            },
          );
          if (isValid.data) {
            setIsValidPass(true);
            hideModalPass();
            if (permissions.locationStatus === 'granted') {
              props.navigation.dispatch(
                CommonActions.navigate({
                  name: 'ParticipateMap',
                  params: {id: project.id!},
                }),
              );
              // props.navigation.replace('ParticipateMap', {id: 6});
            } else {
              setHasPermission(false);
              return (
                <View style={stylesPermission.container}>
                  <Text>{fontLanguage.project[0].location_permission}</Text>
                  <TouchableOpacity
                    style={stylesPermission.touchable}
                    onPress={checkLocationPermission}
                    activeOpacity={0.6}>
                    <Text style={stylesPermission.touchableText}>
                      {fontLanguage.project[0].give_permissions}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }
          }
        } catch (err) {
          console.log('password erronea');
          setIsValidPass(false);
        }
      }
    }
  };

  /**
   * Descarga los datos recabados del proyecto. Previamente pide el permiso de almacenamiento si no se tuviera
   * @returns sale si hay un error con los permisos
   */
  const downloadProjectObservations = async () => {
    try {
      let token;

      while (!token) {
        token = await AsyncStorage.getItem('token');
      }
      const download = await citmapApi.get(
        `/project/${project?.id}/download_observations/`,
        {
          headers: {
            Authorization: token,
          },
          responseType: 'blob',
        },
      );

      const hasPermission = await requestStoragePermission();
      console.log(hasPermission);
      if (hasPermission !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'You need to grant storage permissions to use this feature.',
          [
            {
              text: 'OK',
              onPress: () => openSettings(),
            },
          ],
          {cancelable: false},
        );
        Toast.show({
          type: 'error',
          text1: fontLanguage.project[0].toast_no_permission_text1,
          text2: fontLanguage.project[0].toast_no_permission_text2,
        });
        return;
      }

      // console.log(JSON.stringify(download.data, null, 2));
      if (hasPermission === 'granted') {
        await saveFile(download.data, `observations${Date.now()}.csv`);
      }
    } catch (error) {
      console.log(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: fontLanguage.project[0].toast_err_download_text1,
      });
    }
  };

  /**
   * Guarda los datos descargados
   * @param fileBlob archivo
   * @param filename nombre del archivo
   */
  const saveFile = async (fileBlob: any, filename: any) => {
    let path: any;
    if (Platform.OS === 'ios') {
      let token;

      while (!token) {
        token = await AsyncStorage.getItem('token');
      }
      // console.log(JSON.stringify(fileBlob, null,2))
      try {
        const downloadUrl =
          'https://geonity.ibercivis.es/api' +
          `/project/${project?.id}/download_observations/`; // Agrega el token a la URL
        const filePath =
          RNFS.DocumentDirectoryPath + `/observations${Date.now()}.csv`;

        const options = {
          headers: {
            Authorization: `${token}`, // Agrega el token de autorización al encabezado
          },
        };
        console.log(JSON.stringify(filePath));
        const response = await RNFS.downloadFile({
          fromUrl: downloadUrl,
          toFile: filePath,
          headers: options.headers, // Pasa los encabezados a la solicitud de descarga
          // connectionTimeout: 1000
        });

        console.log(JSON.stringify(response, null, 2));
        if (response) {
          console.log('Archivo descargado correctamente en:', filePath);
          await shareFile(filePath); // Llamada a la función shareFile después de descargar el archivo
        } else {
          console.error('Error al descargar el archivo');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    } else {
      path = `${RNFS.DownloadDirectoryPath}/${filename}`;
      const file = new Blob([fileBlob], {
        type: 'text/csv',
        lastModified: Date.now(),
      });
      const reader = new FileReader();

      reader.onload = () => {
        RNFS.writeFile(path, reader.result as string, 'utf8')
          .then(() => {
            console.log(`Archivo guardado en: ${path}`);
            Toast.show({
              type: 'info',
              text1: fontLanguage.project[0].toast_download_completed_text1,
              text2: `${fontLanguage.project[0].toast_download_completed_text2} ${path}`,
            });
          })
          .catch(error => {
            console.error('Error al guardar el archivo:', error);
          });
      };
      reader.onerror = error =>
        console.error('Error al leer el archivo:', error);
      reader.readAsText(file);
    }
  };

  const shareFile = async (filePath: any) => {
    try {
      const options = {
        title: 'Compartir archivo',
        url: `file://${filePath}`, // URL del archivo
        type: 'text/csv', // Tipo MIME del archivo
      };

      await ShareComponent.open(options);
    } catch (error) {
      console.error('Error al compartir el archivo:', error);
    }
  };

  /**
   * Intenta obtener los permisos, sino, muestra una alerta
   * @returns devuelve el estado de los permisos
   */
  const requestStoragePermission = async () => {
    // let granted: PermissionStatus;
    // if (Platform.OS === 'android') {
    //   try {
    //     console.log('pide el permiso');
    //     const temp = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
    //     if (temp === 'granted') {
    //       granted = await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE, {
    //         title: fontLanguage.project[0].title_permission,
    //         message: fontLanguage.project[0].menssage,
    //         buttonNeutral: fontLanguage.project[0].neutral_button,
    //         buttonNegative: fontLanguage.global[0].cancel_button,
    //         buttonPositive: fontLanguage.global[0].acept_button,
    //       });
    //       return granted;
    //     }
    //   } catch (err) {
    //     console.warn(err);
    //     return (granted = 'denied');
    //   }
    // }
    // return (granted = 'unavailable');
    let permissionStatus: PermissionStatus;

    if (Platform.OS === 'ios') {
      permissionStatus = await request(PERMISSIONS.IOS.MEDIA_LIBRARY);
    } else {
      permissionStatus = await request(
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      );
    }

    if (permissionStatus === 'blocked') {
      Alert.alert(
        'Permission Blocked',
        'Please enable storage permissions in your device settings to proceed.',
        [
          {
            text: 'Go to Settings',
            onPress: () => openSettings(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        {cancelable: false},
      );
    }

    return permissionStatus;
  };

  /**
   * Obtiene el proyecto a través del id dado por los parametros de la ruta
   */
  const getProjectApi = async () => {
    setWaitingData(true);
    let token;

    while (!token) {
      token = await AsyncStorage.getItem('token');
    }
    console.log(token);
    try {
      const userInfo = await citmapApi.get<User>(
        '/users/authentication/user/',
        {
          headers: {
            Authorization: token,
          },
        },
      );

      const resp = await citmapApi.get<ShowProject>(
        `/project/${props.route.params.id}/`,
        {
          headers: {
            Authorization: token,
          },
        },
      );

      const creatoruser = await citmapApi.get<UserInfo>(
        `/users/${resp.data.creator}/`,
        {
          headers: {
            Authorization: token,
          },
        },
      );

      setCreator(creatoruser.data.username);
      // recorrer resp.administrator.map y comparar si coincide el id con el user
      let isAdmin = resp.data.administrators.find(x => x === userInfo.data.pk);
      if (
        (userInfo.data != undefined &&
          userInfo.data.pk === resp.data.creator) ||
        isAdmin !== undefined
      ) {
        setCanEdit(true);
      } else {
        // Toast.show({
        //   type: 'error',
        //   text1: 'Error',
        //   // text2: 'No se han podido obtener los datos, por favor reinicie la app',
        //   text2: 'Datos no cargados',
        // });
      }
      setProject(resp.data);
      if (resp.data.is_liked_by_user) setLike(resp.data.is_liked_by_user);
      if (resp.data.total_likes) setNumlike(resp.data.total_likes);
      console.log(JSON.stringify(resp.data, null, 2));
      if (resp.data.cover) {
        setImagesCharged(resp.data.cover);
      }
      if (resp.data.hasTag.length <= 0) {
        setIsAllCharged(true);
      }
      if (props.route.params.isNew) {
        showModalSave();
      }
    } catch (err: any) {
      console.log(err.response.data);
    }
  };

  /**
   * Obtiene las categorías y se filtran para que se pinten en el render segun el proyecto dado
   */
  const getHastagApi = async () => {
    let token;

    while (!token) {
      token = await AsyncStorage.getItem('token');
    }
    try {
      const resp = await citmapApi.get<Topic[]>('/project/topics/', {
        headers: {
          Authorization: token,
        },
      });

      const filteredHashtags = resp.data.filter(hasTag =>
        project?.topic.includes(hasTag.id),
      );
      setHastags(filteredHashtags);
    } catch {}
  };

  /**
   *  TODO cambiar estado del heart del fav mas rapidamente
   * @param idProject
   */
  const toggleLike = async () => {
    let token;
    while (!token) {
      token = await AsyncStorage.getItem('token');
    }
    try {
      const resp = await citmapApi.post(
        `/projects/${project?.id}/toggle-like/`,
        {},
        {
          headers: {
            Authorization: token,
          },
        },
      );
      // getProjectApi()
      // const updatedProject = project;
      // if (updatedProject) {
      //   console.log(JSON.stringify(updatedProject, null, 2));
      //   updatedProject.is_liked_by_user = !updatedProject.is_liked_by_user;
      //   setProject(updatedProject);
      // }
      if (like) {
        setNumlike(numlike - 1);
      } else {
        setNumlike(numlike + 1);
      }
      setLike(!like);
      Toast.show({
        type: 'success',
        text1: 'Like',
        // text2: 'No se han podido obtener los datos, por favor reinicie la app',
        text2: resp.data.message,
      });
    } catch (err) {}
  };

  //#endregion

  if (!isAllCharged) {
    return <LoadingScreen />;
  }

  return (
    <>
      <SafeAreaView>
        <ScrollView
          contentContainerStyle={{backgroundColor: 'white'}}
          onTouchCancel={() => hideModalSave()}
          keyboardShouldPersistTaps="handled">
          {/* Ocultar la barra de estado */}
          {/* <StatusBar hidden /> */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{project?.name}</Text>
          </View>

          <View style={{flex: 1}}>
            {/* first part */}
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignContent: 'center',
                alignItems: 'center',
              }}>
              <Carousel
                data={imagesCharged.length > 0 ? imagesCharged : data}
                renderItem={x => {
                  return (
                    <View
                      style={{
                        ...styles.slide,
                        backgroundColor: 'transparent',
                      }}>
                      {imagesCharged.length > 0 ? (
                        <>
                          <Image
                            source={{
                              uri: imageUrl + imagesCharged[x.index].image,
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                            }}
                            resizeMode="cover"
                          />
                        </>
                      ) : (
                        <>
                          <Image
                            source={require('../../../assets/backgrounds/nuevoproyecto.jpg')}
                            // source={x.index}
                            style={styles.image}
                            resizeMode="cover"
                          />
                        </>
                      )}
                    </View>
                  );
                }}
                itemWidth={Size.window.width + 2}
                sliderWidth={Size.window.height}
                layout="default"
                onSnapToItem={index => setCarouselIndex(index)}
                useScrollView={true}
                automaticallyAdjustContentInsets
                automaticallyAdjustKeyboardInsets
              />
              {/* <View
              style={{
                bottom: RFPercentage(0),
                right: RFPercentage(5),
                left: RFPercentage(5),
                position: 'absolute',
              }}>
              <Pagination
                dotsLength={
                  imagesCharged.length > 0 ? imagesCharged.length : data.length
                }
                activeDotIndex={carouselIndex}
                ref={isCarousel}
                dotStyle={{
                  width: RFPercentage(3.5),
                  height: RFPercentage(0.5),
                  backgroundColor: 'rgba(0, 0, 0, 0.92)',
                  marginHorizontal: RFPercentage(0.1),
                }}
                inactiveDotStyle={{
                  width: RFPercentage(5),
                  height: RFPercentage(0.5),
                }}
                dotContainerStyle={{
                  marginHorizontal: RFPercentage(0.05),
                }}
                // animatedDuration={100}
                inactiveDotOpacity={0.4}
                inactiveDotScale={0.6}
              />
            </View> */}
            </View>
            {/* half part */}
            <View
              style={{
                marginVertical: RFPercentage(2),
                marginHorizontal: RFPercentage(2.5),
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <View
                style={{
                  // marginTop: '15%',
                  flexDirection: 'row',
                  alignContent: 'center',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flex: 1,
                }}>
                {/* personas */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                  }}>
                  {/* <IconBootstrap name={'plus'} size={20} color={'black'} /> */}
                  <People
                    width={RFPercentage(2.5)}
                    height={RFPercentage(2.5)}
                    color={'#000000'}
                  />
                  <Text
                    style={{
                      fontSize: FontSize.fontSizeText13,
                      marginHorizontal: RFPercentage(1),
                      alignSelf: 'center',
                      color: Colors.textColorPrimary,
                    }}>
                    {project?.contributions}
                  </Text>
                </TouchableOpacity>

                {/*favorito */}
                <TouchableOpacity
                  onPress={toggleLike}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                  }}>
                  {/* <HeartFill
                      width={RFPercentage(2.5)}
                      height={RFPercentage(2.5)}
                      color={'#ff0000'}
                    /> */}
                  {like ? (
                    <HeartFill
                      width={RFPercentage(2.5)}
                      height={RFPercentage(2.5)}
                      color={'#ff0000'}
                    />
                  ) : (
                    <Heart
                      width={RFPercentage(2.5)}
                      height={RFPercentage(2.5)}
                      color={'#000000'}
                    />
                  )}
                  <Text
                    style={{
                      fontSize: FontSize.fontSizeText13,
                      marginHorizontal: RFPercentage(1),
                      alignSelf: 'center',
                      color: Colors.textColorPrimary,
                    }}>
                    {numlike}
                  </Text>
                </TouchableOpacity>

                {/* boton de compartir */}
                <TouchableOpacity
                  style={{
                    marginLeft: RFPercentage(1),
                    marginRight: RFPercentage(7),
                    alignItems: 'center',
                    alignContent: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => onShare()}>
                  <ShareIcon
                    width={RFPercentage(2.5)}
                    height={RFPercentage(2.5)}
                    color={'#ff0000'}
                  />
                </TouchableOpacity>
              </View>
              {/* participar */}
              <View
                style={{
                  width: RFPercentage(12),
                  marginHorizontal: RFPercentage(1),
                  bottom: 2,
                }}>
                <CustomButton
                  onPress={() => {
                    navigateToMap();
                  }}
                  label={fontLanguage.project[0].show_map}
                  backgroundColor={Colors.primaryLigth}
                />
              </View>
            </View>
            {/* end part */}
            <View style={{marginHorizontal: RFPercentage(2)}}>
              <View>
                <View
                  style={{
                    // marginHorizontal: 14,
                    marginTop: 13,
                    marginBottom: 6,
                  }}>
                  <View style={{flexDirection: 'row'}}>
                    <Text
                      style={{
                        // backgroundColor: 'white',
                        marginBottom: '1%',
                        alignSelf: 'flex-start',
                        color: Colors.textColorPrimary,
                      }}>
                      {fontLanguage.project[0].created_by}{' '}
                    </Text>
                    <Text
                      style={{
                        // backgroundColor: 'white',
                        marginBottom: '1%',
                        alignSelf: 'flex-start',
                        color: Colors.textColorPrimary,
                        fontWeight: 'bold',
                      }}>
                      {creator}
                    </Text>
                  </View>
                  {/* <Text
                      style={{
                        // backgroundColor: 'white',
                        marginBottom: '1%',
                        alignSelf: 'flex-start',
                        fontWeight: 'bold',
                        color: Colors.textColorPrimary
                      }}>
                      {project?.name}
                    </Text> */}
                  <View style={{flexDirection: 'row'}}>
                    <Text
                      style={{
                        // backgroundColor: 'white',
                        marginBottom: '1%',
                        alignSelf: 'flex-start',
                        color: Colors.textColorPrimary,
                      }}>
                      {fontLanguage.project[0].organization}{' '}
                    </Text>
                    {project?.organizations &&
                    project?.organizations.length > 0 ? (
                      <>
                        {project.organizations.map((x, i) => {
                          return (
                            <Text
                              key={i}
                              style={{
                                // backgroundColor: 'white',
                                marginBottom: '1%',
                                alignSelf: 'flex-start',
                                fontWeight: 'bold',
                                color: Colors.textColorPrimary,
                              }}>
                              {x.principalName}
                              {project.organizations.length >= 1 ? '. ' : ', '}
                            </Text>
                          );
                        })}
                      </>
                    ) : (
                      <Text
                        style={{
                          // backgroundColor: 'white',
                          marginBottom: '1%',
                          // alignSelf: 'flex-start',
                          fontWeight: 'bold',
                          color: Colors.textColorPrimary,
                        }}>
                        {fontLanguage.project[0].no_organization}
                      </Text>
                    )}
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                      marginTop: '4%',
                    }}>
                    {hastags.map((x, i) => {
                      return (
                        <Text
                          key={i}
                          style={{
                            // backgroundColor: 'white',
                            alignSelf: 'flex-start',
                            color: Colors.primaryDark,
                            // marginBottom: '4%',
                            lineHeight: 17,
                          }}>
                          #{x.topic}
                          {'   '}
                        </Text>
                      );
                    })}
                  </View>
                  <Text
                    style={{
                      // backgroundColor: 'white',
                      alignSelf: 'flex-start',
                      marginBottom: '4%',
                      color: 'black',
                      marginTop: '7%',
                    }}>
                    {project?.description}
                  </Text>
                </View>
              </View>
            </View>

            {/* boton back */}
            <TouchableOpacity style={styles.buttonBack} onPress={onBack}>
              <Chevron
                width={RFPercentage(5)}
                height={RFPercentage(5)}
                fill={'#000000'}
              />
            </TouchableOpacity>
            {/* boton edit */}
            {canEdit && (
              <TouchableOpacity
                style={styles.buttonEdit}
                onPress={() => editProyect()}>
                <PencilSquare
                  width={RFPercentage(5)}
                  height={RFPercentage(5)}
                  fill={'#000000'}
                />
              </TouchableOpacity>
            )}
            {/* boton download */}
            <TouchableOpacity
              style={canEdit ? styles.buttonDownload : styles.buttonEdit}
              onPress={downloadProjectObservations}>
              <Download
                width={RFPercentage(5)}
                height={RFPercentage(5)}
                fill={'#000000'}
              />
            </TouchableOpacity>
          </View>
          <SaveProyectModal
            visible={saveModal}
            hideModal={hideModalSave}
            onPress={hideModalSave}
            size={RFPercentage(6)}
            color={Colors.semanticSuccessLight}
            label={fontLanguage.project[0].modal_save_label}
            subLabel={fontLanguage.project[0].modal_save_sublabel}
          />
          <PassModal
            visible={passModal}
            hideModal={hideModalPass}
            onPress={hideModalPass}
            size={RFPercentage(6)}
            helper={isValidPass}
            color={Colors.semanticSuccessLight}
            label={fontLanguage.project[0].modal_pass_label}
            setPass={value => navigateToMapPass(value)}
          />
          <Spinner visible={waitingData} />
        </ScrollView>
      </SafeAreaView>
      {/* )} */}
      <Toast position="top" />
    </>
  );
};

const styles = StyleSheet.create({
  slide: {
    width: '100%',
    height: RFPercentage(55),
    alignItems: 'center',
    justifyContent: 'center',

    zIndex: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'stretch',
    position: 'absolute',
    // top: heightPercentageToDP(50),
    top: heightPercentageToDP(40),
    marginLeft: RFPercentage(2),
    // left: RFPercentage(2),
    // right: RFPercentage(5),
    // backgroundColor: 'black',
    // padding: RFPercentage(1),
    // borderRadius: 10,
    zIndex: 1,
    color: 'black',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  title: {
    color: 'white',
    fontSize: RFPercentage(3.5),
    fontWeight: 'bold',
    textAlign: 'left',
    marginHorizontal: '2%',
    marginLeft: '3%',
    // textShadowColor: 'black', // Color del contorno
    // textShadowOffset: {width: 2, height: 2}, // Ajusta según sea necesario
    // textShadowRadius: 2,
  },
  buttonBack: {
    position: 'absolute',
    top: RFPercentage(6),
    left: RFPercentage(2),
    zIndex: 999,
    // backgroundColor: 'white',
    borderRadius: 100,
    padding: RFPercentage(1.2),
  },
  buttonEdit: {
    position: 'absolute',
    top: RFPercentage(6),
    right: RFPercentage(2),
    zIndex: 999,
    // backgroundColor: 'white',
    borderRadius: 100,
    padding: RFPercentage(1.2),
  },
  buttonDownload: {
    position: 'absolute',
    top: RFPercentage(6),
    right: RFPercentage(8),
    zIndex: 999,
    // backgroundColor: 'white',
    borderRadius: 100,
    padding: RFPercentage(1.2),
  },
});

const stylesPermission = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    borderWidth: 1,
    borderRadius: 25,
    borderColor: 'grey',
    margin: 5,
    padding: 10,
    backgroundColor: 'white',
  },
  touchableText: {
    fontWeight: 'bold',
    fontSize: 20,
    color: 'black',
  },
});
