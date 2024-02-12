import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import {Size} from '../../../theme/size';
import {Colors} from '../../../theme/colors';
import LinearGradient from 'react-native-linear-gradient';
import translate from '../../../theme/es.json';
import {HasTag, Projects, Topic} from '../../../interfaces/appInterfaces';
import SplashScreen from 'react-native-splash-screen';
import {Card} from '../../utility/Card';
import {InputText} from '../../utility/InputText';
import {FontFamily, FontSize, fonts} from '../../../theme/fonts';
import {IconBootstrap} from '../../utility/IconBootstrap';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Checkbox} from 'react-native-paper';
import citmapApi from '../../../api/citmapApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Organization,
  Project,
  ShowProject,
} from '../../../interfaces/interfaces';
import {useForm} from '../../../hooks/useForm';
import {LoadingScreen} from '../../../screens/LoadingScreen';

import PeopleFill from '../../../assets/icons/general/people-fill.svg';
import HeartFill from '../../../assets/icons/general/heart-fill.svg';
import Stars from '../../../assets/icons/general/stars.svg';
import Dots from '../../../assets/icons/general/three-dots-vertical.svg';
import Magic from '../../../assets/icons/general/magic.svg';
import Boockmark from '../../../assets/icons/general/bookmark-star-fill.svg';
import {Spinner} from '../../utility/Spinner';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {AuthContext} from '../../../context/AuthContext';
import {useFocusEffect} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import NotCreated from '../../../assets/icons/profile/No hay creados.svg';
import Geonity from '../../../assets/icons/general/Geonity-Tittle.svg';
import {CustomButton} from '../../utility/CustomButton';
import {InfoModal, InfoModalGuest} from '../../utility/Modals';
import { useLanguage } from '../../../hooks/useLanguage';

interface Props extends StackScreenProps<any, any> {}

