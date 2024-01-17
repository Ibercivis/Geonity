import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {useLocation} from '../../../hooks/useLocation';
import {LoadingScreen} from '../../../screens/LoadingScreen';
import Mapbox from '@rnmapbox/maps';
import {useForm} from '../../../hooks/useForm';
import {
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import {InfoModal, InfoModalMap, SaveProyectModal} from '../../utility/Modals';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors} from '../../../theme/colors';
import Plus from '../../../assets/icons/map/plus-map.svg';
import Compass from '../../../assets/icons/map/Compass.svg';
import CardMap from '../../../assets/icons/map/card-map.svg';
import Back from '../../../assets/icons/map/chevron-left-map.svg';
import MarkEnabled from '../../../assets/icons/map/mark-asset.svg';
import MarkDisabled from '../../../assets/icons/map/mark-disabled.svg';
import Target from '../../../assets/icons/map/target-map.svg';
import {StackParams} from '../../../navigation/HomeNavigator';
import {StackScreenProps} from '@react-navigation/stack';
import {HeaderComponent} from '../../HeaderComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import citmapApi from '../../../api/citmapApi';
import {
  CreateObservation,
  FieldForm,
  ImageObservation,
  Observation,
  ObservationDataForm,
  Question,
  ShowProject,
  User,
} from '../../../interfaces/interfaces';
import {Spinner} from '../../utility/Spinner';
import {InputText} from '../../utility/InputText';
import {CardAnswerMap} from '../../utility/CardAnswerMap';
import {CustomButtonOutline} from '../../utility/CustomButtonOutline';
import {CustomButton} from '../../utility/CustomButton';
import {FontSize} from '../../../theme/fonts';
import {useDateTime} from '../../../hooks/useDateTime';
import Toast from 'react-native-toast-message';
import {project} from '../../../../react-native.config';
import {useNavigation} from '@react-navigation/native';

Mapbox.setWellKnownTileServer('mapbox');
Mapbox.setAccessToken(
  'pk.eyJ1IjoiYXBlbmE3IiwiYSI6ImNsYWt1NHYwNjBxMXYzbnBqN2luamV2ajQifQ.XJQH9SnPmCxVPoDnU0P2KQ',
);

interface Props extends StackScreenProps<StackParams, 'ParticipateMap'> {}
type Position = number[];

const {
  MapView,
  Camera,
  PointAnnotation,
  MarkerView,
  UserLocation,
  UserTrackingMode,
} = Mapbox;

