import React, {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {useLocation} from '../../../hooks/useLocation';
import {LoadingScreen} from '../../../screens/LoadingScreen';
import Mapbox, {AtmosphereLayerStyle, Callout} from '@rnmapbox/maps';
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
import {
  DeleteModal,
  InfoModal,
  InfoModalMap,
  SaveProyectModal,
} from '../../utility/Modals';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors} from '../../../theme/colors';
import Plus from '../../../assets/icons/map/plus-map.svg';
import Compass from '../../../assets/icons/map/Compass.svg';
import CardMap from '../../../assets/icons/map/card-map.svg';
import Info from '../../../assets/icons/map/info-circle.svg';
import Tile from '../../../assets/icons/map/tiles.svg';
import Back from '../../../assets/icons/map/chevron-left-map.svg';
import MarkEnabled from '../../../assets/icons/map/mark-asset.svg';
import MarkDisabled from '../../../assets/icons/map/mark-disabled.svg';
import Target from '../../../assets/icons/map/target-map.svg';
import {StackScreenProps} from '@react-navigation/stack';
import {HeaderComponent} from '../../utility/HeaderComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import citmapApi from '../../../api/citmapApi';
import {
  CreateObservation,
  FieldForm,
  ImageObservation,
  Observation,
  ObservationDataForm,
  ObservationDataFormSend,
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
import {useLanguage} from '../../../hooks/useLanguage';
import {StackParams} from '../../../navigation/MultipleNavigator';
import {Location} from '../../../interfaces/appInterfaces';
import {heightPercentageToDP} from 'react-native-responsive-screen';

// Mapbox.setWellKnownTileServer('mapbox');
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
  const {fontLanguage} = useLanguage();
  const {currentISODateTime} = useDateTime();
  const nav = useNavigation();

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

  const [wantDelete, setWantDelete] = useState(false);
  const showModalDelete = () => setWantDelete(true);
  const hideModalDelete = () => setWantDelete(false);

  //variable empleada para ver si el modal del principio tiene que mostrarse o no
  const [start, setStart] = useState(false);

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
   * lista de observations que van filtradas por el fieldform asociado
   */
  const [observationList, setObservationList] = useState<Observation[]>([]);

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

  // map controll
  const [isCreatingObservation, setIsCreatingObservation] = useState(false);
  const [colorMark, setColorMark] = useState('#FC5561');
  const [showMap, setShowMap] = useState(true);
  const [chargedData, setChargedData] = useState(false);
  const [canSave, setCanSave] = useState(true);
  const [onlyRead, setOnlyRead] = useState(false);

  const [waitingData, setWaitingData] = useState(true);

  const [tile, setTile] = useState('mapbox://styles/mapbox/streets-v12');

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
    showModalAtStart();
    if (route.params.coords) {
      // centerPositionToMark(route.params.coords);
      cameraRef.current?.setCamera({
        centerCoordinate: [
          route.params.coords.latitude,
          route.params.coords.longitude,
        ],
      });
    } else {
      cameraRef.current?.setCamera({
        centerCoordinate: [userLocation.longitude, userLocation.latitude],
      });
    }
    return () => {
      //cancelar el seguimiento
      stopFollowUserLocation();
    };
  }, []);

  /**
   * muestra el modal inicial informativo
   */
  useEffect(() => {
    if (hasLocation) {
      showModalAtStart();
    }
  }, []);

  useEffect(() => {
    if (showSelectedObservation) {
      handleEdit();
    }
  }, [showSelectedObservation]);

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
        text2: fontLanguage.map[0].toast_err_question,
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
    } catch {}
  };

  //#endregion

  //#region METHODS

  /**
   * este metodo coge del almacenamiento el valor para saber si puede mostrar el modal o no
   */
  const showModalAtStart = async () => {
    const canShow = await AsyncStorage.getItem('showmodalmap');
    if (canShow == null) {
      showModalInfo();
    } else if (parseInt(canShow) === 1) {
      showModalInfo();
      setStart(false);
    } else {
      setStart(true);
    }
  };

  /**
   * establece y guarda el muestreo del modal informativo
   */
  const onSetDontShowAgain = async () => {
    let showmodal = start == true ? '1' : '0';
    await AsyncStorage.setItem('showmodalmap', showmodal);
    setStart(!start);
  };

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
          value: value,
          // type: type,
        };

        form.images!.push(newImageObservation);
      }
    } else if (type === 'DATE') {
      let val: Date = value;
      let day = val.getDate(); // Obtiene el día
      let month = val.getMonth() + 1; // Obtiene el mes (agregando 1 porque los meses en JavaScript van de 0 a 11)
      let year = val.getFullYear();
      let formattedDate = `${day}/${month < 10 ? '0' : ''}${month}/${year}`;
      console.log(formattedDate);
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
        existingElement.value = formattedDate;
        existingElement.type = type;
      } else {
        // Si no existe un elemento con la misma clave (id), crea uno nuevo y agrégalo.
        newDataArray.push({
          key: id.toString(),
          value: formattedDate,
          type: type,
        });
      }
      // console.log(JSON.stringify(newDataArray, null, 2));
      // Actualiza form.data con el nuevo array de elementos.
      form.data = newDataArray;
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
        existingElement.type = type;
      } else {
        // Si no existe un elemento con la misma clave (id), crea uno nuevo y agrégalo.
        newDataArray.push({key: id.toString(), value: value, type: type});
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

  /**
   * Valida y guarda una nueva observación
   */
  const onSaveObservation = async () => {
    if (canSave) {
      let validate = true;
      let message = fontLanguage.map[0].toast_err_obligatory_fields;
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
          form.data.map(x => {
            if (x.key === question.id?.toString()) {
              if (x.value === '' || x.value === undefined) {
                validate = false;
              }
            }
          });
        }
      });

      const newFormFiltered = form.data.filter(x => x.value !== '');
      form.data.forEach(x => {
        if (x.type === 'NUM') {
          const numericValue = parseFloat(x.value);
          // Verifica si el valor no está vacío y es un número válido
          if (!isNaN(numericValue)) {
            const value = x.value;
            // Comprobar si hay más de un punto o una coma en el valor
            const commaCount = value.split(',').length - 1;
            const dotCount = value.split('.').length - 1;
            console.log(value);
            if (commaCount <= 1 && dotCount <= 1) {
              const numericValue = parseFloat(value.replace(',', '.')); // Reemplaza la coma por el punto
              if (!isNaN(numericValue)) {
                const decimalCount = (
                  numericValue.toString().split('.')[1] || []
                ).length; // Cuenta el número de cifras decimales
                const roundedValue =
                  decimalCount > 4
                    ? parseFloat(numericValue.toFixed(4))
                    : numericValue; // Redondea solo si hay más de 4 cifras decimales
                const newValue = roundedValue.toString().replace(',', '.'); // Formatea el valor de nuevo con coma como separador decimal
                x.value = newValue; // Actualiza el valor en el objeto original
                console.log(newValue + ' - ' + x.value);
              } else {
                validate = false;
                message = fontLanguage.map[0].toast_err_numeric_fields; // Asigna el mensaje de error
              }
            }
          } else {
            validate = false;
            message = fontLanguage.map[0].toast_err_numeric_fields; // Si no se pudo convertir, asignamos el mensaje de error
          }
        }
      });

      const newFormToSend: ObservationDataForm[] = [];

      // form.data.forEach(x => {
      //   let newData: ObservationDataFormSend | null = null;
      //   if (x.value.trim() !== '') {
      //     if (x.type === 'NUM') {
      //       const numericValue = parseFloat(x.value);
      //       if (!isNaN(numericValue)) {
      //         newData = {
      //           key: x.key,
      //           value: numericValue,
      //         };
      //       }
      //     } else {
      //       newData = {
      //         key: x.key,
      //         value: x.value,
      //       };
      //     }

      //     if (newData !== null) {
      //       newFormToSend.push(newData);
      //     }
      //   }
      // });

      form.data.forEach(x => {
        if (x.value.trim() !== '') {
          // Verifica si el valor no está vacío
          const newData: ObservationDataForm = {
            key: x.key,
            value: x.value,
          };

          newFormToSend.push(newData);
        }
      });

      if (validate) {
        formData.append('data', JSON.stringify(newFormToSend));
      }

      if (form.images) {
        form.images.forEach(image => {
          if (image.key !== undefined)
            formData.append(image.key.toString(), image.value);
        });
      }

      console.log(JSON.stringify(newFormToSend, null, 2));
      console.log(JSON.stringify(formData, null, 2));
      // console.log(JSON.stringify(form.images, null, 2));

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
            text2: message,
          });
        }

        setWaitingData(false);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          // text2: 'No se han podido obtener los datos, por favor reinicie la app',
          text2: message,
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

  /**
   * Valida y edita una observación
   */
  const onEditObservation = async () => {
    setWaitingData(true);
    const token = await AsyncStorage.getItem('token');
    setColorMark('#FC5561');
    const formData = new FormData();
    let message = fontLanguage.map[0].toast_err_obligatory_fields;
    let validate = true;
    // Agregar los campos a FormData
    formData.append('creator', userInfo.pk);
    formData.append('field_form', fieldForm.id);
    formData.append('timestamp', currentISODateTime);
    formData.append('geoposition', form.geoposition);

    /**
     * este data hay que revisar primero si hay comas "," y sustituir por puntos "."
     */
    if (form.data) {
      form.data.forEach(x => {
        console.log(x.value);
        if (x.type === 'NUM') {
          const numericValue = parseFloat(x.value);
          // Verifica si el valor no está vacío y es un número válido
          if (!isNaN(numericValue)) {
            const value = x.value;
            // Comprobar si hay más de un punto o una coma en el valor
            const commaCount = value.split(',').length - 1;
            const dotCount = value.split('.').length - 1;
            // console.log(value);
            if (commaCount <= 1 && dotCount <= 1) {
              const numericValue = parseFloat(value.replace(',', '.')); // Reemplaza la coma por el punto
              if (!isNaN(numericValue)) {
                const decimalCount = (
                  numericValue.toString().split('.')[1] || []
                ).length; // Cuenta el número de cifras decimales
                const roundedValue =
                  decimalCount > 4
                    ? parseFloat(numericValue.toFixed(4))
                    : numericValue; // Redondea solo si hay más de 4 cifras decimales
                const newValue = roundedValue.toString().replace(',', '.'); // Formatea el valor de nuevo con coma como separador decimal
                x.value = newValue; // Actualiza el valor en el objeto original
                console.log(newValue + ' - ' + x.value);
              } else {
                validate = false;
                message = fontLanguage.map[0].toast_err_numeric_fields; // Asigna el mensaje de error
              }
            }
          } else {
            validate = false;
            message = fontLanguage.map[0].toast_err_numeric_fields; // Si no se pudo convertir, asignamos el mensaje de error
          }
        }
      });
      console.log(validate);
      if (validate) {
        formData.append('data', JSON.stringify(form.data));
      }
    }

    if (form.images) {
      form.images.forEach(image => {
        if (image.key !== undefined)
          formData.append(image.key.toString(), image.value);
      });
    }
    try {
      if (validate) {
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
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          // text2: 'No se han podido obtener los datos, por favor reinicie la app',
          text2: message,
        });
      }
      setWaitingData(false);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        // text2: 'No se han podido obtener los datos, por favor reinicie la app',
        text2: message,
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
    } finally {
      setWaitingData(false);
    }
  };

  /**
   * Borra una observación propia
   */
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
        text2: fontLanguage.map[0].delete_observation,
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
        text2: fontLanguage.map[0].not_delete_observation,
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
    createNewObservation(coords);
    setShowConfirmMark(true);
  };

  const addMarkLongPress = (feature: any) => {
    const coords = feature.geometry.coordinates;
    createNewObservation(coords);
    setShowConfirmMark(true);
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

  const centerPositionToMark = async (location: Location) => {
    // const location = await getCurrentLocation();
    // setFollowUser(true);
    // followView.current = true;
    const posi: Position = [location.longitude, location.latitude];
    cameraRef.current?.flyTo(posi, 200);
    // followView.current = false;
    cameraRef.current?.setCamera({
      centerCoordinate: posi,
      zoomLevel: 16,
    });
  };

  /**
   * cambia el tileset del mapa, variando entre vistas
   */
  const changeTile = () => {
    if (tile === 'mapbox://styles/mapbox/streets-v12') {
      setTile('mapbox://styles/mapbox/satellite-streets-v12');
    } else {
      setTile('mapbox://styles/mapbox/streets-v12');
    }
  };

  //#endregion

  //#region UPDATE MAP
  const [mapUpdateFlag, setMapUpdateFlag] = useState(true);

  // Ejemplo de cómo actualizar el estado cuando ocurra algún evento
  const updateMap = () => {
    mapViewRef.current?.forceUpdate();
  };

  //#endregion

  //#region  METODOS CLUSTERING

  //#endregion

  return (
    <>
      {hasLocation ? (
        <>
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
                      styleURL={tile} //streets-v12 es el normal
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
                      {/* <Mapbox.Atmosphere style={terrainStyles.AtmosphereLayerStyle}/> */}
                      <Camera
                        ref={reference => (cameraRef.current = reference!)}
                        zoomLevel={15}
                        maxZoomLevel={2000}
                        followZoomLevel={2000}
                        centerCoordinate={
                          route.params.coords
                            ? [
                                route.params.coords.latitude,
                                route.params.coords.longitude,
                              ]
                            : initialPositionArray
                        }
                        followUserLocation={followView.current}
                        followUserMode={UserTrackingMode.FollowWithHeading}
                        minZoomLevel={4}
                        animationMode="flyTo"
                        animationDuration={1000}
                        allowUpdates={true}
                      />
                      <Mapbox.UserLocation visible animated />
                      {/* <Clusterer
                        data={retPoints()}
                        region={region}
                        options={DEFAULT_OPTIONS}
                        mapDimensions={MAP_DIMENSIONS} renderItem={function (item: supercluster.PointOrClusterFeature<supercluster.AnyProps, supercluster.AnyProps>, index: number, array: supercluster.PointOrClusterFeature<supercluster.AnyProps, supercluster.AnyProps>[]): React.ReactElement<any, string | React.JSXElementConstructor<any>> {
                          throw new Error('Function not implemented.');
                        } }                      /> */}
                      {observationList.length > 0 &&
                        observationList.map((x, index) => {
                          if (x.geoposition.point) {
                            if (selectedObservation.id !== x.id) {
                              return (
                                // <View key={index}>
                                <MarkerView
                                  key={index}
                                  // coordinate={[-6.300905, 36.53777]}
                                  onTouchStart={() =>
                                    console.log('aprieta la marca')
                                  }
                                  coordinate={[
                                    x.geoposition.point.latitude,
                                    x.geoposition.point.longitude,
                                  ]}>
                                  {/* sustituir esto por una imagen */}
                                  <TouchableOpacity
                                    // style={{backgroundColor: 'cyan'}}
                                    disabled={isCreatingObservation}
                                    onPress={() => {
                                      setSelectedObservation(x);
                                      setShowSelectedObservation(x);
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
                      {observationListCreator.length > 0 &&
                        observationListCreator.map((x, index) => {
                          console.log(x.geoposition);
                          if (x.geoposition) {
                            return (
                              <View key={index}>
                                <MarkerView
                                  // coordinate={[-6.300905, 36.53777]}
                                  coordinate={parsePoint(x.geoposition)}>
                                  <TouchableOpacity
                                    onPress={() =>
                                      console.log('touchable tochable')
                                    }>
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
                          // coordinate={[-6.300905, 36.53777]}
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
                                width: RFPercentage(25),
                                height: RFPercentage(25),
                                backgroundColor: 'transparent',
                                right: RFPercentage(-3),
                                top: RFPercentage(0),
                              }}>
                              <CardMap
                                height={RFPercentage(15)}
                                width={RFPercentage(15)}
                                fill={'blue'}
                              />
                              <View
                                style={{
                                  width: '30%',
                                  marginHorizontal: RFPercentage(1),
                                  marginBottom: RFPercentage(-5),
                                  zIndex: 999,
                                  position: 'absolute',
                                  top: RFPercentage(2),
                                }}>
                                <Text
                                  style={{
                                    color: Colors.textColorPrimary,
                                    fontSize: FontSize.fontSizeText13,
                                  }}>
                                  {fontLanguage.map[0].number_mark}{' '}
                                  {selectedObservation.id}
                                </Text>
                              </View>
                              <View
                                style={{
                                  width: '35%',
                                  marginHorizontal: RFPercentage(1),
                                  marginBottom: RFPercentage(-5),
                                  zIndex: 999,
                                  position: 'absolute',
                                  top: RFPercentage(7.4),
                                }}>
                                <CustomButton
                                  fontSize={FontSize.fontSizeText10}
                                  height={RFPercentage(3)}
                                  onPress={() => {
                                    setShowMap(false);
                                    console.log(JSON.stringify(form, null, 2));
                                  }}
                                  label={fontLanguage.map[0].show_more}
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
                              {fontLanguage.map[0].want_to_confirm}
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

                                setSelectedObservation(
                                  clearSelectedObservation(),
                                );
                              }}
                              label={fontLanguage.global[0].confirm_button}
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
                              label={fontLanguage.global[0].cancel_button}
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
                        if (route.params.coords) {
                          navigation.goBack();
                        } else {
                          navigation.navigate('ProjectPage', {
                            id: route.params.id,
                          });
                        }
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
                    {/* INFO */}
                    <TouchableOpacity
                      style={{
                        position: 'absolute',
                        right: '4%',
                        top: '19%',
                      }}
                      onPress={() => showModalInfo()}>
                      <Info width={RFPercentage(4)} height={RFPercentage(4)} />
                    </TouchableOpacity>
                    {/* TILE */}
                    <TouchableOpacity
                      style={{
                        position: 'absolute',
                        right: '3%',
                        top: '25%',
                        backgroundColor: 'white',
                        borderRadius: 50,
                        padding: '1%',
                        alignContent: 'center',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={() => changeTile()}>
                      <Tile width={RFPercentage(4)} height={RFPercentage(4)} />
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
                    <ScrollView contentContainerStyle={{flexGrow: 1}}>
                      <View
                        style={{
                          backgroundColor: true ? 'transparent' : 'grey',
                          alignItems: 'center',
                          marginBottom: heightPercentageToDP(20),
                          marginTop: '7%',
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
                                          fontLanguage.map[0].mark.image_weight,
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
                                      console.log('la imagen pesa demasiado');
                                    }
                                  }}
                                />
                              </View>
                            );
                          } else {
                            let image = [];
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
                                label={fontLanguage.map[0].mark.save}
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
                                onPress={() => showModalDelete()}
                                label={fontLanguage.map[0].mark.delete}
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
                              label={fontLanguage.map[0].mark.finish}
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
                              label={fontLanguage.map[0].mark.finish}
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
                    label={fontLanguage.map[0].modal.info_label}
                    subLabel={fontLanguage.map[0].modal.info_sublabel}
                    subLabel2={fontLanguage.map[0].modal.info_sublabel2}
                    isChecked={start}
                    onPressDontShowAgain={() => {
                      onSetDontShowAgain();
                    }}
                    helper={false}
                  />
                  <DeleteModal
                    visible={wantDelete}
                    hideModal={hideModalDelete}
                    onPress={() => {
                      onDeleteObservation();
                      hideModalDelete();
                    }}
                    label={fontLanguage.map[0].modal.delete_label}
                  />
                </View>
                <Toast position="bottom" />
                <Spinner visible={waitingData} />
              </>
            ) : (
              <>
                <Spinner visible={true} />
              </>
            )}
          </>
        </>
      ) : (
        <>
          {!loading ? (
            <LoadingScreen />
          ) : (
            <>
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  flex: 1,
                }}>
                <Text
                  style={{
                    color: Colors.textColorPrimary,
                    marginBottom: RFPercentage(3),
                  }}>
                  {fontLanguage.map[0].enable_gps}
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
                  <Text>{fontLanguage.map[0].recharge_screen}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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