export const Home = ({navigation}: Props) => {
  //#region Variables/const
  const {isGuest} = useContext(AuthContext);
  let notchHeight = 0;
  const {fontLanguage} = useLanguage();
  const insets = useSafeAreaInsets();

  const NUM_SLICE_NEW_PROJECT_LIST = 10;
  const RETRY_DELAY_MS = 1000;
  const [loading, setLoading] = useState(false);
  const [categoryList, setCategoryList] = useState<Topic[]>([]); //clonar para que la que se muestre solo tenga X registros siendo la ultima el +
  const [categoriesSelected, setCategoriesSelected] = useState<Topic[]>([]);
  const [newProjectList, setNewProjectList] = useState<ShowProject[]>([]); // partir la lista en 2
  const [newProjectListSliced, setNewProjectListSliced] = useState<
    ShowProject[]
  >([]); // partir la lista en 2

  const [importantProjectList, setImportantProjectList] = useState<
    ShowProject[]
  >([]);
  const [interestingProjectList, setInterestingProjectList] = useState<
    number[]
  >([1, 2, 3, 4, 5, 6, 7, 8]);
  const [organizationList, setOrganizationList] = useState<Organization[]>([]);

  const [showCategoryList, setShowCategoryList] = useState(false);

  const [onSearch, setOnSearch] = useState(false);
  // const onSearchCategory = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAllCharged, setIsAllCharged] = useState(false);
  const [errMessage, setErrMessage] = useState('');
  const [categorySelectedId, setCategorySelectedId] = useState<number[]>([]);

  const {onChange, form} = useForm({
    searchText: '',
  });

  const {signIn, signOut, signUp, errorMessage, removeError, recoveryPass} =
    useContext(AuthContext);

  const [menuVisible, setMenuVisible] = useState(false);
const [guestModal, setGuestModal] = useState(false);

  const mostrarMenu = () => {
    setMenuVisible(true);
  };

  const ocultarMenu = () => {
    setMenuVisible(false);
  };

  const showGuestModal = () => {
    setGuestModal(true);
  };

  const hideGuestModal = () => {
    setGuestModal(false);
  };

  //#endregion

  //#region UseEffects

  /**
   * cierra la pantalla de inicio
   */
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      categoryListApi();
      setRefreshing(false);
      onSearchText('');
      setCategoriesSelected([]);
    }, [loading]),
  );

  //TODO llamada a la api para coger cada elemento
  useEffect(() => {
    setLoading(true);
    categoryListApi();
    // projectListApi();
    // organizationListApi();
    setCategoriesSelected([]);
    //aquí estaba el setIsAllCharged(true);
  }, []);

  useEffect(() => {
    categoryListApi();
    projectListApi();
    setRefreshing(false);
    onSearchText('');
    organizationListApi();
    setCategoriesSelected([]);
  }, [refreshing]);

  //se usa para que cuando una categoría esté seleccionada, se filtren proyectos si coinciden con la categoría
  useEffect(() => {
    categorySelectedFilter();
    // console.log("Añadiendo el nuevo" + JSON.stringify(categorySelectedId))
    if (categorySelectedId.length <= 0) {
      setOnSearch(false);
    }
  }, [categorySelectedId]);

  useEffect(() => {
    if (errorMessage.length === 0) return;
  }, [errorMessage]);

  //#endregion

  //#region Methods

  /**
   * Cuando está la categoria desplegada, si pulsas fuera se pliega de nuevo
   */
  const onClickExit = () => {
    if (showCategoryList) {
      setShowCategoryList(false);
    }
  };
  /**
   * controla que se vea o no las demás categorías desplegadas
   */
  const onCategoryPress = () => {
    setShowCategoryList(true);
  };

  /**
   * Metodo al que se le pasa la categoría seleccionada y se guarda en un array de categorías seleccionadas para que se pueda filtrar
   * @param category categoría que se selecciona
   */
  const categoryFilter = (id: number) => {
    // si ya estaba en la lista se eliminará
    // si no está en la lista, se añadirá
    if (categorySelectedId.includes(id)) {
      const ifCategory = categorySelectedId.filter(x => x !== id);
      setCategorySelectedId([...ifCategory]);
    } else {
      setCategorySelectedId([...categorySelectedId, id]);
    }
  };

  const setCheckCategories = (item: Topic) => {
    // Verificar si el elemento ya está seleccionado
    if (categoriesSelected.includes(item)) {
      setCategoriesSelected(
        categoriesSelected.filter(selectedItem => selectedItem !== item),
      );
    } else {
      setCategoriesSelected([...categoriesSelected, item]);
    }

    categoryFilter(item.id);
  };

  const categorySelectedFilter = () => {
    //si no hay categorías y estaba mostrandolas, se pone el on search a false
    if (categorySelectedId.length <= 0 && onSearch) {
      setCategorySelectedId([]);
      setCategoriesSelected([]);
      setOnSearch(false);
    } else {
      const filtered = newProjectList.filter(project =>
        project.topic.some(id =>
          categorySelectedId.some(hasta => hasta === id),
        ),
      );
      setOnSearch(true);
      setImportantProjectList(filtered);
    }
  };

  /**
   * busca y cambia la view
   */
  const onSearchText = (value: string) => {
    if (value.length > 0) {
      onChange(value, 'searchText');
      setOnSearch(true);
      const filtered = newProjectList.filter(x =>
        x.name.toLocaleLowerCase().includes(value.toLocaleLowerCase()),
      );
      setImportantProjectList(filtered);
    } else {
      onChange('', 'searchText');
      setOnSearch(false);
    }
  };

  /**
   * hace una actualización de los proyectos
   */
  const onRefresh = () => {
    setRefreshing(true);
    setOnSearch(false);
    setCategorySelectedId([]);
    categoryListApi();
    projectListApi();
  };

  /**
   * Navega a la pagina del proyecto
   * @param id id del proyecto
   */
  const onProjectPress = (id: number) => {
    if (id > 0) {
      navigation.navigate('ProjectPage', {id});
    }
  };

  const splitDataIntoRows = (data: ShowProject[], columns: number) => {
    const rows = [];
    for (let i = 0; i < data.length; i += columns) {
      rows.push(data.slice(i, i + columns));
    }
    return rows;
  };

  const rows = splitDataIntoRows(newProjectList, 2);

  const chunkArray = (list: ShowProject[], chunkSize: number) => {
    if (list.length > 5) {
      setNewProjectListSliced(list.slice(0, chunkSize));
    } else {
      setNewProjectListSliced(list);
    }
  };

  //#region ApiCalls
  const setErrorMessage = (errMsg: any) => {
    let textError = '';
    const dataError = JSON.stringify(errMsg.response.data, null);
    const dataErrorObj = JSON.parse(dataError);
    for (const x in dataErrorObj) {
      textError += dataErrorObj[x] + '\n';
    }
    setErrMessage(textError);
  };

  const categoryListApi = async () => {
    let token;
if (!isGuest) {
    while (!token) {
      token = await AsyncStorage.getItem('token');
}
    }

    let retries = 0;
    let success = false;

    try {
      const resp = await citmapApi.get<Topic[]>(
        '/project/topics/',
         {
        headers: {
          Authorization: token,
        },
      }
      );
      //TODO ORDENAR
      setCategoryList(resp.data);

      success = true;
      projectListApi();
    } catch (err: any) {
      console.log(err.response.data);
      setErrorMessage(err);
      retries++;
      await new Promise<void>(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }

    if (!success) {
      // Si no se pudieron cargar los datos después de los intentos, muestra el Toast
      Toast.show({
        type: 'error',
        text1: 'Error',
        // text2: 'No se han podido obtener los datos, por favor reinicie la app',
        text2: errMessage,
      });
    }
  };

  const projectListApi = async () => {
    let token;
if (!isGuest) {
    while (!token) {
      token = await AsyncStorage.getItem('token');
    }
}

    try {
      const resp = await citmapApi.get<ShowProject[]>('/project/', {
        headers: {
          Authorization: token,
        },
      });

      setNewProjectList(resp.data);
      chunkArray(resp.data, NUM_SLICE_NEW_PROJECT_LIST);
      // setLoading(false);
      organizationListApi();
      // console.log(JSON.stringify(resp.data, null, 2))
    } catch (err: any) {
      console.log(err.response.data);
    } finally {
    }
  };

  const organizationListApi = async () => {
    let token;
if (!isGuest) {
    while (!token) {
      token = await AsyncStorage.getItem('token');
}
    }
    try {
      const resp = await citmapApi.get<Organization[]>(
        '/organization/'
        , {
        headers: {
          Authorization: token,
        },
      }
      );
      setOrganizationList(resp.data);
      setLoading(false);
    } catch {
    } finally {
    }
  };

  /**
   *  TODO cambiar estado del heart del fav mas rapidamente
   * @param idProject
   */
  const toggleLike = async (idProject: number) => {
    const projectIndex = newProjectList.findIndex(
      project => project.id === idProject,
    );

    // Si se encontró el proyecto en la lista
    if (projectIndex !== -1) {
      // Crea una copia del proyecto en esa posición y cambia el valor del booleano
      const updatedProjectList = [...newProjectList];
      updatedProjectList[projectIndex] = {
        ...updatedProjectList[projectIndex],
        is_liked_by_user: !updatedProjectList[projectIndex].is_liked_by_user,
        total_likes:
          !updatedProjectList[projectIndex].is_liked_by_user == true
            ? updatedProjectList[projectIndex].total_likes! + 1
            : updatedProjectList[projectIndex].total_likes! - 1,
      };

      // Actualiza el estado o la variable con la nueva lista
      setNewProjectList(updatedProjectList);

      // Puedes realizar otras acciones necesarias aquí
    }

    let token;
    while (!token) {
      token = await AsyncStorage.getItem('token');
    }
    try {
      const resp = await citmapApi.post(
        `/projects/${idProject}/toggle-like/`,
        {},
        {
          headers: {
            Authorization: token,
          },
        },
      );

      Toast.show({
        type: 'success',
        text1: 'Like',
        // text2: 'No se han podido obtener los datos, por favor reinicie la app',
        text2: resp.data.message,
      });

      onRefresh();
    } catch (err) {}
  };

  //lista de topics devuelta por cada proyecto
  const returnTopics = (list: number[]) => {
    const returnTopic: Topic[] = [];
    for (const num of list) {
      const matchingTopic = categoryList.find(topic => topic.id === num);
      if (matchingTopic) {
        returnTopic.push(matchingTopic);
      }
    }
    // console.log(JSON.stringify(returnTopic, null, 2))
    return returnTopic;
  };

  //#endregion

  const toastInfoGuest = () => {
    // Toast.show({
    //   type: 'info',
    //   text1: 'Registrate para disfrutar de la app al máximo.',
    //   // text2: 'No se han podido obtener los datos, por favor reinicie la app',
    //   // text2: errMessage,
    // });
    showGuestModal();
  };

  const toLogginIfGuest = () => {
    hideGuestModal();
    signOut();
  };

  //#endregion

  const returnRenderNoProyects = () => {
    return (
      <>
        <View style={{alignItems: 'center', marginTop: '1%', opacity: 0.5}}>
          <Text
            style={{
              width: '40%',
              textAlign: 'center',
              color: 'black',
              fontSize: FontSize.fontSizeText20,
              fontFamily: FontFamily.NotoSansDisplayRegular,
              fontWeight: '700',
            }}>
            {fontLanguage.Home[0].no_projects_text_1}
          </Text>
          <Text
            style={{
              width: '65%',
              textAlign: 'center',
              color: 'black',
              fontSize: FontSize.fontSizeText13,
              fontFamily: FontFamily.NotoSansDisplayMedium,
              fontWeight: '600',
              marginTop: '3%',
            }}>
            {fontLanguage.Home[0].no_projects_text_2}
          </Text>
          <View style={{alignItems: 'center'}}>
            <NotCreated width={RFPercentage(20)} height={RFPercentage(20)} />
          </View>
        </View>
      </>
    );
  };
  const returnRenderNoOrganizations = () => {
    return (
      <>
        <View style={{alignItems: 'center', marginTop: '1%', opacity: 0.5}}>
          <Text
            style={{
              width: '40%',
              textAlign: 'center',
              color: 'black',
              fontSize: FontSize.fontSizeText20,
              fontFamily: FontFamily.NotoSansDisplayRegular,
              fontWeight: '700',
            }}>
           {fontLanguage.Home[0].no_observations_text_1}
          </Text>
          <Text
            style={{
              width: '65%',
              textAlign: 'center',
              color: 'black',
              fontSize: FontSize.fontSizeText13,
              fontFamily: FontFamily.NotoSansDisplayMedium,
              fontWeight: '600',
              marginTop: '3%',
            }}>
            {fontLanguage.Home[0].no_observations_text_2}
          </Text>
          <View style={{alignItems: 'center'}}>
            <NotCreated width={RFPercentage(20)} height={RFPercentage(20)} />
          </View>
        </View>
      </>
    );
  };

  // if (!isAllCharged) {
  //   return <LoadingScreen />;
  // }

  return (
    <>
      <KeyboardAvoidingView
        keyboardVerticalOffset={RFPercentage(2)}
        style={{flex: 1, backgroundColor: 'transparent'}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Ajusta la vista por encima del teclado
      >
        <SafeAreaView style={{flexGrow: 1, backgroundColor: 'white'}}>
          <View
            style={{flex: 1}}
            onTouchEnd={() => {
              onClickExit();
            }}>
            {/* titulo */}
            <View style={{...HomeStyles.titleView}}>
              {/* <Text style={HomeStyles.title}>Geonity</Text> */}
              <View style={HomeStyles.title}>
                <Geonity
                  height={heightPercentageToDP(43)}
                  width={widthPercentageToDP(43)}
                  fill={'black'}
                />
              </View>
              <TouchableOpacity
                onPress={() => mostrarMenu()}
                style={{
                  position: 'absolute',
                  justifyContent: 'center',
                  right: widthPercentageToDP(10),
                  marginTop: heightPercentageToDP(7),
                }}>
                {/* <IconBootstrap name={'stars'} size={20} color={'blue'} /> */}
                <Dots
                  width={RFPercentage(3)}
                  height={RFPercentage(3)}
                  fill={'#000000'}
                />
              </TouchableOpacity>
            </View>
            {/* barra de busqueda */}
            <View style={HomeStyles.searchView}>
              <InputText
                iconLeft="search"
                label={fontLanguage.Home[0].search}
                keyboardType="email-address"
                multiline={false}
                numOfLines={1}
                value={form.searchText}
                onChangeText={value => onSearchText(value)}
              />
            </View>
            <ScrollView
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              style={HomeStyles.scrollParent}
              onTouchEnd={() => {
                onClickExit();
              }}
              nestedScrollEnabled={true}
              // contentContainerStyle={{flexGrow: 1}}
              contentContainerStyle={{paddingBottom: '20%'}}
              keyboardShouldPersistTaps="handled"
              // scrollEnabled={!onSearch}
            >
              {/* view de categoría */}
              <LinearGradient
                colors={['rgba(255, 138, 0, 0.42)', '#CB9DA8']}
                style={HomeStyles.categoryView}
                start={{x: 0, y: 0.5}}
                end={{x: 1, y: 0.5}}>
                <Text
                  style={{
                    height: heightPercentageToDP(5),
                    width: '100%',
                    textAlignVertical: 'center',
                    marginLeft: widthPercentageToDP(7),
                    marginTop: heightPercentageToDP(2),
                    marginBottom: heightPercentageToDP(1),
                    fontFamily: FontFamily.NotoSansDisplaySemiBold,
                    fontSize: FontSize.fontSizeText18,
                    color: 'black',
                  }}>
                  {fontLanguage.Home[0].category}
                </Text>
                <ScrollView
                  style={HomeStyles.categoryScrollView}
                  contentContainerStyle={{paddingLeft: widthPercentageToDP(7)}}
                  horizontal={true}
                  nestedScrollEnabled={true}
                  showsHorizontalScrollIndicator={false}>
                  {categoryList.slice(0, 9).map((x, index) => {
                    const isChecked = categoriesSelected.includes(x);
                    if (categoryList.slice(0, 9).length - 1 === index) {
                      return (
                        <View
                          key={index}
                          style={{
                            marginRight: RFPercentage(1.2),
                            borderRadius: 10,
                          }}>
                          <Card
                            key={index}
                            type="categoryPlus"
                            categoryImage={0}
                            onPress={() => {
                              onCategoryPress();
                              // Condición para mostrar u ocultar la barra de pestañas
                              // const newTabBarVisibility = !navigation.dangerouslyGetState().routes[0].state?.index;
                              // navigation.setParams({ tabBarVisible: newTabBarVisibility });
                            }}
                          />
                        </View>
                      );
                    } else {
                      return (
                        <View
                          key={index}
                          style={{
                            marginRight: RFPercentage(1.2),
                            borderRadius: 40,
                            opacity: 1,
                          }}>
                          <Card
                            key={index}
                            type="category"
                            categoryImage={x.id}
                            title={x.topic}
                            onPress={() => {
                              // categoryFilter(x.id);
                              setCheckCategories(x);
                            }}
                            pressed={
                              isChecked //si tiene el id en la lista de seleccionados
                            }
                          />
                        </View>
                      );
                    }
                  })}
                </ScrollView>
              </LinearGradient>
              {!onSearch && (
                <View>
                  {/* view de nuevos proyectos */}
                  <View style={HomeStyles.newProjectView}>
                    <View
                      style={{
                        flexDirection: 'row',
                        height: 54,
                        width: '100%',
                        marginLeft: RFPercentage(3),
                        marginBottom: RFPercentage(2),
                      }}>
                      <View
                        style={{
                          marginHorizontal: '1%',
                          justifyContent: 'center',
                          // top: 1,
                        }}>
                        {/* <IconBootstrap name={'stars'} size={20} color={'blue'} /> */}
                        <Stars
                          width={RFPercentage(2.5)}
                          height={RFPercentage(2.5)}
                          fill={'#2b4ce0'}
                        />
                      </View>
                      <Text
                        style={{
                          textAlignVertical: 'center',
                          fontFamily: FontFamily.NotoSansDisplaySemiBold,
                          fontSize: FontSize.fontSizeText18,
                          marginLeft: RFPercentage(2),
                          alignSelf: 'center',
                          color: 'black',
                        }}>
                        {fontLanguage.Home[0].new_project}
                      </Text>
                    </View>
                    {newProjectList.length <= 0 ? (
                      returnRenderNoProyects()
                    ) : (
                      <ScrollView
                        style={HomeStyles.newProjectScrollView}
                        contentContainerStyle={{
                          paddingLeft: widthPercentageToDP(7),
                        }}
                        horizontal
                        showsVerticalScrollIndicator={false}
                        showsHorizontalScrollIndicator={false}
                        nestedScrollEnabled={true}>
                        <FlatList
                          contentContainerStyle={{alignSelf: 'flex-start'}}
                          numColumns={Math.ceil(10 / 2)}
                          showsVerticalScrollIndicator={false}
                          showsHorizontalScrollIndicator={false}
                          // scrollEnabled={false}
                          data={newProjectListSliced}
                          renderItem={({item, index}) => {
                            if (
                              newProjectListSliced.length > 5 &&
                              newProjectListSliced.length - 1 === index
                            ) {
                              return (
                                <View
                                  key={index}
                                  style={{
                                    marginRight: widthPercentageToDP(0.5),
                                    borderRadius: 40,
                                    opacity: 1,
                                  }}>
                                  <Card
                                    key={index}
                                    type="newProjectsPlus"
                                    categoryImage={index}
                                    onPress={() => {
if (!isGuest) {
                                      navigation.navigate('ProjectList', {
                                        title: fontLanguage.Home[0].new_project,
                                      });
} else {
                                        toastInfoGuest();
                                        // signOut();
                                      }
                                    }}
                                  />
                                </View>
                              ); //aquí poner el plus
                            } else {
                              return (
                                <View
                                  key={index}
                                  style={{
                                    marginRight: widthPercentageToDP(0.5),
                                    borderRadius: 40,
                                    opacity: 1,
                                  }}>
                                  <Card
                                    key={index}
                                    type="newProjects"
                                    cover={
                                      item.cover && item.cover[0]
                                        ? item.cover[0].image
                                        : ''
                                    }
                                    categoryImage={index}
                                    title={item.name}
                                    onPress={() => {
                                      if (!isGuest) {
                                        onProjectPress(item.id);
                                      } else {
                                        toastInfoGuest();
                                        // signOut();
                                      }
                                    }}
                                  />
                                </View>
                              );
                            }
                          }}
                        />
                      </ScrollView>
                    )}
                  </View>

                  {/* view de te proyectos destacados */}
                  <View style={HomeStyles.importantProjectView}>
                    <View
                      style={{
                        flexDirection: 'row',
                        height: RFPercentage(7),
                        width: '100%',
                        marginLeft: 24,
                        marginBottom: RFPercentage(2),
                      }}>
                      <View
                        style={{
                          marginHorizontal: '1%',
                          justifyContent: 'center',
                          top: 1,
                        }}>
                        {/* <IconBootstrap name={'stars'} size={20} color={'blue'} /> */}
                        <PeopleFill
                          width={RFPercentage(2.5)}
                          height={RFPercentage(2.5)}
                          fill={'#2b4ce0'}
                        />
                      </View>
                      <Text
                        style={{
                          textAlignVertical: 'center',
                          fontFamily: FontFamily.NotoSansDisplaySemiBold,
                          fontSize: FontSize.fontSizeText18,
                          marginLeft: RFPercentage(2),
                          alignSelf: 'center',
                          color: 'black',
                        }}>
                        {fontLanguage.Home[0].important_projects}
                      </Text>
                    </View>

                    {newProjectList.length <= 0 ? (
                      returnRenderNoProyects()
                    ) : (
                      <FlatList
                        style={HomeStyles.importantProjectScrollView}
                        contentContainerStyle={{
                          paddingLeft: widthPercentageToDP(7),
                        }}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        data={newProjectList.slice(0, 10)}
                        renderItem={({item, index}) => {
                          if (
                            newProjectList.length > 5 &&
                            newProjectList.slice(0, 10).length - 1 === index
                          ) {
                            return (
                              <View
                                key={index}
                                style={{
                                  marginRight: widthPercentageToDP(2.3),
                                  borderRadius: 40,
                                  opacity: 1,
                                }}>
                                <Card
                                  key={index}
                                  type="importantsPlus"
                                  categoryImage={index}
                                  cover={
                                    item.cover && item.cover[0]
                                      ? item.cover[0].image
                                      : ''
                                  }
                                  onPress={() => {
if (!isGuest) {
                                    navigation.navigate('ProjectList', {
                                      title: fontLanguage.Home[0].important_projects,
                                    });
} else {
                                      toastInfoGuest();
                                      // signOut();
                                    }
                                  }}
                                />
                              </View>
                            );
                          } else {
                            return (
                              <View
                                key={index}
                                style={{
                                  marginRight: widthPercentageToDP(2.3),
                                  borderRadius: 40,
                                  opacity: 1,
                                }}>
                                <Card
                                  key={index}
                                  type="importants"
                                  categoryImage={index}
                                  cover={
                                    item.cover && item.cover[0]
                                      ? item.cover[0].image
                                      : ''
                                  }
                                  onPress={() => {
if (!isGuest) {
                                    onProjectPress(item.id);
} else {
                                      toastInfoGuest();
                                      // signOut();
                                    }
                                  }}
                                  contribution={item.contributions}
                                  title={item.name}
                                  boolHelper={item.is_liked_by_user}
                                  description={
                                    item.organizations.length > 0
                                      ? item.organizations[0].principalName
                                      : fontLanguage.Home[0].no_organization
                                  }
                                  totalLikes={
                                    item.total_likes ? item.total_likes : 0
                                  }
                                  onLike={() => toggleLike(item.id)}
                                />
                              </View>
                            );
                          }
                        }}
                        keyExtractor={(item, index) => index.toString()}
                        nestedScrollEnabled
                      />
                    )}
                  </View>

                  {/* view de te puede interesar */}
                  <View style={HomeStyles.interestingView}>
                    <View
                      style={{
                        flexDirection: 'row',
                        height: 54,
                        width: '100%',
                        marginLeft: 24,
                        marginBottom: RFPercentage(2),
                      }}>
                      <View
                        style={{
                          marginHorizontal: '1%',
                          justifyContent: 'center',
                          top: 1,
                        }}>
                        <Magic
                          width={RFPercentage(2.5)}
                          height={RFPercentage(2.5)}
                          fill={'#2b4ce0'}
                        />
                      </View>
                      <Text
                        style={{
                          textAlignVertical: 'center',
                          fontFamily: FontFamily.NotoSansDisplaySemiBold,
                          fontSize: FontSize.fontSizeText18,
                          marginLeft: RFPercentage(2),
                          alignSelf: 'center',
                          color: 'black',
                        }}>
                        {fontLanguage.Home[0].interesting}
                      </Text>
                    </View>

                    {newProjectList.length <= 0 ? (
                      returnRenderNoProyects()
                    ) : (
                      <ScrollView
                        style={HomeStyles.interestingScrollView}
                        contentContainerStyle={{
                          paddingLeft: widthPercentageToDP(7),
                        }}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        nestedScrollEnabled={true}>
                        {newProjectList.slice(0, 10).map((x, index) => {
                          if (
                            newProjectList.length > 5 &&
                            newProjectList.slice(0, 10).length - 1 === index
                          ) {
                            return (
                              <View
                                key={index}
                                style={{
                                  marginRight: widthPercentageToDP(0.5),
                                  borderRadius: 40,
                                  opacity: 1,
                                }}>
                                <Card
                                  key={index}
                                  type="interestingPlus"
                                  categoryImage={index}
                                  onPress={() => {
if (!isGuest) {
                                    navigation.navigate('ProjectList', {
                                      title: fontLanguage.Home[0].interesting,
                                    });
} else {
                                      toastInfoGuest();
                                      // signOut();
                                    }
                                  }}
                                />
                              </View>
                            );
                          } else {
                            return (
                              <View
                                key={index}
                                style={{
                                  marginRight: widthPercentageToDP(0.5),
                                  borderRadius: 40,
                                  opacity: 1,
                                }}>
                                <Card
                                  key={index}
                                  type="interesting"
                                  categoryImage={index}
                                  onPress={() => {
if (!isGuest) {
                                    onProjectPress(x.id);
} else {
                                      toastInfoGuest();
                                      // signOut();
                                    }
                                  }}
                                  cover={
                                    x.cover && x.cover[0]
                                      ? x.cover[0].image
                                      : ''
                                  }
                                  title={x.name}
                                  description={
                                    x.organizations.length > 0
                                      ? x.organizations[0].principalName
                                      : fontLanguage.Home[0].no_organization
                                  }
                                />
                              </View>
                            );
                          }
                        })}
                      </ScrollView>
                    )}
                  </View>

                  {/* view de organizaciones destacadas */}
                  <View style={HomeStyles.importantOrganizationView}>
                    <View
                      style={{
                        flexDirection: 'row',
                        height: 54,
                        width: '100%',
                        marginLeft: 24,
                        marginBottom: RFPercentage(2),
                      }}>
                      <View
                        style={{
                          marginHorizontal: '1%',
                          justifyContent: 'center',
                          top: 1,
                        }}>
                        <Boockmark
                          width={RFPercentage(2.1)}
                          height={RFPercentage(2.1)}
                          fill={'#2b4ce0'}
                        />
                      </View>
                      <Text
                        style={{
                          textAlignVertical: 'center',
                          fontFamily: FontFamily.NotoSansDisplaySemiBold,
                          fontSize: FontSize.fontSizeText18,
                          marginLeft: RFPercentage(2),
                          alignSelf: 'center',
                          color: 'black',
                        }}>
                        {fontLanguage.Home[0].important_organizations}
                      </Text>
                    </View>
                    {organizationList.length <= 0 ? (
                      returnRenderNoOrganizations()
                    ) : (
                      <ScrollView
                        style={HomeStyles.importantOrganizationScrollView}
                        contentContainerStyle={{
                          paddingLeft: widthPercentageToDP(7),
                        }}
                        horizontal={true}
                        nestedScrollEnabled={true}
                        showsHorizontalScrollIndicator={false}>
                        {organizationList.slice(0, 5).map((x, index) => {
                          if (
                            organizationList.length > 5 &&
                            organizationList.slice(0, 5).length - 1 === index
                          ) {
                            return (
                              <View
                                key={index}
                                style={{
                                  marginRight: widthPercentageToDP(0.5),
                                  borderRadius: 40,
                                  opacity: 1,
                                }}>
                                <Card
                                  key={index}
                                  type="organizationPlus"
                                  categoryImage={index}
                                  onPress={() => {
                                    if (!isGuest) {
                                    navigation.navigate('OrganizationList');
                                    } else {
                                      toastInfoGuest();
                                      // signOut();
                                  }
}}
                                />
                              </View>
                            );
                          } else {
                            return (
                              <View
                                key={index}
                                style={{
                                  marginRight: widthPercentageToDP(0.5),
                                  borderRadius: 40,
                                  opacity: 1,
                                }}>
                                <Card
                                  key={index}
                                  type="organization"
                                  categoryImage={index}
                                  cover={x.logo ? x.logo : ''}
                                  title={x.principalName}
                                  description={x.description}
                                  onPress={() => {
                                    if (!isGuest) {
                                    navigation.navigate('OrganizationPage', {
                                      id: x.id,
                                    });
                                    } else {
                                      toastInfoGuest();
                                      // signOut();
                                  }
}}
                                />
                              </View>
                            );
                          }
                        })}
                      </ScrollView>
                    )}
                  </View>
                </View>
              )}
              {onSearch && (
                <View
                  style={{
                    position: 'relative',
                    top: RFPercentage(0),
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      height: 54,
                      width: '100%',
                      marginLeft: RFPercentage(3),
                      // marginBottom: RFPercentage(1),
                    }}>
                    <View
                      style={{
                        marginHorizontal: '1%',
                        justifyContent: 'center',
                        top: 1,
                      }}>
                      <IconBootstrap
                        name={'search'}
                        size={20}
                        color={'black'}
                      />
                    </View>
                    <Text
                      style={{
                        textAlignVertical: 'center',
                        fontFamily: FontFamily.NotoSansDisplayRegular,
                        fontSize: FontSize.fontSizeText20,
                        alignSelf: 'center',
                        color: 'black',
                      }}>
                      {fontLanguage.Home[0].project_found}
                    </Text>
                  </View>
                  <View
                    style={{
                      marginHorizontal: widthPercentageToDP(5.6),
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                    }}>
                    {categoriesSelected.map(value => {
                      return (
                        <Text
                          key={value.id}
                          style={{
                            color: Colors.semanticInfoDark,
                            fontSize: FontSize.fontSizeText17,
                          }}>
                          #{value.topic}{' '}
                        </Text>
                      );
                    })}
                  </View>

                  <ScrollView
                    style={{
                      alignSelf: 'center',
                      width: '100%',
                    }}
                    contentContainerStyle={{flexGrow: 1, alignItems: 'center'}}
                    nestedScrollEnabled={true}
                    automaticallyAdjustsScrollIndicatorInsets
                    scrollEnabled={true}
                    horizontal={false}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}>
                    {importantProjectList.map((x, index) => {
                      // if (importantProjectList.length - 1 === index) {
                      return (
                        <Card
                          key={index}
                          type="projectFound"
                          cover={x.cover && x.cover[0] ? x.cover[0].image : ''}
                          categoryImage={index}
                          title={x.name}
                          totalLikes={x.total_likes ? x.total_likes : 0}
                          boolHelper={x.is_liked_by_user}
                          description={x.description}
                          contribution={x.contributions}
                          list={returnTopics(x.topic)}
                          onPress={() => {
                            onProjectPress(x.id);
                          }}
                        />
                      );
                      // }
                    })}
                  </ScrollView>
                </View>
              )}
            </ScrollView>
          </View>
          {showCategoryList && (
            <View style={HomeStyles.showCategoryView}>
              <View
                style={{
                  width: '100%',
                  alignItems: 'center',
                  backgroundColor: 'white',
                  height: 10,
                  marginBottom: '2%',
                }}>
                <TouchableOpacity
                  style={{
                    borderRadius: 50,
                    backgroundColor: Colors.contentSecondaryDark,
                    height: heightPercentageToDP(0.8),
                    width: '17%',
                  }}></TouchableOpacity>
              </View>
              <View
                style={{
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  marginVertical: '4%',
                  marginHorizontal: RFPercentage(4),
                }}>
                <View>
                  <Text
                    style={{
                      fontSize: FontSize.fontSizeText17,
                      fontFamily: FontFamily.NotoSansDisplaySemiBold,
                      color: 'black',
                    }}>
                    {fontLanguage.Home[0].all_categories}
                  </Text>
                </View>
                <View>
                  <TouchableOpacity onPress={() => setShowCategoryList(false)}>
                    <Text style={{color: Colors.primaryLigth}}>{fontLanguage.global[0].close_button}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <FlatList
                contentContainerStyle={{
                  alignItems: 'center',
                  alignSelf: 'center',
                  justifyContent: 'center',
                  width: '90%',
                }}
                numColumns={1}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                data={categoryList}
                renderItem={({item, index}) => {
                  const isChecked = categoriesSelected.includes(item);
                  return (
                    <View
                      style={{
                        width: RFPercentage(42),
                        flexDirection: 'row',
                        alignItems: 'center',
                        // justifyContent: 'space-between',
                      }}>
                      <Checkbox
                        uncheckedColor={'#838383'}
                        color={Colors.primaryLigth}
                        status={isChecked ? 'checked' : 'unchecked'}
                        onPress={() => {
                          setCheckCategories(item);
                        }}
                      />
                      <Text style={{color: 'black'}}>{item.topic}</Text>
                    </View>
                  ); //aquí poner el plus
                }}
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: '3%',
                  marginHorizontal: widthPercentageToDP(8),
                  alignContent: 'center',
                  alignItems: 'center',
                }}>
                <TouchableOpacity
                  onPress={() => {
                    setCategorySelectedId([]);
                    setCategoriesSelected([]);
                  }}>
                  <Text style={{color: Colors.primaryLigth}}>{fontLanguage.global[0].clean_all_button}</Text>
                </TouchableOpacity>
                <View style={{width: widthPercentageToDP(20)}}>
                  <CustomButton
                    backgroundColor={Colors.primaryLigth}
                    label={fontLanguage.global[0].apply}
                    onPress={() => setShowCategoryList(false)}
                  />
                </View>
              </View>
            </View>
          )}
          <Spinner visible={loading} />
          <Toast />
          <Modal
            visible={menuVisible}
            transparent
            animationType="none"
            onRequestClose={ocultarMenu}>
            <TouchableWithoutFeedback onPressOut={ocultarMenu}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  justifyContent: 'flex-start', // Alinear en la parte superior
                  alignItems: 'flex-end', // Alinear a la derecha
                  paddingTop:
                    Platform.OS === 'ios'
                      ? insets.top + heightPercentageToDP(6)
                      : heightPercentageToDP(6),
                  paddingRight: widthPercentageToDP(11), // Ajustar según sea necesario
                }}>
                <TouchableWithoutFeedback>
                    <View
                      style={{
                        position: 'relative',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'white',
                        width: widthPercentageToDP(27),
                        borderRadius: 10,
                        shadowColor: '#000',
                        shadowOffset: {
                          width: 0,
                          height: 0.1,
                        },
                        shadowOpacity: 0.2,
                        shadowRadius: 1.41,
                        elevation: 5,
                      }}>
                      <View
                        style={{
                          backgroundColor: 'white',
                          paddingHorizontal: widthPercentageToDP(2),
                          borderRadius: 10,
                        }}>
                        <TouchableOpacity
                          style={{marginTop: heightPercentageToDP(1), marginBottom: heightPercentageToDP(0.7)}}
                          onPress={signOut}>
                          <Text>{fontLanguage.Home[0].logout}</Text>
                        </TouchableOpacity>
                        {/* Otras opciones de menú aquí */}
                        <TouchableOpacity
                          style={{marginBottom: heightPercentageToDP(1),marginTop: heightPercentageToDP(0.7)}}
                          onPress={ocultarMenu}>
                          <Text>{fontLanguage.global[0].cancel_button}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>
          <View>
            <InfoModalGuest
              hideModal={hideGuestModal}
              visible={guestModal}
              onPress={toLogginIfGuest}
              label="¡Únete a Geonity ahora!"
              subLabel='Registrate o inicia sesión para poder participar en los proyectos y aprovechar al máximo todas las funcionalidades disponibles'
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
};