export const ParticipateMap = ({navigation, route}: Props) => {
  const {
    hasLocation,
    getCurrentLocation,
    followUserLocation,
    userLocation,
    stopFollowUserLocation,
    initialPositionArray,
    loading,
  } = useLocation();

  const {currentISODateTime} = useDateTime();
  const nav = useNavigation();

  // useLayoutEffect(() => {
  //   navigation.getParent()?.setOptions({
  //     tabBarStyle: {
  //       display: "none",
  //     }
  //   });
  //   return () => navigation.getParent()?.setOptions({
  //     tabBarStyle: undefined
  //   });
  // }, [navigation]);

  useEffect(() => {
    nav.getParent()?.setOptions({
      tabBarStyle: {
        // display: "none",
        opacity: 0,
      },
    });
    return () =>
      nav.getParent()?.setOptions({
        tabBarStyle: undefined,
      });
  }, [nav]);

  //#region VARIABLES
  // map refs
  const mapViewRef = useRef<Mapbox.MapView>();
  const cameraRef = useRef<Mapbox.Camera>();
  const featureRef = useRef<any>([]);
  const followView = useRef<boolean>(false);

  // modal variables
  const [infoModal, setInfoModal] = useState(false);
  const showModalInfo = () => setInfoModal(true);
  const hideModalInfo = () => setInfoModal(false);

  const [errorValidate, setErrorValidate] = useState(false);
  const showModalValidate = () => setErrorValidate(true);
  const hideModalCValidate = () => setErrorValidate(false);

  // form variables
  const {form, onChange, clear} = useForm<CreateObservation>({
    data: [],
    field_form: 0,
    geoposition: '',
    timestamp: '',
    images: [],
  });

  const [project, setProject] = useState<ShowProject>();

  /**
   * un field form que pertenece a un proyecto, contiene questions
   */
  const [fieldForm, setFieldForm] = useState<FieldForm>({
    id: 0,
    project: 0,
    questions: [],
  });
  const [userInfo, setUserInfo] = useState<User>({
    email: '',
    first_name: '',
    last_name: '',
    pk: 0,
    username: '',
  });

  /**
   * un array de preguntas que pertenecen a UN unico proyecto
   */
  const [questions, setQuestions] = useState<Question[]>([]);

  /**
   * cada observation es una MARCA en el mapa
   * cada observation tiene un id de FIELDFORM asociado
   * esta observation será la que, si se selecciona una marca, se pintará en la pantalla del formulario
   * NO EDITABLE
   */
  const [observation, setObservation] = useState<Observation>();
  /**
   * lista de observations que van filtradas por el fieldform asociado
   */
  const [observationList, setObservationList] = useState<Observation[]>([]);
  const [observationListcopy, setObservationListcopy] = useState<Observation[]>(
    [],
  );

  /**
   * esta lista estará compuesta de los marcadores que crea el usuario
   */
  const [observationListCreator, setObservationListCreator] = useState<
    CreateObservation[]
  >([]);

  /**
   * esta observation será usada en el formulario cuando se vaya a ver
   */
  const [newObservation, setNewObservation] = useState<Observation>({
    id: 0,
    creator: 0,
    field_form: 0,
    geoposition: {
      srid: '0',
      point: {
        latitude: 0,
        longitude: 0,
      },
    },
    data: [],
    images: [],
  });

  const [newObservationCreate, setNewObservationCreate] =
    useState<CreateObservation>({
      field_form: 0,
      geoposition: '',
      data: [],
      timestamp: '',
    });

  const [selectedObservation, setSelectedObservation] = useState<Observation>({
    id: 0,
    creator: 0,
    field_form: 0,
    geoposition: {
      srid: '0',
      point: {
        latitude: 0,
        longitude: 0,
      },
    },
    data: [],
    images: [],
  });
  const [showSelectedObservation, setShowSelectedObservation] =
    useState<Observation>({
      id: 0,
      creator: 0,
      field_form: 0,
      geoposition: {
        srid: '0',
        point: {
          latitude: 0,
          longitude: 0,
        },
      },
      data: [],
      images: [],
    });

  // TODO gestionar lo de las imagenes
  const [imageObservation, setImageObservation] = useState<any>();
  const [imageObservationBlob, setImageObservationBlob] = useState<any>();

  // map controll
  const [isCreatingObservation, setIsCreatingObservation] = useState(false);
  const [colorMark, setColorMark] = useState('#FC5561');
  const [showMap, setShowMap] = useState(true);
  const [chargedData, setChargedData] = useState(false);
  const [canSave, setCanSave] = useState(true);
  const [onlyRead, setOnlyRead] = useState(false);

  const [waitingData, setWaitingData] = useState(true);

  // map variables

  const [showConfirmMark, setShowConfirmMark] = useState(false);

  //#endregion

  //#region USE EFFECT

  useEffect(() => {
    getProjectApi();
  }, []);

  /**
   * Activa el seguimiento por geolocalización
   */
  useEffect(() => {
    followUserLocation();
    showModalInfo();
    return () => {
      //cancelar el seguimiento
      stopFollowUserLocation();
    };
  }, []);

  useEffect(() => {
    if (hasLocation) {
      showModalInfo();
    }
  }, []);

  useEffect(() => {
    // if (userInfo.pk !== showSelectedObservation.creator) {
    //   setOnlyRead(true);
    // }
    if (showSelectedObservation) {
      handleEdit();
    }
  }, [showSelectedObservation]);

  useEffect(() => {
    cameraRef.current?.setCamera({
      centerCoordinate: [userLocation.longitude, userLocation.latitude],
    });
  }, []);

  /**
   * empleado para que cuando cargue el fieldform, se pueda obtener su id
   * solo entra si el id existe
   * cuando entra, hace el getObservaciones para pintar el mapa
   */
  useEffect(() => {
    if (fieldForm.id !== 0) {
      getObservation();
    }
  }, [fieldForm]);

  /**
   * entra cuando la lista de observaciones ha sido modificada
   * solo entra cuando los datos se han cargado
   * independientemente de si hay o no observaciones, da el paso al mapa
   */
  useEffect(() => {
    if (!waitingData) {
      setChargedData(true);
    }
  }, [observationList]);

  //#endregion

  //#region API CALLS
  const getProjectApi = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await citmapApi.get<ShowProject>(
        `/project/${route.params.id}`,
        {
          headers: {
            Authorization: token,
          },
        },
      );

      setProject(resp.data);

      const userInfo = await citmapApi.get<User>(
        '/users/authentication/user/',
        {
          headers: {
            Authorization: token,
          },
        },
      );
      setUserInfo(userInfo.data);

      const formfield = await citmapApi.get<FieldForm[]>(`/field_forms/`, {
        headers: {
          Authorization: token,
        },
      });

      if (fieldForm) {
        const single = formfield.data.find(x => x.project === route.params.id);
        if (single) {
          setFieldForm(single);
          setQuestions(single.questions);
        }
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        // text2: 'No se han podido obtener los datos, por favor reinicie la app',
        text2: 'No se han podido obtener pas questiones',
      });
    }
  };

  /**
   * cuando se cogen las observations, se pintan en el mapa
   * las observations se filtran segun el field form
   */
  const getObservation = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await citmapApi.get<Observation[]>(
        `/field_form/${fieldForm.id}/observations/`,
        {
          headers: {
            Authorization: token,
          },
        },
      );
      // setObservationList(resp.data);
      const newDataParse = await parseObservations(resp.data);
      if (waitingData) {
        await setWaitingData(false);
      }
      setObservationList(newDataParse);
      setObservationListcopy(newDataParse);
    } catch {}
  };

  const getObservationById = async (id: number) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await citmapApi.get<Observation>(`/observations/${id}`, {
        headers: {
          Authorization: token,
        },
      });
      setObservation(resp.data);
    } catch {}
  };

  const getCreatorApi = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const userInfo = await citmapApi.get<User>(
        '/users/authentication/user/',
        {
          headers: {
            Authorization: token,
          },
        },
      );
      setUserInfo(userInfo.data);
    } catch (err) {
      console.log('error en coger el creator');
      console.log(err);
    }
  };

  //#endregion

  //#region METHODS

  // Cuando cambies al modo de edición:
  const handleEdit = () => {
    // Completar los campos del formulario con los datos de showSelectedObservation
    // console.log(JSON.stringify(showSelectedObservation, null, 2));
    form.field_form = showSelectedObservation.field_form;
    form.geoposition = `POINT(${showSelectedObservation.geoposition.point.longitude} ${showSelectedObservation.geoposition.point.latitude})`;
    form.images = showSelectedObservation.images;
    form.data = showSelectedObservation.data;
  };

  const clearSelectedObservation = () => {
    //si no hay seleccionada ninguna, no hace update del mapa
    //si hay una pre-seleccionada, hace la update
    // if(selectedObservation.id > 0){
    //   updateMap()
    // }
    return {
      id: 0,
      creator: 0,
      field_form: 0,
      geoposition: {
        srid: '0',
        point: {
          latitude: 0,
          longitude: 0,
        },
      },
      data: [],
      images: [],
    };
  };

  const clearFormData = () => {
    clear();
  };

  /**
   * Metodo que creará el form en base a lo que se le pasa
   * @param value valor a cambiar
   * @param id corresponde al identificador de la pregunta
   * @param type es el typo de respuesta esperado
   */
  const onChangeText = (value: any, id: number, type: string) => {
    // console.log(JSON.stringify(form.data, null, 2));
    if (type === 'IMG') {
      // Busca si ya existe un elemento en form.images con la misma clave (id).
      const existingImageIndex = form.images!.findIndex(
        item => item.key === id,
      );

      if (existingImageIndex !== -1) {
        // Si ya existe un elemento con la misma clave (id), actualiza su valor.
        form.images![existingImageIndex].value = value;
      } else {
        // Si no existe un elemento con la misma clave (id), crea uno nuevo y agrégalo.
        const newImageObservation: ImageObservation = {
          key: id,
          value: value, // Supongo que aquí pasas la imagen como valor.
        };

        form.images!.push(newImageObservation);
      }
    } else {
      // Clona el array existente en form.data si existe, o crea uno nuevo si es nulo.
      const newDataArray: ObservationDataForm[] = form.data
        ? [...form.data]
        : [];

      // Busca si ya existe un elemento en newDataArray con la misma clave (id).
      const existingElement = newDataArray.find(
        item => item.key === id.toString(),
      );

      if (existingElement) {
        // Si ya existe un elemento con la misma clave (id), actualiza su valor.
        existingElement.value = value;
      } else {
        // Si no existe un elemento con la misma clave (id), crea uno nuevo y agrégalo.
        newDataArray.push({key: id.toString(), value: value});
      }
      // console.log(JSON.stringify(newDataArray, null, 2));
      // Actualiza form.data con el nuevo array de elementos.
      form.data = newDataArray;
    }
  };

  const parseGeoposition = (geopositionStr: string) => {
    // Verificamos si la cadena contiene 'POINT ('
    if (geopositionStr.includes('POINT (')) {
      // Extraemos las coordenadas de la cadena usando una expresión regular
      const match = /POINT \(([^ ]+) ([^)]+)\)/.exec(geopositionStr);

      if (match && match.length === 3) {
        // Obtenemos las coordenadas de la expresión regular
        const longitudeStr = match[1];
        const latitudeStr = match[2];

        // Convertimos las cadenas a números
        const longitude = parseFloat(longitudeStr);
        const latitude = parseFloat(latitudeStr);

        // Obtenemos el SRID de la cadena
        const sridMatch = /SRID=([^;]+)/.exec(geopositionStr);
        const srid = sridMatch ? sridMatch[1] : '';

        // Creamos una instancia de GeoPosition con los valores obtenidos
        const geoPosition = {
          srid,
          point: {
            longitude,
            latitude,
          },
        };

        return geoPosition;
      }
    }

    // Si la cadena no está en el formato esperado, puedes manejarlo de acuerdo a tus necesidades.
    const geoPosition = {
      srid: '',
      point: {
        longitude: 0,
        latitude: 0,
      },
    };
    return geoPosition; // O lanza una excepción, muestra un mensaje de error, etc.
  };

  const parseObservations = (jsonData: any[]) => {
    return jsonData.map(item => {
      const observation: Observation = {
        id: item.id,
        creator: item.creator,
        field_form: item.field_form,
        geoposition: parseGeoposition(item.geoposition),
        data: item.data,
        images: item.images,
      };
      return observation;
    });
  };

  /**
   * cuando pulsas una marca, cambia la opacidad de esta a 0 y pone un svg en esa posición de la pantalla
   *
   */
  const setMarkView = (coords: number[], id: number) => {};

  /**
   * Se le pasan las coordenadas y crea una observación.
   * Tras eso, llama de nuevo para cargar las observationList
   * @param coordinates coordenadas para crear la marca
   */
  const createNewObservation = async (coordinates: number[]) => {
    setColorMark('#919191');
    setIsCreatingObservation(true);
    clearFormData();
    setShowSelectedObservation(clearSelectedObservation);
    setSelectedObservation(clearSelectedObservation);
    const token = await AsyncStorage.getItem('token');
    try {
      let newFormData: ObservationDataForm[] = [];
      questions.forEach(question => {
        newFormData.push({
          key: question.id!.toString(),
          value: '',
        });
      });
      // se crea la nueva observación sin respuestas ni nada
      const createdObservation: CreateObservation = {
        field_form: fieldForm.id,
        timestamp: currentISODateTime,
        geoposition: `POINT(${coordinates[1]} ${coordinates[0]})`,
        data: newFormData,
      };
      // console.log(newFormData)
      form.data = newFormData;
      onChange(newFormData, 'data');
      await setNewObservationCreate(createdObservation);
      await setObservationListCreator([
        ...observationListCreator,
        createdObservation,
      ]);
    } catch (err) {
      console.log('error al coger la informacion del usuario ');
      console.log(err);
    }
  };

  /**
   *
   * @param wktString el valor del POINT dentro de la observation
   * @returns devuelve un array con la latitud y longitud
   */
  const parsePoint = (wktString: string) => {
    const match = wktString.match(/POINT\((-?\d+\.\d+) (-?\d+\.\d+)\)/);

    if (match) {
      const latitude = parseFloat(match[2]);
      const longitude = parseFloat(match[1]);
      return [latitude, longitude];
    }
  };

  const onSaveObservation = async () => {
    if (canSave) {
      let validate = true;
      setWaitingData(true);
      const token = await AsyncStorage.getItem('token');
      setColorMark('#FC5561');

      const formData = new FormData();

      // Agregar los campos a FormData
      formData.append('field_form', fieldForm.id);
      formData.append('timestamp', newObservationCreate.timestamp);
      formData.append('geoposition', newObservationCreate.geoposition);

      // console.log(JSON.stringify(form.data, null, 2));
      const updatedQuestions = [...questions];
      //hay que recorrer las question y si es obligatorio, y no se ha escrito, se hace un false para que no guarde y muestre un error
      updatedQuestions.forEach((question, index) => {
        if (question.answer_type === 'IMG') {
          return;
        }
        if (question.mandatory) {
          console.log('es true el mandatory');
          form.data.map(x => {
            if (x.key === question.id?.toString()) {
              console.log('tienen mismo id');
              if (x.value === '' || x.value === undefined) {
                console.log('está vacío');
                validate = false;
              }
            }
          });
        }
      });

      const newFormFiltered = form.data.filter(x => x.value !== '');

      if (validate) {
        formData.append('data', JSON.stringify(newFormFiltered));
      }

      if (form.images) {
        form.images.forEach(image => {
          if (image.key !== undefined)
            formData.append(image.key.toString(), image.value);
        });
      }

      console.log(JSON.stringify(formData, null, 2));
      console.log(JSON.stringify(form.images, null, 2));

      try {
        if (validate) {
          const marca = await citmapApi.post('/observations/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: token,
            },
          });

          setIsCreatingObservation(false);
          setShowSelectedObservation(clearSelectedObservation());
          setObservationListCreator([]);
          setObservationList([]);
          await getObservation();
          setShowMap(true);
        } else {
          // showModalValidate();
          Toast.show({
            type: 'error',
            text1: 'Error',
            // text2: 'No se han podido obtener los datos, por favor reinicie la app',
            text2: 'Los campos obligatorios tienen que ser rellenados',
          });
        }

        setWaitingData(false);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          // text2: 'No se han podido obtener los datos, por favor reinicie la app',
          text2: 'Los campos obligatorios tienen que ser rellenados',
        });
        setWaitingData(false);
        if (error.response) {
          // Se recibió una respuesta del servidor con un código de estado de error

          if (error.response.status === 400) {
            console.log(
              'Error 400: Solicitud incorrecta - La solicitud tiene un formato incorrecto o faltan datos.',
            );
          } else if (error.response.status === 401) {
            console.log(
              'Error 401: No autorizado - La solicitud requiere autenticación.',
            );
          } else if (error.response.status === 403) {
            console.log(
              'Error 403: Prohibido - No tienes permiso para acceder a este recurso.',
            );
          } else if (error.response.status === 404) {
            console.log(
              'Error 404: No encontrado - El recurso solicitado no existe en el servidor.',
            );
          } else {
            console.log(
              `Error ${error.response.status}: Error en la solicitud.`,
            );
          }

          // Puedes acceder a detalles adicionales de la respuesta del servidor:
          console.log('Mensaje del servidor:', error.response.data);
          console.log('Encabezados de respuesta:', error.response.headers);
        } else if (error.request) {
          // La solicitud se realizó, pero no se recibió una respuesta
          console.log(
            'Error de red: No se pudo recibir una respuesta del servidor.',
          );
        } else {
          // Se produjo un error durante la configuración de la solicitud
          console.log('Error de configuración de la solicitud:', error.message);
        }
      } finally {
        setWaitingData(false);
      }
    }
  };

  const onEditObservation = async () => {
    setWaitingData(true);
    const token = await AsyncStorage.getItem('token');
    setColorMark('#FC5561');
    const formData = new FormData();

    // Agregar los campos a FormData
    formData.append('creator', userInfo.pk);
    formData.append('field_form', fieldForm.id);
    formData.append('timestamp', currentISODateTime);
    formData.append('geoposition', form.geoposition);
    if (form.data) {
      formData.append('data', JSON.stringify(form.data));
    }
    console.log(JSON.stringify(showSelectedObservation, null, 2));
    if (form.images) {
      form.images.forEach(image => {
        if (image.key !== undefined)
          formData.append(image.key.toString(), image.value);
      });
    }
    // if (showSelectedObservation.images && showSelectedObservation.images.length> 0) {
    //   console.log('entra en images')
    //   showSelectedObservation.images.forEach(image => {
    //     if (image.id !== undefined)
    //       formData.append(image.id.toString(), image.image);
    //   });
    // }
    console.log(JSON.stringify(formData, null, 2));
    try {
      const marca = await citmapApi.patch(
        `/observations/${showSelectedObservation.id}/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            // 'Content-Type': 'application/json',
            Authorization: token,
          },
        },
      );
      setIsCreatingObservation(false);
      setShowSelectedObservation(clearSelectedObservation());
      setObservationListCreator([]);
      setObservationList([]);
      await getObservation();
      setShowMap(true);
      setWaitingData(false);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        // text2: 'No se han podido obtener los datos, por favor reinicie la app',
        text2: 'Los campos obligatorios tienen que ser rellenados',
      });
      setWaitingData(false);
      if (error.response) {
        // Se recibió una respuesta del servidor con un código de estado de error

        if (error.response.status === 400) {
          console.log(
            'Error 400: Solicitud incorrecta - La solicitud tiene un formato incorrecto o faltan datos.',
          );
        } else if (error.response.status === 401) {
          console.log(
            'Error 401: No autorizado - La solicitud requiere autenticación.',
          );
        } else if (error.response.status === 403) {
          console.log(
            'Error 403: Prohibido - No tienes permiso para acceder a este recurso.',
          );
        } else if (error.response.status === 404) {
          console.log(
            'Error 404: No encontrado - El recurso solicitado no existe en el servidor.',
          );
        } else {
          console.log(`Error ${error.response.status}: Error en la solicitud.`);
        }

        // Puedes acceder a detalles adicionales de la respuesta del servidor:
        console.log('Mensaje del servidor:', error.response.data);
        console.log('Encabezados de respuesta:', error.response.headers);
      } else if (error.request) {
        // La solicitud se realizó, pero no se recibió una respuesta
        console.log(
          'Error de red: No se pudo recibir una respuesta del servidor.',
        );
      } else {
        // Se produjo un error durante la configuración de la solicitud
        console.log('Error de configuración de la solicitud:', error.message);
      }
    }
  };

  const onDeleteObservation = async () => {
    let token;
    while (!token) {
      token = await AsyncStorage.getItem('token');
    }
    try {
      const marca = await citmapApi.delete(
        `/observations/${showSelectedObservation.id}/`,
        {
          headers: {
            Authorization: token,
          },
        },
      );
      Toast.show({
        type: 'success',
        text1: 'Borrado',
        // text2: 'No se han podido obtener los datos, por favor reinicie la app',
        text2: 'Marca borrada con éxito',
      });
      setIsCreatingObservation(false);
      setShowSelectedObservation(clearSelectedObservation());
      setObservationListCreator([]);
      setObservationList([]);
      await getObservation();
      setShowMap(true);
      setWaitingData(false);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        // text2: 'No se han podido obtener los datos, por favor reinicie la app',
        text2: 'No se pudo borrar la marca',
      });
      setWaitingData(false);
      if (error.response) {
        // Se recibió una respuesta del servidor con un código de estado de error

        if (error.response.status === 400) {
          console.log(
            'Error 400: Solicitud incorrecta - La solicitud tiene un formato incorrecto o faltan datos.',
          );
        } else if (error.response.status === 401) {
          console.log(
            'Error 401: No autorizado - La solicitud requiere autenticación.',
          );
        } else if (error.response.status === 403) {
          console.log(
            'Error 403: Prohibido - No tienes permiso para acceder a este recurso.',
          );
        } else if (error.response.status === 404) {
          console.log(
            'Error 404: No encontrado - El recurso solicitado no existe en el servidor.',
          );
        } else {
          console.log(`Error ${error.response.status}: Error en la solicitud.`);
        }

        // Puedes acceder a detalles adicionales de la respuesta del servidor:
        console.log('Mensaje del servidor:', error.response.data);
        console.log('Encabezados de respuesta:', error.response.headers);
      } else if (error.request) {
        // La solicitud se realizó, pero no se recibió una respuesta
        console.log(
          'Error de red: No se pudo recibir una respuesta del servidor.',
        );
      } else {
        // Se produjo un error durante la configuración de la solicitud
        console.log('Error de configuración de la solicitud:', error.message);
      }
    }
  };

  //#endregion

  //#region BUTTONS
  /**
   * cuando le das al boton para añadir un marcador, se crea por debajo la nueva observation
   * además, se actualizará la lista de observaciones
   */
  const addMarkPlus = () => {
    const coords = initialPositionArray;
    // console.log(JSON.stringify(coords, null, 2));
    //TODO añadir a una nueva lista
    createNewObservation(coords);
    setShowConfirmMark(true);
  };

  const addMarkLongPress = (feature: any) => {
    const coords = feature.geometry.coordinates;
    //TODO añadir a una nueva lista
    createNewObservation(coords);
    setShowConfirmMark(true);
    console.log(onlyRead);
  };

  /**
   * si le da a cancelar, borrará la observation en cuestión
   */
  const cancelCreationObservation = async () => {
    setShowConfirmMark(false);
    setColorMark('#FC5561');
    setIsCreatingObservation(false);
    const token = await AsyncStorage.getItem('token');
    try {
      // Supongamos que newObservationCreate es el objeto que deseas eliminar.
      const observationToRemove = newObservationCreate;

      // Filtra la matriz original de observationListCreator para eliminar observationToRemove.
      const filteredList = observationListCreator.filter(
        observation => observation !== observationToRemove,
      );

      // Establece el nuevo estado de observationListCreator con la matriz filtrada.
      setObservationListCreator(filteredList);
      console.log('marca borrada');
      // console.log(JSON.stringify(marca.data, null, 2));
    } catch (err) {
      console.log('error en borrar');
      console.log(err);
    }
  };

  /**
   * Centra la camara a la posición del usuario. Para eso, hace una llamada al useLocation para rescatar las actuales coordenadas del usuario.
   */
  const centerPosition = async () => {
    // const location = await getCurrentLocation();
    // setFollowUser(true);
    // followView.current = true;
    const posi: Position = [userLocation.longitude, userLocation.latitude];
    cameraRef.current?.flyTo(posi, 200);
    // followView.current = false;
    cameraRef.current?.setCamera({
      centerCoordinate: posi,
      zoomLevel: 16,
    });
  };
  //#endregion

  //#region UPDATE MAP
  const [mapUpdateFlag, setMapUpdateFlag] = useState(true);
  // Ejemplo de cómo actualizar el estado cuando ocurra algún evento
  const updateMap = () => {
    // Realiza las operaciones necesarias...
    // setMapUpdateFlag(prevFlag => !prevFlag); // Cambia el estado para forzar la actualización
    // setObservationList([])
    // setObservationList(observationListcopy)
    // getProjectApi()
    mapViewRef.current?.forceUpdate();
    console.log('entra en el touch end para hacer force update');
  };

  //#endregion

  if (!hasLocation) {
    // return <LoadingScreen />;
    return (
      <View style={{justifyContent: 'center', alignItems: 'center', flex: 1}}>
        <Text
          style={{
            color: Colors.textColorPrimary,
            marginBottom: RFPercentage(3),
          }}>
          Habilita el GPS para poder acceder al mapa
        </Text>
        <TouchableOpacity
          style={{
            minWidth: RFPercentage(8),
            marginBottom: RFPercentage(2),
            marginTop: RFPercentage(2),
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
            elevation: 5,
          }}
          onPress={getCurrentLocation}>
          <Text>Recargar la pantalla</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      {chargedData ? (
        <>
          {showMap ? (
            <View
              style={{flex: 1}}
              onTouchEnd={() => {
                updateMap();
              }}>
              <MapView
                ref={element => (mapViewRef.current = element!)}
                key={mapUpdateFlag ? 'mapUpdate' : 'mapNoUpdate'}
                style={{flex: 1}}
                logoEnabled={false}
                scaleBarEnabled={false}
                compassEnabled={false}
                collapsable={true}
                onTouchStart={() => {
                  setSelectedObservation(clearSelectedObservation());
                  // if (!mapUpdateFlag) setMapUpdateFlag(true);
                }}
                onLongPress={data => {
                  addMarkLongPress(data);
                }}>
                <Camera
                  ref={reference => (cameraRef.current = reference!)}
                  zoomLevel={15}
                  maxZoomLevel={500}
                  centerCoordinate={initialPositionArray}
                  followUserLocation={followView.current}
                  followUserMode={UserTrackingMode.FollowWithHeading}
                  minZoomLevel={8}
                  animationMode="flyTo"
                  animationDuration={1000}
                  allowUpdates={true}
                />
                <Mapbox.UserLocation visible animated />

                <>
                  {observationList.length > 0 &&
                    observationList.map((x, index) => {
                      if (x.geoposition.point) {
                        if (selectedObservation.id !== x.id) {
                          return (
                            // <View key={index}>
                            <MarkerView
                              key={index}
                              coordinate={[
                                x.geoposition.point.latitude,
                                x.geoposition.point.longitude,
                              ]}
                              allowOverlapWithPuck={true}>
                              {/* sustituir esto por una imagen */}
                              <TouchableOpacity
                                // style={{backgroundColor: 'cyan'}}
                                disabled={isCreatingObservation}
                                onPress={() => {
                                  setSelectedObservation(x);
                                  setShowSelectedObservation(x);
                                  // setMapUpdateFlag(false);
                                  // updateMap();
                                  // console.log('aprieta la marca')
                                }}>
                                <View
                                  style={{
                                    alignItems: 'center',
                                    width: RFPercentage(5),
                                    backgroundColor: 'transparent',
                                    height: RFPercentage(6),
                                  }}>
                                  <MarkEnabled
                                    height={RFPercentage(5)}
                                    width={RFPercentage(5)}
                                    fill={colorMark}
                                  />
                                </View>
                              </TouchableOpacity>
                            </MarkerView>
                            // </View>
                          );
                        } else {
                          return <View key={index}></View>;
                        }
                      } else {
                        return <View key={index}></View>;
                      }
                    })}
                </>

                {observationListCreator.length > 0 &&
                  observationListCreator.map((x, index) => {
                    if (x.geoposition) {
                      return (
                        <View key={index}>
                          <MarkerView
                            // coordinate={[-6.300905, 36.53777]}
                            coordinate={parsePoint(x.geoposition)}>
                            <TouchableOpacity
                              onPress={() => console.log('touchable tochable')}>
                              <View
                                style={{
                                  alignItems: 'center',
                                  width: RFPercentage(5),
                                  backgroundColor: 'transparent',
                                  height: RFPercentage(6),
                                }}>
                                <MarkEnabled
                                  height={RFPercentage(5)}
                                  width={RFPercentage(5)}
                                  fill={'#FC5561'}
                                />
                              </View>
                            </TouchableOpacity>
                          </MarkerView>
                        </View>
                      );
                    } else {
                      return <View key={index}></View>;
                    }
                  })}

                {/* CREAR OTRA MARCA CON EL CUADRITO QUE HA PASADO GERMAN PARA QUE ASÍ, ESTE SE MUESTRE EN LA COORDENADA PASADA Y LISTO */}
                {selectedObservation && (
                  <MarkerView
                    coordinate={[
                      selectedObservation.geoposition.point.latitude,
                      selectedObservation.geoposition.point.longitude,
                    ]}>
                    <View
                      style={{
                        alignItems: 'center',
                      }}>
                      <View
                        style={{
                          alignItems: 'center',
                          width: RFPercentage(15),
                          height: RFPercentage(15),
                          backgroundColor: 'transparent',
                          right: RFPercentage(-3),
                          top: RFPercentage(-5.2),
                        }}>
                        <CardMap
                          height={RFPercentage(15)}
                          width={RFPercentage(15)}
                          fill={'blue'}
                        />
                        <View
                          style={{
                            width: '50%',
                            marginHorizontal: RFPercentage(1),
                            marginBottom: RFPercentage(1),
                            zIndex: 999,
                            position: 'absolute',
                            marginTop: RFPercentage(2),
                          }}>
                          <Text
                            style={{
                              color: Colors.textColorPrimary,
                              fontSize: FontSize.fontSizeText13,
                            }}>
                            Marcador Nº {selectedObservation.id}
                          </Text>
                        </View>
                        <View
                          style={{
                            width: '50%',
                            marginHorizontal: RFPercentage(1),
                            marginBottom: RFPercentage(-5),
                            zIndex: 1,
                            position: 'absolute',
                            top: RFPercentage(7.4),
                          }}>
                          <CustomButton
                            fontSize={FontSize.fontSizeText10}
                            height={RFPercentage(3)}
                            onPress={() => {
                              setShowMap(false);
                            }}
                            label="Ver más"
                            backgroundColor={Colors.primaryLigth}
                          />
                        </View>
                      </View>
                    </View>
                  </MarkerView>
                )}
              </MapView>
              {showConfirmMark && (
                <View style={styles.showConfirmMarkStyle}>
                  <View
                    style={{
                      justifyContent: 'space-between',
                      flexDirection: 'row',
                      marginBottom: '10%',
                      marginHorizontal: RFPercentage(4),
                    }}>
                    <View>
                      <Text
                        style={{
                          color: Colors.textColorPrimary,
                          fontSize: FontSize.fontSizeText17,
                        }}>
                        ¿Quieres confirmar el marcador?
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      height: '100%',
                      justifyContent: 'flex-end',
                      marginHorizontal: '4%',
                    }}>
                    <View
                      style={{
                        width: RFPercentage(12),
                        marginHorizontal: RFPercentage(1),
                        bottom: 2,
                      }}>
                      <CustomButton
                        onPress={() => {
                          setShowMap(false), setShowConfirmMark(false);
                          setSelectedObservation(clearSelectedObservation());
                        }}
                        label="Confirmar"
                        backgroundColor={Colors.primaryLigth}
                      />
                    </View>
                    <View
                      style={{
                        width: RFPercentage(12),
                        marginHorizontal: RFPercentage(1),
                        bottom: 2,
                      }}>
                      <CustomButton
                        onPress={() => cancelCreationObservation()}
                        label="Cancelar"
                        fontColor="black"
                        outlineColor="black"
                        backgroundColor={'white'}
                      />
                    </View>
                  </View>
                </View>
              )}
              {/* BUTTONS */}

              {/* PLUS */}
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  right: '2%',
                  bottom: '2%',
                }}
                onPress={() => addMarkPlus()}>
                <Plus height={RFPercentage(10)} />
              </TouchableOpacity>
              {/* BACK */}
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  left: '2%',
                  top: '5%',
                }}
                onPress={() => {
                  navigation.replace('ProjectPage', {id: route.params.id});
                }}>
                <Back height={RFPercentage(6)} />
              </TouchableOpacity>
              {/* COMPASS */}
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  right: '2%',
                  top: '5%',
                }}
                onPress={() => centerPosition()}>
                <Compass height={RFPercentage(6)} />
              </TouchableOpacity>
              {/* CENTER */}
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  right: '2%',
                  top: '12%',
                }}
                onPress={() => centerPosition()}>
                <Target height={RFPercentage(6)} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <HeaderComponent
                title={project!.name}
                onPressLeft={() => {
                  setShowMap(true);
                  cancelCreationObservation();
                  setOnlyRead(false);
                  // setShowConfirmMark(true);
                }}
                rightIcon={false}
              />
              <ScrollView
                contentContainerStyle={{flexGrow: 1}}
                keyboardShouldPersistTaps="handled">
                <View
                  style={{
                    backgroundColor: true ? 'transparent' : 'grey',
                    alignItems: 'center',
                  }}>
                  {questions.map((x, index) => {
                    /**
                     * el primer if es si no hay ninguna observation seleccionada y está creando. Entra a crear
                     * el segundo if es si hay una observation seleccionada, si esta es por parte del creador y si no está creando. Entra a editar
                     * la tercera entra si hay una observation seleccionada, si esta no es por parte del creador y si no está creando. Entra a Ver
                     */
                    if (isCreatingObservation) {
                      return (
                        <View
                          style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          key={index}>
                          <CardAnswerMap
                            obligatory={x.mandatory}
                            question={x}
                            index={index + 1}
                            onChangeText={value =>
                              onChangeText(value, x.id!, x.answer_type)
                            }
                            showModal={value => {
                              if (value) {
                                Toast.show({
                                  type: 'error',
                                  text1: 'Image',
                                  // text2: 'No se han podido obtener los datos, por favor reinicie la app',
                                  text2:
                                    'La imagen pesa demasiado. Peso máximo, 4MB',
                                });
                              }
                            }}
                          />
                        </View>
                      );
                    } else if (
                      userInfo.pk === showSelectedObservation.creator &&
                      !isCreatingObservation
                    ) {
                      let image;
                      let selectedElement;
                      if (showSelectedObservation.images) {
                        image = showSelectedObservation.images.find(
                          img => img.question === x.id,
                        );
                      }
                      if (form.data) {
                        selectedElement = form.data.find(
                          item => item.key === x.id!.toString(),
                        );
                      }

                      const valueToUse = image
                        ? image.image
                        : selectedElement
                        ? selectedElement.value
                        : '';

                      return (
                        <View
                          style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          key={index}>
                          <CardAnswerMap
                            value={
                              valueToUse
                              //: inputValues[x.id!] || ''
                            }
                            onlyRead={false}
                            question={x}
                            index={index + 1}
                            isEditing={true}
                            onChangeText={value =>
                              onChangeText(value, x.id!, x.answer_type)
                            }
                            showModal={value => {
                              if (value) {
                                Toast.show({
                                  type: 'error',
                                  text1: 'Image',
                                  // text2: 'No se han podido obtener los datos, por favor reinicie la app',
                                  text2:
                                    'La imagen pesa demasiado. Peso máximo, 4MB',
                                });
                              }
                            }}
                          />
                        </View>
                      );
                    } else {
                      let image = undefined;
                      let selectedElement;
                      let valueToUse = undefined;

                      //mira de que haya imagenes, si es así, las recorre
                      if (showSelectedObservation.images) {
                        image = showSelectedObservation.images.find(
                          img => img.question === x.id,
                        );
                      }

                      //recorre igualmente el formulario para dejar seleccionado el elemento correspondiente
                      if (form.data) {
                        selectedElement = form.data.find(
                          item => item.key === x.id!.toString(),
                        );

                        //establece el value para usar en las cards
                        valueToUse = selectedElement
                          ? selectedElement.value
                          : '';
                      }
                      /**
                       * si la imagen está definida significa que el elemento es una imagen, se sobreescribe el valuetouse
                       * de esta forma, se enviará el tipo imagen
                       */
                      if (image !== undefined) {
                        valueToUse = image ? image.image : undefined;
                      }
                      console.log(valueToUse);
                      // valueToUse = image
                      //   ? image.image
                      //   : selectedElement
                      //   ? selectedElement.value
                      //   : '';
                      return (
                        <View
                          style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          key={index}>
                          <CardAnswerMap
                            value={valueToUse}
                            onlyRead={true}
                            question={x}
                            index={index + 1}
                            onChangeText={value =>
                              onChangeText(value, x.id!, x.answer_type)
                            }
                            showModal={value => {
                              if (value) {
                                console.log('la imagen pesa demasiado');
                              }
                            }}
                          />
                        </View>
                      );
                    }
                  })}
                  {/* si es igual al creator y no está creando, está editando
                      si es diferente al creador y no está creando, está viendo
                      si no, significa que está creando
                  */}
                  {userInfo.pk === showSelectedObservation.creator &&
                  !isCreatingObservation ? (
                    <>
                      <View
                        style={{
                          width: '70%',
                          marginHorizontal: RFPercentage(1),
                          marginBottom: '5%',
                        }}>
                        <CustomButton
                          disabled={onlyRead}
                          onPress={() => onEditObservation()}
                          label="Guardar"
                          backgroundColor={Colors.primaryLigth}
                        />
                      </View>
                      <View
                        style={{
                          width: '70%',
                          marginHorizontal: RFPercentage(1),
                          marginBottom: '5%',
                        }}>
                        <CustomButton
                          disabled={onlyRead}
                          onPress={() => onDeleteObservation()}
                          label="Borrar marca"
                          backgroundColor={Colors.semanticDangerLight}
                        />
                      </View>
                    </>
                  ) : userInfo.pk !== showSelectedObservation.creator &&
                    !isCreatingObservation ? (
                    <View
                      style={{
                        width: '70%',
                        marginHorizontal: RFPercentage(1),
                        marginBottom: '5%',
                      }}>
                      <CustomButton
                        disabled={true}
                        onPress={() => {
                          // if(onlyRead != true){
                          //   onSaveObservation()
                          // }
                        }}
                        label="Finalizar"
                        backgroundColor={
                          showSelectedObservation.id <= 0
                            ? Colors.primaryLigth
                            : Colors.secondaryBackground
                        }
                      />
                    </View>
                  ) : (
                    <View
                      style={{
                        width: '70%',
                        marginHorizontal: RFPercentage(1),
                        marginBottom: '5%',
                      }}>
                      <CustomButton
                        disabled={false}
                        onPress={() => onSaveObservation()}
                        label="Finalizar"
                        backgroundColor={
                          showSelectedObservation.id <= 0
                            ? Colors.primaryLigth
                            : Colors.secondaryBackground
                        }
                      />
                    </View>
                  )}
                </View>
              </ScrollView>
            </>
          )}
          {/* modales */}
          <View>
            <InfoModalMap
              visible={infoModal}
              hideModal={hideModalInfo}
              onPress={hideModalInfo}
              size={RFPercentage(4)}
              color={Colors.primaryLigth}
              label="¿Como participar y añadir un marcador?"
              subLabel="Si perteneces a una organización existente en Geonity, 
              ponte en contacto con el admin de la organización para que te invite o te añada como integrante.
              "
              subLabel2="Una vez hayas aceptado la solicitud, podrás añadir la organzación a tu biografía."
              helper={false}
            />
          </View>
          {/* <View>
            <SaveProyectModal
              visible={errorValidate}
              hideModal={hideModalCValidate}
              onPress={hideModalCValidate}
              size={RFPercentage(8)}
              color={Colors.semanticWarningDark}
              label="Hay campos obligatorios sin rellenar."
              helper={false}
            />
          </View> */}
          <Toast position="bottom" />
          <Spinner visible={waitingData} />
        </>
      ) : (
        <>
          <Spinner visible={true} />
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  showConfirmMarkStyle: {
    position: 'absolute',
    backgroundColor: 'white',
    height: RFPercentage(20),
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
  },
});