const HomeStyles = StyleSheet.create({
  scrollParent: {
    flex: 1,
    // backgroundColor: 'blue',
  },
  title: {
    alignSelf: 'center',
    // backgroundColor:'red',
    height: heightPercentageToDP(10),
    marginTop: heightPercentageToDP(2.9),
    justifyContent: 'center',
    // fontSize: FontSize.fontSizeTextTitle,
    // fontWeight: 'bold',
    // FontFamily: FontFamily.NotoSansDisplayRegular,
  },
  titleView: {
    // backgroundColor: 'red',
    height: heightPercentageToDP(13),
  },
  searchView: {
    // backgroundColor: 'green',
    height: heightPercentageToDP(4),
    marginBottom: 33,
    marginHorizontal: widthPercentageToDP(6),
  },
  categoryView: {
    // backgroundColor: 'cyan',
    flexDirection: 'column',
    height: heightPercentageToDP(25),
    marginBottom: heightPercentageToDP(4),
    // flex: 1,
  },
  categoryScrollView: {
    // height: heightPercentageToDP(10),
    // marginHorizontal: 24,
    // paddingLeft: widthPercentageToDP(5.7),
    // marginRight: widthPercentageToDP(2)
    // backgroundColor: 'red'
  },
  newProjectView: {
    // backgroundColor: 'yellow',
    marginBottom: '9%',
    // height: RFPercentage(35),
    // height: '20%',
  },
  newProjectScrollView: {
    // marginHorizontal: 24,
    // height: Size.globalHeight / 4,
  },
  importantProjectView: {
    // backgroundColor: 'brown',
    marginBottom: RFPercentage(3),
    height: heightPercentageToDP(50),
    // height: '27%',
  },
  importantProjectScrollView: {
    // marginHorizontal: RFPercentage(3),
    // height: RFPercentage(50),
  },
  interestingView: {
    // backgroundColor: 'purple',
    marginBottom: RFPercentage(3),
    height: '22%',
  },
  interestingScrollView: {
    // marginHorizontal: 24,
    // height: Size.globalHeight / 2,
  },
  importantOrganizationView: {
    // backgroundColor: 'grey',
    marginBottom: RFPercentage(1),
    height: '25%',
    // height: RFPercentage(30)
    // , backgroundColor: 'red',
  },
  importantOrganizationScrollView: {
    // marginHorizontal: 24,
    height: '20%',
  },

  showCategoryView: {
    position: 'absolute',
    backgroundColor: 'white',
    height: RFPercentage(75),
    width: '100%',
    zIndex: 200,
    bottom: 0,
    alignSelf: 'center',
    // borderTopWidth: 1,
    // borderLeftWidth: 1,
    // borderRightWidth: 1,
    borderTopRightRadius: 34,
    borderTopLeftRadius: 34,
    paddingVertical: '5%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0.1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 7,
  },
});
