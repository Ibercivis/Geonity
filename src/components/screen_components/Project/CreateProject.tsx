import React, {useEffect, useRef, useState} from 'react';
import {HeaderComponent} from '../../utility/HeaderComponent';
import {StackScreenProps} from '@react-navigation/stack';
import {
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {Colors} from '../../../theme/colors';
import {StackParams} from '../../../navigation/MultipleNavigator';
import {CustomButton} from '../../utility/CustomButton';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {InputText} from '../../utility/InputText';
import {Topic} from '../../../interfaces/appInterfaces';
import {
  Organization,
  Project,
  Question,
  FieldForm,
  User,
  CreateFieldForm,
  ShowProject,
  UserInfo,
} from '../../../interfaces/interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import citmapApi, {imageUrl} from '../../../api/citmapApi';
import {Checkbox, IconButton, Switch} from 'react-native-paper';
import Hashtag from '../../../assets/icons/general/Hashtag.svg';
import {FontFamily, FontSize} from '../../../theme/fonts';
import {Size} from '../../../theme/size';
import ImagePicker from 'react-native-image-crop-picker';
import {GeometryForms} from '../../utility/GeometryForms';
import PlusSquare from '../../../assets/icons/general/plus-square.svg';
import FrontPage from '../../../assets/icons/project/image.svg';
import PlusImg from '../../../assets/icons/general/Plus-img.svg';
import PlusBlue from '../../../assets/icons/project/plus-circle-blue.svg';
import UserMissing from '../../../assets/icons/profile/User-image.svg';
import Delete from '../../../assets/icons/project/trash.svg';
import {QuestionCard} from '../../utility/QuestionCard';
import {IconTemp} from '../../utility/IconTemp';
import {useForm} from '../../../hooks/useForm';
import {
  DeleteModal,
  InfoModal,
  ProyectGuideModal,
  SaveProyectModal,
} from '../../utility/Modals';
import {CommonActions} from '@react-navigation/native';
import {Spinner} from '../../utility/Spinner';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import Toast from 'react-native-toast-message';
import {useLanguage} from '../../../hooks/useLanguage';

interface Props extends StackScreenProps<StackParams, 'CreateProject'> {}

export const CreateProject = ({navigation, route}: Props) => {
  const {fontLanguage} = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [isEdit, setIsEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const totalSteps = 3;
  const MAX_CHARACTERS = 1000;
  const {fontScale} = useWindowDimensions();
  const {form, onChange} = useForm<Project>({
    hasTag: [],
    topic: [],
    organizations_write: [],
    creator: 0,
    administrators: [],
    name: '',
    description: '',
    field_form: {
      id: 0,
      project: 0,
      questions: [],
    },
    is_private: false,
    raw_password: '',
  });
  const [waitingData, setWaitingData] = useState(false);

  //#region FIRST
  const [categoryList, setCategoryList] = useState<Topic[]>([]);
  const [userCategories, setUserCategories] = useState<Topic[]>([]);
  const [organizationList, setOrganizationList] = useState<Organization[]>([]);
  const [showCategoryList, setShowCategoryList] = useState(false); //boolean que controla que se pueda ver la lista de categorias
  const [inputValueOrganization, setInputValueOrganization] = useState(''); //para buscar organizacion
  const [suggestionsSelected, setSuggestionsSelected] = useState<
    Organization[]
  >([]); //las organizaciones seleccionadas
  const [suggestions, setSuggestions] = useState<Organization[]>([]); //las organizaciones sugeridas

  // variables que controlan las imagenes
  const [images, setImages] = useState<any[]>([]);
  const [imagesCharged, setImagesCharged] = useState<any[]>([]);
  const [isImageCarged, setIsImageCarged] = useState<boolean>(false);
  const [imageBlob, setImageBlob] = useState<any[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  //modales informativos
  const [infoModal, setInfoModal] = useState(false);
  const showModalInfo = () => setInfoModal(true);
  const hideModalInfo = () => setInfoModal(false);

  const [guideModal, setGuideModal] = useState(false);
  const showModalGuide = () => setGuideModal(true);
  const hideModalGuide = () => {
    setGuideModal(false);
    onSetDontShowAgain();
  };

  //controla el estado del scroll
  const scrollViewRef = useRef<ScrollView | null>(null);

  /**
   * validación primera pantalla
   */
  const [nameValidate, setNameValidate] = useState(true);
  const [descriptionValidate, setDescriptionValidate] = useState(true);

  //#endregion

  //#region SECOND
  const [isSwitchOnCreator, setIsSwitchOnCreator] = useState(false);
  const [isSwitchOnDataBaseProject, setIsSwitchOnDataBaseProject] =
    useState(false);
  const [errPass, setErrPass] = useState(true);
  const [isSwitchOnProject, setIsSwitchOnProject] = useState(false);
  const [rawPassword, setRawPassword] = useState('');
  const [rawPassword2, setRawPassword2] = useState('');

  const [errorPass, setErrorPass] = useState(false);
  const showModalErrorPass = () => setErrorPass(true);
  const hideModalErrorPass = () => setErrorPass(false);

  useEffect(() => {
    onChange(isSwitchOnProject, 'is_private');
  }, [isSwitchOnProject]);

  //#endregion

  //#region  THIRD
  const [questions, setQuestions] = useState<Question[]>([
    {question_text: '', answer_type: 'STR', mandatory: false},
  ]);

  /**
   * BOOLEAN que controla si se muestra o no el modal
   */
  const [showAnswerTypeList, setShowAnswerTypeList] = useState(false);

  /**
   *  index de la card que está seleccionada
   */
  const [isSelectedCardAnswer, setIsSelectedCardAnswer] = useState(-1);

  /**
   * OBJETO de tipo Question. Es el seleccionado
   */
  const [selectedQuestion, setSelectedQuestion] = useState<Question>({
    question_text: '',
    answer_type: '',
  });
  /**
   * contiene el index del "tipo de respuesta" seleccionado
   */
  const [responseSelected, setResponseSelected] = useState(-1);

  /**
   * Elementos del modal
   */
  const [saveModal, setSaveModal] = useState(false);
  const showModalSave = () => setSaveModal(true);
  const hideModalSave = () => setSaveModal(false);
  const [deleteModal, setDelete] = useState(false);
  const showModalDelete = () => setDelete(true);
  const hideModalDelete = () => setDelete(false);
  // const { modalVisible, setModalVisible, changeVisibility} = useModal();

  /**
   * validación
   */
  const [obligatorioIdList, setObligatorioIdList] = useState<boolean[]>([]);

  const answerType = [
    // {id: 1, type: 'STR', name: 'Ubicación', icon: 'map-marker'},
    // {id: 2, type: 'STR', name: 'Respuesta corta', icon: 'text'},
    // {id: 3, type: 'STR', name: 'Respuesta larga', icon: 'text-long'},
    // {id: 4, type: 'STR', name: 'Única opción', icon: 'format-list-numbered'},
    // {id: 5, type: 'STR', name: 'Varias opciones', icon: 'format-list-bulleted'},
    // {id: 6, type: 'NUM', name: 'Escala lineal', icon: 'tune'},
    // {id: 7, type: 'IMG', name: 'Foto', icon: 'camera-outline'},
    // {id: 8, type: 'STR', name: 'Fecha', icon: 'calendar-range'},
    // {id: 9, type: 'STR', name: 'Hora', icon: 'clock-time-four-outline'},
    {
      id: 10,
      type: 'STR',
      name: fontLanguage.question_card[0].text_type,
      icon: 'text',
    },
    {
      id: 11,
      type: 'NUM',
      name: fontLanguage.question_card[0].number_type,
      icon: 'numeric',
    },
    {
      id: 12,
      type: 'IMG',
      name: fontLanguage.question_card[0].image_type,
      icon: 'camera-outline',
    },
    {
      id: 13,
      type: 'DATE',
      name: fontLanguage.question_card[0].date_time,
      icon: 'camera-outline',
    },
  ];

  //#endregion

  useEffect(() => {
    showModalAtStart();
    categoryListApi();
  }, []);

  /**
   * está puesto aquí para que entre solo cuando la organizationList haya cargado
   */
  useEffect(() => {
    if (route.params) {
      if (route.params.id) {
        setIsEdit(true);
        getProjectApi();
      }
    } else setWaitingData(false);
  }, [organizationList]);

  useEffect(() => {
    if (inputValueOrganization.length <= 0) {
      clearSuggestions();
    }
  }, [inputValueOrganization]);

  useEffect(() => {
    // console.log(JSON.stringify(images));
  }, [images]);

  useEffect(() => {
    let count = 0;

    if (suggestions.length == 1) {
      // count = (suggestions.length - 1) * 12;
      count = suggestions.length * 14;
    } else if (suggestions.length === 2) {
      count = 24;
    } else if (suggestions.length >= 3) {
      count = 34;
      // count = (suggestions.length - 1) * 12;
    } else {
      // count = suggestions.length * 12;
      count = 34;
    }
    count += RFPercentage(5);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({y: RFPercentage(count), animated: true});
    }
  }, [suggestions]);

  //#region CONTROLAR STEPPER
  //cada vez que le das a next, hace una validación
  const handleNextStep = () => {
    // valida, si está todo ok, pasa
    let isValid = true;

    switch (currentStep) {
      case 1: // en la primera pantalla valida el nombre, descripción, si hay categorias y las organizaciones vinculadas
        const idsCategory = userCategories.map(x => x.id);
        const idsOrganization = suggestionsSelected.map(x => x.id);

        if (idsCategory.length <= 0) {
          form.topic = [];
        } else {
          form.topic = idsCategory;
        }

        if (idsOrganization.length <= 0) {
          form.organizations_write = [];
        } else {
          form.organizations_write = idsOrganization;
        }

        if (form.name.length <= 0) {
          isValid = false;
          setNameValidate(false);
        }
        if (
          form.description.length <= 0 ||
          form.description.length > MAX_CHARACTERS
        ) {
          isValid = false;
          setDescriptionValidate(false);
        }
        break;
      case 2:
        if (!errPass) {
          showModalErrorPass();
          isValid = false;
        }
        if (rawPassword.length > 0 && rawPassword2.length <= 0) {
          showModalErrorPass();
          isValid = false;
        }
        if (rawPassword2.length > 0 && rawPassword.length <= 0) {
          showModalErrorPass();
          isValid = false;
        }
        break;
      case 3:
        break;
    }

    if (isValid) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // hay que controlar cuando se vuelve atrás que los datos del onChange que se modifiquen en handleNextStep estén vacíos de nuevo
  const handlePrevStep = () => {
    onChange([], 'hasTag');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  //#endregion

  //#region API CALLS
  const categoryListApi = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await citmapApi.get<Topic[]>('/project/topics/', {
        headers: {
          Authorization: token,
        },
      });
      setCategoryList(resp.data);
      resp.data.map(x => {
        if (userCategories.includes(x)) {
          setUserCategories(
            userCategories.filter(selectedItem => selectedItem !== x),
          );
        }
      });
      organizationListApi();
    } catch {}
  };

  const organizationListApi = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await citmapApi.get<Organization[]>('/organization/', {
        headers: {
          Authorization: token,
        },
      });
      setOrganizationList(resp.data);
    } catch {}
  };

  const getProjectApi = async () => {
    // setUserCategories([]);
    // setSuggestionsSelected([]);
    setWaitingData(true);
    setQuestions([]);
    setImagesCharged([]);
    let token;

    while (!token) {
      token = await AsyncStorage.getItem('token');
    }
    try {
      const resp = await citmapApi.get<ShowProject>(
        `/project/${route.params.id}`,
        {
          headers: {
            Authorization: token,
          },
        },
      );
      form.name = resp.data.name;
      form.administrators = resp.data.administrators;
      form.creator = resp.data.creator;
      form.description = resp.data.description;
      form.is_private = resp.data.is_private;

      if (resp.data.is_private != undefined) {
        setIsSwitchOnProject(resp.data.is_private);
        // form.raw_password = resp.data.raw_password;
      }
      form.hasTag = resp.data.hasTag;
      form.topic = resp.data.topic;

      if (form.topic.length > 0) {
        // Crear un conjunto temporal para almacenar las categorías únicas a agregar
        const uniqueCategoriesToAdd = new Set(userCategories);

        form.topic.forEach(idTopic => {
          const topic = categoryList.find(x => x.id === idTopic);
          if (
            topic &&
            !userCategories.some(category => category.id === topic.id)
          ) {
            uniqueCategoriesToAdd.add(topic);
            setCheckCategories(topic);
            console.log('coincide: ' + JSON.stringify(topic));
          }
        });

        // Actualizar el estado userCategories con las categorías únicas
        setUserCategories([...uniqueCategoriesToAdd]);
      }

      // form.organizations_write = resp.data.organizations_write;
      if (resp.data.organizations.length > 0) {
        resp.data.organizations.forEach(id => {
          const sugg = organizationList.find(x => x.id === id.id);
          if (
            sugg &&
            !suggestionsSelected.some(selectedOrg => selectedOrg.id === sugg.id)
          ) {
            setSuggestionsSelected([...suggestionsSelected, sugg]);
          }
        });
      }

      const dataField = await citmapApi.get<FieldForm[]>(`/field_forms/`, {
        headers: {
          Authorization: token,
        },
      });
      const fieldform = dataField.data.find(x => x.project === route.params.id);
      console.log(JSON.stringify(dataField.data, null, 2));
      console.log(route.params.id);
      if (fieldform) {
        form.field_form = fieldform;
        setQuestions(fieldform.questions);
      }

      form.id = resp.data.id;

      // form.cover = resp.data.cover;
      if (resp.data.cover != undefined) {
        setImagesCharged(resp.data.cover);
      }

      const userInfo = await citmapApi.get<User>(
        '/users/authentication/user/',
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
      //pequeña comprobación de si está editando el admin o el creator
      let isAdmin = resp.data.administrators.find(x => x === userInfo.data.pk);
      //si es creator, puede borrar
      if (
        userInfo.data != undefined &&
        userInfo.data.pk === resp.data.creator
      ) {
        setCanDelete(true);
      }
      // si es admin puede editar pero no borrar
      if (isAdmin !== undefined) {
        setCanDelete(false);
      }

      setWaitingData(false);
    } catch (err) {
      console.log('hay un error: ' + err);
    }
  };
  //#endregion

  //#region METHODS

  //#region GUIDE CONTROL

  /**
   * este metodo coge del almacenamiento el valor para saber si puede mostrar el modal o no
   * Si el valor no existe o es 1, significa que entra por primera vez y habrá de mostrarse
   */
  const showModalAtStart = async () => {
    const canShow = await AsyncStorage.getItem('infoproyect');
    console.log(canShow);
    if (canShow == null) {
      showModalGuide();
    } else if (parseInt(canShow) === 1) {
      showModalGuide();
    } else {
      setGuideModal(false);
    }
  };

  /**
   * establece y guarda el muestreo del modal onboarding
   */
  const onSetDontShowAgain = async () => {
    let showmodal = '0';
    await AsyncStorage.setItem('infoproyect', showmodal);
  };

  //#endregion

  //#region FIRST

  /**
   * Comprueba si existen categorias preestablecidas. Sirve para controlar los check y saber qué categorias están
   * seleccionadas
   * @param item categoria
   */
  const setCheckCategories = (item: Topic) => {
    Keyboard.dismiss();
    // Verificar si el elemento ya está seleccionado
    if (userCategories.includes(item)) {
      setUserCategories(
        userCategories.filter(selectedItem => selectedItem !== item),
      );
    } else {
      setUserCategories([...userCategories, item]);
    }
  };

  const handleInputChangeOrganization = (text: string) => {
    setInputValueOrganization(text);
    setSuggestions(
      organizationList.filter(suggestion =>
        suggestion.principalName
          .toLocaleLowerCase()
          .includes(text.toLowerCase()),
      ),
    );
  };

  /**
   * Carga segun lo que se escribe en el input, las diferentes organizaciones
   * @param suggestion organización
   * @returns
   */
  const handleSuggestionPress = (suggestion: Organization) => {
    // Keyboard.dismiss();
    if (suggestionsSelected.includes(suggestion)) {
      return;
    }

    // Crea una nueva lista de sugerencias excluyendo selected
    const newSuggestions = suggestions.filter(item => item !== suggestion);
    // const newSuggestions = suggestions.splice(index, 1);

    // Establece la nueva lista de sugerencias como estado
    setSuggestions(newSuggestions);

    // Agrega el elemento a suggestionsSelected
    setSuggestionsSelected([...suggestionsSelected, suggestion]);

    setInputValueOrganization('');
  };

  /**
   * Elimina de la lista de organizaciones.
   * Una vez hecho, le pasa ese usuario de nuevo a la lista de busqueda
   * @param item UserInfo a borrar de la lista
   * @returns
   */
  const moveItemToSuggestions = (index: number) => {
    if (index < 0 || index >= suggestionsSelected.length) {
      return; // Verifica si el índice está dentro de los límites válidos
    }

    // Obtiene el elemento a mover de suggestionsSelected
    const itemToMove = suggestionsSelected[index];

    // si existe, le hace el slice
    if (!itemToMove) {
      return;
    }
    const newSugSelected = suggestionsSelected.filter((x, i) => i !== index);

    setSuggestionsSelected(newSugSelected);
    //si lo incluye, no se copia, sino si
    if (suggestions.includes(itemToMove)) {
      return;
    }

    // Agrega el elemento a suggestions
    // setSuggestions([...suggestions, itemToMove]);
  };

  const clearSuggestions = () => {
    setSuggestions([]);
  };

  const selectImage = () => {
    setImageBlob([]);
    setImages([]);
    ImagePicker.openPicker({
      mediaType: 'photo',
      multiple: true,
      quality: 1,
      maxWidth: 300,
      maxHeight: 300,
      includeBase64: true,
    })
      .then(response => {
        const numOfImages = response.length;
        if (response && numOfImages > 0) {
          if (response[0].size < 4 * 1024 * 1024) {
            for (let i = 0; i <= numOfImages; i++) {
              const newImage = response[i];
              if (newImage) {
                setImagesCharged([]);
                setImages(prevImages => [...prevImages, newImage]);
                setImageBlob(prevImageBlob => [
                  ...prevImageBlob,
                  {
                    uri: newImage.path,
                    type: newImage.mime,
                    name: i + 'cover.jpg',
                  },
                ]);
              }
            }
            setActiveImageIndex(0);
            setIsImageCarged(true);
          } else {
            Toast.show({
              type: 'error',
              text1: 'Image',
              // text2: 'No se han podido obtener los datos, por favor reinicie la app',
              text2: fontLanguage.create_project[0].first_screen.image_weight,
            });
          }
        }
      })
      .catch(err => {
        Toast.show({
          type: 'info',
          text1: 'Image',
          // text2: 'No se han podido obtener los datos, por favor reinicie la app',
          text2: fontLanguage.create_project[0].first_screen.image_not_selected,
        });
      });
  };

  //#endregion

  //#region SECOND
  const onToggleSwitchCreator = () => setIsSwitchOnCreator(!isSwitchOnCreator);
  const onToggleSwitchDataBaseProject = () =>
    setIsSwitchOnDataBaseProject(!isSwitchOnDataBaseProject);
  const onToggleSwitchProject = () => {
    setIsSwitchOnProject(!isSwitchOnProject);
  };

  const validatePassword = (value: any) => {
    setRawPassword2(value);
    if (value === rawPassword) {
      onChange(value, 'raw_password');
      setErrPass(true);
    } else {
      setErrPass(false);
    }
  };
  //#endregion

  //#region THIRD

  /**
   * Sirve para seleccionar una card
   * tiene que guardar el index que pertenece al answerType
   * @param i index de las cards para seleccionar una
   * @param  index de las cards para seleccionar una
   */
  const onSelectedCard = (i: number, item: Question) => {
    setIsSelectedCardAnswer(i);
    const indiceAmswerType = knowAnswerType(item);
    setResponseSelected(indiceAmswerType);
    setSelectedQuestion(item);
  };

  const onResponseSelected = (response: number) => {
    setResponseSelected(response);
  };

  const createAnswer = () => {
    setQuestions([
      ...questions,
      {question_text: '', answer_type: '', mandatory: false},
    ]);
  };

  const onDelete = (item: Question) => {
    const arrayCopy = [...questions];
    const index = questions.indexOf(item);
    if (index !== -1) {
      arrayCopy.splice(index, 1);
      setQuestions(arrayCopy);
    }
  };

  const duplicate = (item: Question) => {
    const newItem: Question = {
      answer_type: item.answer_type,
      question_text: item.question_text,
      mandatory: item.mandatory,
    };
    setQuestions([...questions, newItem]);
  };

  /**
   * guarda el indice de la card
   * @param index indice
   */
  const onEditResponseType = (index: number, item: Question) => {
    onSelectedCard(index, item);
    setShowAnswerTypeList(true);
  };

  /**
   *  funciona por dentro
   * @param x id del asnwerType
   */
  const onSelectResponseTypeModal = (type: string, index: number) => {
    setQuestions(prevQuestions => {
      return prevQuestions.map((question, i) => {
        if (question === selectedQuestion) {
          return {...selectedQuestion, ['answer_type']: type};
        }
        return question;
      });
    });
  };

  /**
   * Metodo para guardar el proyecto
   */
  const showData = async () => {
    setWaitingData(true);
    let correct = true;
    let token;
    while (!token) {
      token = await AsyncStorage.getItem('token');
    }
    let updatedForm = {...form};

    const updatedQuestions = [...questions];
    // console.log(updatedQuestions)
    updatedQuestions.map(x => {
      if (x.question_text.length <= 0) {
        correct = false;
      }
    });
    let newFieldForm: CreateFieldForm = {
      questions: updatedQuestions,
    };
    console.log(JSON.stringify(newFieldForm, null, 2));
    // updatedForm.field_form.questions = updatedQuestions;
    onChange(newFieldForm, 'field_form');
    updatedForm = form;
    console.log(JSON.stringify(updatedForm.field_form, null, 2));

    try {
      const userInfo = await citmapApi.get<User>(
        '/users/authentication/user/',
        {
          headers: {
            Authorization: token,
          },
        },
      );
      updatedForm.creator = userInfo.data.pk;
    } catch (err) {
      console.log('error en coger el creator');
      console.log(err);
    }
    try {
      const formData = new FormData();
      formData.append('creator', updatedForm.creator);
      formData.append('name', updatedForm.name);
      // formData.append('administrators', form.administrators);
      formData.append('description', updatedForm.description);
      if (updatedForm.topic.length > 0) {
        for (let i = 0; i < updatedForm.topic.length; i++) {
          formData.append('topic', updatedForm.topic[i]);
        }
      }

      if (updatedForm.hasTag.length > 0) {
        formData.append('hasTag', updatedForm.hasTag);
      }

      if (updatedForm.organizations_write.length > 0) {
        for (let i = 0; i < updatedForm.organizations_write.length; i++) {
          formData.append(
            'organizations_write',
            updatedForm.organizations_write[i],
          );
        }
      }
      formData.append('is_private', updatedForm.is_private);
      if (updatedForm.is_private) {
        formData.append('raw_password', updatedForm.raw_password);
      }
      formData.append('field_form', JSON.stringify(newFieldForm));
      if (imageBlob[0]) {
        formData.append('cover', imageBlob[0]);
      }
      // console.log(JSON.stringify(formData, null, 2));
      if (correct) {
        const projectCreated = await citmapApi.post(
          '/project/create/',
          formData,
          {
            headers: {
              Authorization: token,
              'Content-Type': 'multipart/form-data',
            },
          },
        );
        setWaitingData(false);
        navigation.dispatch(
          CommonActions.navigate({
            name: 'ProjectPage',
            params: {id: projectCreated.data.id, isNew: true},
          }),
        );
      } else {
        showModalSave();
        Toast.show({
          type: 'error',
          text1: 'Error',
          // text2: 'No se han podido obtener los datos, por favor reinicie la app',
          text2: 'Error al crear el proyecto',
        });
      }
    } catch (error: any) {
      if (error.response) {
        // El servidor respondió con un estado de error (por ejemplo, 4xx, 5xx)
        console.error('Error de respuesta del servidor:', error.response.data);
        console.error(
          'Estado de respuesta del servidor:',
          error.response.status,
        );
        Toast.show({
          type: 'error',
          text1: 'Error',
          // text2: 'No se han podido obtener los datos, por favor reinicie la app',
          text2: error.response.data,
        });
      } else if (error.request) {
        // La solicitud se hizo pero no se recibió una respuesta (por ejemplo, no hay conexión)
        console.error('Error de solicitud:', error.request);
        Toast.show({
          type: 'error',
          text1: 'Error',
          // text2: 'No se han podido obtener los datos, por favor reinicie la app',
          text2: error.request,
        });
      } else {
        // Se produjo un error en la configuración de la solicitud
        console.error('Error de configuración de la solicitud:', error.message);
        Toast.show({
          type: 'error',
          text1: 'Error',
          // text2: 'No se han podido obtener los datos, por favor reinicie la app',
          text2: error.message,
        });
      }
    } finally {
      setWaitingData(false);
    }
  };
  /**
   * Metodo para editar el proyecto
   */
  const editData = async () => {
    setWaitingData(true);
    let correct = true;
    let token;
    while (!token) {
      token = await AsyncStorage.getItem('token');
    }
    let updatedForm = {...form};
    const updatedQuestions = [...questions];
    updatedQuestions.map(x => {
      if (x.question_text.length <= 0) {
        correct = false;
      }
    });
    console.log(JSON.stringify(updatedQuestions, null, 2));
    try {
      const userInfo = await citmapApi.get<User>(
        '/users/authentication/user/',
        {
          headers: {
            Authorization: token,
          },
        },
      );
      updatedForm.creator = userInfo.data.pk;
    } catch (err) {
      console.log('error en coger el creator');
      console.log(err);
    }
    try {
      const formData = new FormData();

      // formData.append('creator', updatedForm.creator);
      formData.append('name', updatedForm.name);
      // formData.append('administrators', form.administrators);
      formData.append('description', updatedForm.description);
      if (updatedForm.topic.length > 0) {
        for (let i = 0; i < updatedForm.topic.length; i++) {
          formData.append('topic', updatedForm.topic[i]);
        }
      }
      // if (updatedForm.hasTag.length > 0) {
      //   formData.append('hasTag', updatedForm.hasTag);
      // }

      if (updatedForm.organizations_write.length > 0) {
        for (let i = 0; i < updatedForm.organizations_write.length; i++) {
          formData.append(
            'organizations_write',
            updatedForm.organizations_write[i],
          );
        }
      }

      if (updatedForm.is_private) {
        if (isEdit) {
          if (updatedForm.raw_password && updatedForm.raw_password.length > 0) {
            formData.append('is_private', updatedForm.is_private);
            formData.append('raw_password', updatedForm.raw_password);
          }
        }
      } else {
        formData.append('is_private', updatedForm.is_private);
      }

      if (imageBlob && imagesCharged.length <= 0) {
        formData.append('cover', imageBlob[0]);
      }
      if (imagesCharged.length > 0 && !imageBlob) {
        formData.append('cover', imagesCharged[0]);
      }
      // formData.append('field_form', JSON.stringify(updatedForm.field_form));
      console.log(JSON.stringify(formData, null, 2));
      if (correct) {
        const editedProject = await citmapApi.patch(
          `/project/${route.params.id}/`,
          formData,
          {
            headers: {
              Authorization: token,
              'Content-Type': 'multipart/form-data',
            },
          },
        );

        /**
         * si tiene id el field_form, significa que existe y se hará un patch para editar
         * cada question tiene su id a excepción de la nueva
         */
        if (form.field_form.id) {
          let newFieldForm: CreateFieldForm = {
            questions: updatedQuestions,
          };
          onChange(newFieldForm, 'field_form');
          updatedForm = form;
          const field = await citmapApi.patch(
            `/field_forms/${form.field_form.id}/`,
            JSON.stringify(newFieldForm),
            {
              headers: {
                Authorization: token,
                'Content-Type': 'application/json',
              },
            },
          );
        } else {
          /**
           * si no tiene id el field_form, significa que no existe y se hará un post para crear de 0 pasandole el id del projecto al que pertenece
           */
          let newFieldForm: CreateFieldForm = {
            project: route.params.id,
            questions: updatedQuestions,
          };
          const field = await citmapApi.post(
            `/field_forms/`,
            JSON.stringify(newFieldForm),
            {
              headers: {
                Authorization: token,
                'Content-Type': 'application/json',
              },
            },
          );
        }

        setWaitingData(false);
        navigation.dispatch(
          CommonActions.navigate({
            name: 'ProjectPage',
            params: {id: route.params.id, isNew: false},
          }),
        );
      } else {
        showModalSave();
        Toast.show({
          type: 'error',
          text1: 'Error',
          // text2: 'No se han podido obtener los datos, por favor reinicie la app',
          text2: 'No se ha podido editar el proyecto',
        });
      }
    } catch (error: any) {
      if (error.response) {
        // El servidor respondió con un estado de error (por ejemplo, 4xx, 5xx)
        // console.error('Error de respuesta del servidor:', error.response.data);
        // console.error(
        //   'Estado de respuesta del servidor:',
        //   error.response.status,
        // );
        Toast.show({
          type: 'error',
          text1: 'Error',
          // text2: 'No se han podido obtener los datos, por favor reinicie la app',
          text2: error.response.data,
        });
      } else if (error.request) {
        // La solicitud se hizo pero no se recibió una respuesta (por ejemplo, no hay conexión)
        console.error('Error de solicitud:', error.request);
        Toast.show({
          type: 'error',
          text1: 'Error',
          // text2: 'No se han podido obtener los datos, por favor reinicie la app',
          text2: error.request,
        });
      } else {
        // Se produjo un error en la configuración de la solicitud
        console.error('Error de configuración de la solicitud:', error.message);
        Toast.show({
          type: 'error',
          text1: 'Error',
          // text2: 'No se han podido obtener los datos, por favor reinicie la app',
          text2: error.message,
        });
      }
    } finally {
      setWaitingData(false);
    }
  };

  // Función para manejar cambios en las tarjetas
  // CAMBIA EL TEXTO DEL INPUT
  const handleQuestionChange = (
    index: number,
    fieldName: string,
    value: any,
  ) => {
    // Encuentra la tarjeta por su ID y actualiza los datos
    setQuestions(prevQuestions => {
      return prevQuestions.map((question, i) => {
        if (i === index) {
          return {...question, [fieldName]: value};
        }
        return question;
      });
    });
  };

  /**
   *
   * @param item este valor es el item que se envía para saber su answer type
   * @returns devuelve el answer type que corresponda
   */
  const knowAnswerType = (item: Question) => {
    const temp = answerType.findIndex(
      x => x.type.toLowerCase() === item.answer_type.toLowerCase(),
    );
    return temp;
  };

  //#endregion

  const onDeleteProject = async () => {
    try {
      let token;
      while (!token) {
        token = await AsyncStorage.getItem('token');
      }
      const resp = await citmapApi.delete(`/project/${route.params.id}/`, {
        headers: {
          Authorization: token,
        },
      });
      console.log(JSON.stringify(resp.data, null, 2));
      Toast.show({
        type: 'success',
        text1: 'Proyecto borrado con éxito.',
      });
      hideModalDelete();
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'MultipleNavigator',
            },
          ],
        }),
      );
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error en el borrado.',
      });
    }
  };

  //#endregion

  //#region RENDERS

  /**
   * TODO servirá para cambiar el texto de color
   * @param indice
   * @returns
   */
  const obtenerEstiloTexto = (indice: number) => {
    return indice >= 200 ? {color: 'red'} : {};
  };

  const renderizarTexto = () => {
    return form.description.split('').map((caracter, index) => (
      <Text key={index} style={[obtenerEstiloTexto(index)]}>
        {caracter}
      </Text>
    ));
  };

  const firstScreen = () => {
    return (
      <KeyboardAvoidingView>
        <View
          style={{
            alignItems: 'center',
            // width: widthPercentageToDP(85)
            width: '85%',
            // height:'90%'
          }}>
          {/* imagenes */}
          <Text style={{color: 'black', alignSelf: 'flex-start'}}>
            {fontLanguage.create_project[0].first_screen.project_image}
          </Text>
          <View
            style={{
              marginVertical: RFPercentage(1),
              //   backgroundColor: 'red',
            }}>
            {images.length <= 0 && imagesCharged.length <= 0 && (
              // <TouchableOpacity
              //   style={{
              //     width: widthPercentageToDP(82),
              //     justifyContent: 'center',
              //     alignItems: 'center',
              //     marginVertical: '5%',
              //     marginTop: '4%',
              //     // backgroundColor: Colors.secondaryBackground,
              //     borderRadius: 10,
              //     padding: '2%',
              //   }}
              //   onPress={() => selectImage()}>
              //   {/* <IconButton
              //     icon="image-album"
              //     iconColor="#5F4B66"
              //     size={Size.iconSizeLarge}
              //     onPress={() => selectImage()}
              //   /> */}
              //   <View
              //     style={{
              //       width: '100%',
              //       justifyContent: 'center',
              //       alignItems: 'center',
              //     }}>
              //     <FrontPage
              //       fill={Colors.contentSecondaryLigth}
              //       width={RFPercentage(12)}
              //       height={RFPercentage(10)}
              //     />
              //   </View>
              // </TouchableOpacity>
              <View
                style={{
                  width: widthPercentageToDP(44),
                  height: heightPercentageToDP(13),
                  justifyContent: 'center',
                  alignItems: 'center',
                  alignSelf: 'flex-start',
                  marginVertical: '5%',
                  marginTop: '4%',
                  backgroundColor: Colors.secondaryBackground,
                  borderRadius: 10,
                  padding: '2%',
                  //   paddingBottom: '2%'
                }}>
                <TouchableOpacity onPress={() => selectImage()}>
                  <FrontPage
                    fill={'#000'}
                    width={RFPercentage(9)}
                    height={RFPercentage(9)}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => selectImage()}
                  style={{
                    width: RFPercentage(4),
                    position: 'absolute',
                    bottom: RFPercentage(-1),
                    // left: RFPercentage(20),
                    zIndex: 999,
                    backgroundColor: 'white',
                    borderRadius: 50,
                    left: widthPercentageToDP(40),
                  }}>
                  <PlusImg
                    width={RFPercentage(4)}
                    height={RFPercentage(4)}
                    fill={'#0059ff'}
                  />
                </TouchableOpacity>
              </View>
            )}
            {images.length > 0 && (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: RFPercentage(15),
                  width: RFPercentage(41),
                  marginBottom: RFPercentage(2),
                  marginTop: RFPercentage(2),
                  padding: 10,
                  flexDirection: 'row',
                }}>
                {images[0] ? (
                  <Image
                    source={{
                      uri: 'data:image/jpeg;base64,' + images[0].data,
                    }}
                    style={{
                      position: 'absolute',
                      width: widthPercentageToDP(44),
                      height: heightPercentageToDP(14),
                      backgroundColor: 'transparent',
                      alignSelf: 'center',
                      borderRadius: 10,
                      zIndex: 1,
                      // left: '34.5%',
                      borderColor: 'white',
                      borderWidth: 4,
                    }}
                  />
                ) : (
                  <>
                    <View
                      style={{
                        position: 'absolute',
                        width: widthPercentageToDP(30),
                        height: heightPercentageToDP(11),
                        backgroundColor: 'grey',
                        // alignSelf: 'flex-start',
                        borderRadius: 10,
                        zIndex: 1,
                        left: RFPercentage(4),
                        borderColor: 'white',
                        borderWidth: 4,
                      }}></View>
                  </>
                )}

                {/* {images[1] ? (
                  <Image
                    source={{
                      uri: 'data:image/jpeg;base64,' + images[1].data,
                    }}
                    style={{
                      position: 'absolute',
                      height: RFPercentage(15),
                      width: RFPercentage(13),
                      borderRadius: 10,
                      zIndex: 0,
                      left: RFPercentage(10),
                      borderColor: 'white',
                      borderWidth: 4,
                    }}
                  />
                ) : (
                  <>
                    <View
                      style={{
                        position: 'absolute',
                        height: RFPercentage(15),
                        width: RFPercentage(13),
                        borderRadius: 10,
                        zIndex: 0,
                        left: RFPercentage(10),
                        borderColor: 'white',
                        borderWidth: 4,
                        backgroundColor: 'grey',
                      }}></View>
                  </>
                )}

                {images[2] ? (
                  <Image
                    source={{
                      uri: 'data:image/jpeg;base64,' + images[2].data,
                    }}
                    style={{
                      position: 'absolute',
                      height: RFPercentage(15),
                      width: RFPercentage(13),
                      backgroundColor: 'grey',
                      // alignSelf: 'center',
                      borderRadius: 10,
                      zIndex: -1,
                      left: RFPercentage(16),
                      borderColor: 'white',
                      borderWidth: 4,
                    }}
                  />
                ) : (
                  <>
                    <View
                      style={{
                        position: 'absolute',
                        height: RFPercentage(15),
                        width: RFPercentage(13),
                        backgroundColor: 'grey',
                        // alignSelf: 'center',
                        borderRadius: 10,
                        zIndex: -1,
                        left: RFPercentage(16),
                        borderColor: 'white',
                        borderWidth: 4,
                      }}></View>
                  </>
                )}

                {images[3] ? (
                  <Image
                    source={{
                      uri: 'data:image/jpeg;base64,' + images[3].data,
                    }}
                    style={{
                      position: 'absolute',
                      height: RFPercentage(15),
                      width: RFPercentage(13),
                      backgroundColor: 'grey',
                      // alignSelf: 'center',
                      borderRadius: 10,
                      zIndex: -2,
                      left: RFPercentage(22),
                      borderColor: 'white',
                      borderWidth: 4,
                    }}
                  />
                ) : (
                  <>
                    <View
                      style={{
                        position: 'absolute',
                        height: RFPercentage(15),
                        width: RFPercentage(13),
                        backgroundColor: 'grey',
                        // alignSelf: 'center',
                        borderRadius: 10,
                        zIndex: -2,
                        left: RFPercentage(22),
                        borderColor: 'white',
                        borderWidth: 4,
                      }}></View>
                  </>
                )} */}

                <TouchableOpacity
                  style={{
                    width: RFPercentage(4),
                    position: 'absolute',
                    bottom: RFPercentage(0),
                    // left: RFPercentage(18),
                    // alignSelf: 'center',
                    left: widthPercentageToDP(55),
                    zIndex: 999,
                    backgroundColor: 'white',
                    borderRadius: 50,
                  }}
                  onPress={() => selectImage()}>
                  {/* <IconButton
                    icon="image-album"
                    iconColor="#5F4B66"
                    size={Size.iconSizeLarge}
                    onPress={() => selectImage()}
                  /> */}
                  <PlusBlue
                    width={RFPercentage(4)}
                    height={RFPercentage(4)}
                    fill={'#ffffff'}
                  />
                </TouchableOpacity>
                {/* <Button
                  //   style={{margin: 15, width: 150, alignSelf: 'center'}}
                  title="borrar imagen"
                  onPress={() => deleteImage()}
                /> */}
              </View>
            )}
            {imagesCharged.length > 0 && (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: RFPercentage(15),
                  width: RFPercentage(41),
                  marginBottom: RFPercentage(2),
                  marginTop: RFPercentage(2),
                  padding: 10,
                  flexDirection: 'row',
                }}>
                {imagesCharged[0] ? (
                  <>
                    <Image
                      source={{
                        uri: imageUrl + imagesCharged[0].image,
                      }}
                      style={{
                        position: 'absolute',
                        width: widthPercentageToDP(44),
                        height: heightPercentageToDP(13),
                        backgroundColor: 'transparent',
                        alignSelf: 'center',
                        borderRadius: 10,
                        zIndex: 1,
                        // left: '34.5%',
                        borderColor: 'white',
                        borderWidth: 4,
                      }}
                    />
                  </>
                ) : (
                  <>
                    <View
                      style={{
                        position: 'absolute',
                        height: RFPercentage(15),
                        width: RFPercentage(13),
                        backgroundColor: 'transparent',
                        alignSelf: 'center',
                        borderRadius: 10,
                        zIndex: 1,
                        left: '34.5%',
                        borderColor: 'white',
                        borderWidth: 4,
                      }}></View>
                  </>
                )}

                {/* {imagesCharged[1] ? (
                  <>
                    <Image
                      source={{
                        uri:
                          'http://dev.ibercivis.es:10001' +
                          imagesCharged[1].image,
                      }}
                      style={{
                        position: 'absolute',
                        height: RFPercentage(15),
                        width: RFPercentage(13),
                        backgroundColor: 'transparent',
                        // alignSelf: 'flex-start',
                        borderRadius: 10,
                        zIndex: 0,
                        left: RFPercentage(10),
                        borderColor: 'white',
                        borderWidth: 4,
                      }}
                    />
                  </>
                ) : (
                  <>
                    <View
                      style={{
                        position: 'absolute',
                        height: RFPercentage(15),
                        width: RFPercentage(13),
                        borderRadius: 10,
                        zIndex: 0,
                        left: RFPercentage(10),
                        borderColor: 'white',
                        borderWidth: 4,
                        backgroundColor: 'grey',
                      }}></View>
                  </>
                )}

                {imagesCharged[2] ? (
                  <>
                    <Image
                      source={{
                        uri:
                          'http://dev.ibercivis.es:10001' +
                          imagesCharged[2].image,
                      }}
                      style={{
                        position: 'absolute',
                        height: RFPercentage(15),
                        width: RFPercentage(13),
                        backgroundColor: 'transparent',
                        // alignSelf: 'flex-start',
                        borderRadius: 10,
                        zIndex: -1,
                        left: RFPercentage(16),
                        borderColor: 'white',
                        borderWidth: 4,
                      }}
                    />
                  </>
                ) : (
                  <>
                    <View
                      style={{
                        position: 'absolute',
                        height: RFPercentage(15),
                        width: RFPercentage(13),
                        backgroundColor: 'grey',
                        // alignSelf: 'center',
                        borderRadius: 10,
                        zIndex: -1,
                        left: RFPercentage(16),
                        borderColor: 'white',
                        borderWidth: 4,
                      }}></View>
                  </>
                )}

                {imagesCharged[3] ? (
                  <>
                    <Image
                      source={{
                        uri:
                          'http://dev.ibercivis.es:10001' +
                          imagesCharged[3].image,
                      }}
                      style={{
                        position: 'absolute',
                        height: RFPercentage(15),
                        width: RFPercentage(13),
                        backgroundColor: 'transparent',
                        // alignSelf: 'flex-start',
                        borderRadius: 10,
                        zIndex: -2,
                        left: RFPercentage(22),
                        borderColor: 'white',
                        borderWidth: 4,
                      }}
                    />
                  </>
                ) : (
                  <>
                    <View
                      style={{
                        position: 'absolute',
                        height: RFPercentage(15),
                        width: RFPercentage(13),
                        backgroundColor: 'grey',
                        // alignSelf: 'center',
                        borderRadius: 10,
                        zIndex: -2,
                        left: RFPercentage(22),
                        borderColor: 'white',
                        borderWidth: 4,
                      }}></View>
                  </>
                )} */}

                <TouchableOpacity
                  style={{
                    width: RFPercentage(4),
                    position: 'absolute',
                    bottom: RFPercentage(0),
                    // left: RFPercentage(18),
                    // alignSelf: 'center',
                    left: widthPercentageToDP(55),
                    zIndex: 999,
                    backgroundColor: 'white',
                    borderRadius: 50,
                  }}
                  onPress={() => selectImage()}>
                  {/* <IconButton
                    icon="image-album"
                    iconColor="#5F4B66"
                    size={Size.iconSizeLarge}
                    onPress={() => selectImage()}
                  /> */}
                  <PlusBlue
                    width={RFPercentage(4)}
                    height={RFPercentage(4)}
                    fill={'#0059ff'}
                  />
                </TouchableOpacity>
                {/* <Button
                  //   style={{margin: 15, width: 150, alignSelf: 'center'}}
                  title="borrar imagen"
                  onPress={() => deleteImage()}
                /> */}
              </View>
            )}
          </View>
          {/* nombre de del proyecto */}
          <View
            style={{
              width: '100%',
              marginVertical: RFPercentage(1),
            }}>
            <Text style={{color: 'black'}}>
              {fontLanguage.create_project[0].first_screen.project_name}
            </Text>
            <InputText
              // isInputText={() => setIsInputText(!isInputText)}
              isValid={nameValidate}
              label={fontLanguage.create_project[0].first_screen.project_name}
              keyboardType="default"
              multiline={false}
              numOfLines={1}
              onChangeText={value => {
                onChange(value, 'name'), setNameValidate(true);
              }}
              value={form.name}
              maxLength={50}
            />
          </View>
          {/* descripcion del proyecto */}
          <View
            style={{
              // width: '80%',
              // width: widthPercentageToDP(71),
              marginVertical: RFPercentage(2),
            }}>
            <Text style={{color: 'black'}}>
              {fontLanguage.create_project[0].first_screen.project_description}
            </Text>
            <InputText
              isValid={descriptionValidate}
              label={
                fontLanguage.create_project[0].first_screen
                  .project_description_label
              }
              keyboardType="default"
              multiline={true}
              maxLength={MAX_CHARACTERS}
              numOfLines={5}
              onPressIn={() => {
                if (scrollViewRef.current) {
                  scrollViewRef.current.scrollTo({
                    y: heightPercentageToDP(13),
                    animated: true,
                  });
                }
              }}
              // style={obtenerEstiloTexto()}
              onChangeText={value => {
                onChange(value, 'description'), setDescriptionValidate(true);
              }}
              value={form.description}
            />
            <View
              style={{
                // width: '80%',
                justifyContent: 'flex-end',
                alignItems: 'flex-end',
                flexDirection: 'row',
              }}>
              <Text
                style={{
                  color:
                    form.description.length <= MAX_CHARACTERS ? 'black' : 'red',
                  fontSize: FontSize.fontSizeText13,
                }}>
                {form.description.length}
              </Text>
              <Text style={{fontSize: FontSize.fontSizeText13}}>
                /{MAX_CHARACTERS}
              </Text>
            </View>
          </View>
          {/* add categories */}
          <View
            style={{
              width: '100%',
              marginVertical: RFPercentage(1),
            }}>
            <Text style={{color: 'black'}}>
              {fontLanguage.create_project[0].first_screen.add_categories}
            </Text>
            <View style={{width: widthPercentageToDP(85)}}>
              <CustomButton
                backgroundColor={Colors.secondaryDark}
                label={
                  fontLanguage.create_project[0].first_screen.select_categories
                }
                onPress={() => {
                  Keyboard.dismiss(), setShowCategoryList(true);
                }}
              />
            </View>
          </View>
          {/* lista de categorias */}
          {userCategories && (
            <>
              {userCategories.map(x => {
                return (
                  <View
                    key={x.id}
                    style={{
                      width: widthPercentageToDP(80),
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginVertical: RFPercentage(1),
                    }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        width: widthPercentageToDP(41),
                      }}>
                      <View style={{}}>
                        <Hashtag
                          fill={'black'}
                          width={RFPercentage(4)}
                          height={RFPercentage(4)}
                        />
                      </View>
                      <Text
                        style={{
                          alignItems: 'flex-start',
                          justifyContent: 'flex-start',
                          marginHorizontal: RFPercentage(2),
                        }}>
                        {x.topic}
                      </Text>
                    </View>

                    <View style={{width: RFPercentage(6)}}>
                      <CustomButton
                        backgroundColor={'transparent'}
                        label={fontLanguage.global[0].delete_button}
                        onPress={() => setCheckCategories(x)}
                        fontColor="red"
                        outlineColor="red"
                        fontSize={RFPercentage(1.2)}
                        height={RFPercentage(3)}
                      />
                    </View>
                  </View>
                );
              })}
            </>
          )}
          {/* add organizaciones */}
          <View
            style={{
              width: '100%',
              marginVertical: RFPercentage(1),
              marginTop: RFPercentage(4),
            }}>
            <Text style={{color: 'black', marginBottom: '2%'}}>
              {fontLanguage.create_project[0].first_screen.add_organizations}
            </Text>
            <View
              style={{
                width: '100%',
                marginBottom: RFPercentage(4),
              }}>
              <TextInput
                placeholder={
                  fontLanguage.create_project[0].first_screen
                    .add_organizations_placeholder
                }
                value={inputValueOrganization}
                onChangeText={value => handleInputChangeOrganization(value)}
                style={styles.input}
              />
              {inputValueOrganization.length <= 0 ? (
                <TouchableOpacity onPress={() => showModalInfo()}>
                  <Text
                    style={{
                      color: Colors.primaryDark,
                      marginHorizontal: '2%',
                      marginTop: '1%',
                    }}>
                    {
                      fontLanguage.create_project[0].first_screen
                        .how_to_add_organizations
                    }
                  </Text>
                </TouchableOpacity>
              ) : (
                <></>
              )}

              {suggestions.length > 0 &&
                suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={{
                      ...styles.suggestionsList,
                      borderBottomLeftRadius:
                        index === suggestions.length - 1 ? 10 : 0,
                      borderBottomRightRadius:
                        index === suggestions.length - 1 ? 10 : 0,
                    }}
                    onPress={() => handleSuggestionPress(item)}>
                    {item.logo ? (
                      <Image
                        source={{
                          uri: item.logo,
                        }}
                        style={{
                          width: '12%',
                          height: '65%',
                          borderRadius: 50,
                          resizeMode: 'cover',
                          backgroundColor: 'blue',
                          marginHorizontal: '4%',
                          marginVertical: '2%',
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: '12%',
                          // height: '100%',
                          borderRadius: 100,
                          marginHorizontal: '4%',
                          marginVertical: '2%',
                          alignContent: 'center',
                          alignItems: 'center',
                        }}>
                        <UserMissing
                          height={RFPercentage(3.8)}
                          width={RFPercentage(3.8)}
                        />
                      </View>
                    )}
                    <Text style={styles.suggestionItem}>
                      {item.principalName}
                    </Text>
                  </TouchableOpacity>
                ))}
              {suggestionsSelected.length > 0 && (
                <Text
                  style={{
                    fontSize: FontSize.fontSizeText14 + 1,
                    color: 'black',
                    marginTop: '10%',
                    marginBottom: '3%',
                  }}>
                  {
                    fontLanguage.create_project[0].first_screen
                      .organizations_list
                  }
                </Text>
              )}
              {suggestionsSelected.length > 0 &&
                suggestionsSelected.map((item, index) => (
                  <View
                    style={{
                      width: '100%',
                      height: 'auto',
                      marginVertical: '4%',
                      flexDirection: 'row',
                    }}
                    key={index + 1}>
                    {/* sustituir por avatar */}
                    {item.logo ? (
                      <Image
                        source={{
                          uri: item.logo,
                        }}
                        style={{
                          width: '12%',
                          height: '120%',
                          borderRadius: 50,
                          resizeMode: 'cover',
                          backgroundColor: 'blue',
                          marginRight: '2%',
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: '12%',
                          height: '100%',
                          borderRadius: 100,
                          marginRight: '2%',
                          alignContent: 'center',
                          alignItems: 'center',
                          marginTop: '1.3%',
                        }}>
                        <UserMissing
                          height={RFPercentage(3.8)}
                          width={RFPercentage(3.8)}
                        />
                      </View>
                    )}
                    {/* sustituir texto de abajo por el que sea */}
                    <View
                      style={{
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        width: '60%',
                      }}>
                      <Text
                        style={{
                          fontSize: FontSize.fontSizeText14,
                          color: 'black',
                        }}>
                        {item.principalName}
                      </Text>
                      <Text
                        style={{
                          fontSize: FontSize.fontSizeText13,
                          color: Colors.contentQuaternaryLight,
                        }}>
                        {item.contactMail}
                      </Text>
                    </View>
                    {/* que elimine de la lista */}
                    <View
                      style={{
                        width: widthPercentageToDP(14),
                        marginLeft: '10%',
                        alignContent: 'center',
                        justifyContent: 'center',
                      }}>
                      <CustomButton
                        onPress={() => moveItemToSuggestions(index)}
                        backgroundColor="transparen"
                        fontColor="red"
                        label={fontLanguage.global[0].delete_button}
                        outlineColor="red"
                        fontSize={RFPercentage(1.5)}
                        height={RFPercentage(4)}
                      />
                    </View>
                  </View>
                ))}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const secondScreen = () => {
    return (
      <>
        <KeyboardAvoidingView>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              width: RFPercentage(41),
              marginHorizontal: RFPercentage(2),
              //   backgroundColor: 'red',
            }}>
            <View
              style={{
                width: '100%',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginVertical: RFPercentage(1),
                // backgroundColor: 'red'
              }}>
              <View
                style={{
                  width: '100%',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginVertical: RFPercentage(1),
                }}>
                <Text style={{color: 'black'}}>
                  {
                    fontLanguage.create_project[0].second_screen
                      .privacy_data_base_project
                  }
                </Text>
                <Switch
                  value={isSwitchOnDataBaseProject}
                  onValueChange={onToggleSwitchDataBaseProject}
                />
              </View>
              <Text
                style={{
                  color: Colors.contentQuaternaryDark,
                  fontSize: FontSize.fontSizeText13,
                  width: '80%',
                  alignSelf: 'flex-start',
                  marginLeft: '3%',
                  //   backgroundColor:'green'
                }}>
                {
                  fontLanguage.create_project[0].second_screen
                    .privacy_info_data_base_project
                }
              </Text>
              <View
                style={{
                  width: '100%',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginVertical: RFPercentage(1),
                }}>
                <Text style={{color: 'black'}}>
                  {fontLanguage.create_project[0].second_screen.privacy_project}
                </Text>
                <Switch
                  value={isSwitchOnProject}
                  onValueChange={onToggleSwitchProject}
                  // onValueChange={value => onChange(value, 'is_private')}
                />
              </View>
              <Text
                style={{
                  color: Colors.contentQuaternaryDark,
                  fontSize: FontSize.fontSizeText13,
                  width: '80%',
                  alignSelf: 'flex-start',
                  marginLeft: '3%',
                  //   backgroundColor:'green'
                }}>
                {
                  fontLanguage.create_project[0].second_screen
                    .privacy_info_project
                }
              </Text>
            </View>
          </View>
          <View
            style={{
              width: '100%',
              height: 'auto',
              alignSelf: 'center',
              //   backgroundColor:'green'
            }}>
            <View style={{}}>
              {isSwitchOnProject && (
                <>
                  {/* password */}
                  <View
                    style={{
                      //   width: '80%',
                      flexDirection: 'row',
                      alignItems: 'center',
                      flex: 1,
                    }}>
                    <View
                      style={{
                        // left: '-5%',
                        marginLeft: -RFPercentage(3),
                        top: '50%',
                        alignSelf: 'center',
                        // justifyContent: 'center',
                        position: 'absolute',
                        paddingLeft: RFPercentage(1),
                        // backgroundColor:'green'
                      }}>
                      {!errorPass ? (
                        <GeometryForms
                          name="circle-fill"
                          size={Size.iconSizeExtraMin}
                          color={Colors.semanticSuccessLight}
                        />
                      ) : (
                        <>
                          <GeometryForms
                            name="circle-fill"
                            size={Size.iconSizeExtraMin}
                            color={Colors.semanticDangerLight}
                          />
                        </>
                      )}
                    </View>
                    <View
                      style={{
                        width: RFPercentage(41),
                      }}>
                      <InputText
                        // isInputText={() => setIsInputText(!isInputText)}
                        label={
                          fontLanguage.create_project[0].second_screen
                            .write_pass_label
                        }
                        inputType={true}
                        multiline={false}
                        numOfLines={1}
                        isSecureText={true}
                        onChangeText={value => setRawPassword(value)}
                        value={rawPassword}
                      />
                    </View>
                  </View>
                  {/* password repeat */}
                  <View
                    style={{
                      width: RFPercentage(41),
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    <View
                      style={{
                        marginLeft: -RFPercentage(3),
                        top: '50%',
                        alignSelf: 'center',
                        justifyContent: 'center',
                        position: 'absolute',
                        paddingLeft: RFPercentage(1),
                      }}>
                      {!errorPass ? (
                        <GeometryForms
                          name="circle-fill"
                          size={Size.iconSizeExtraMin}
                          color={Colors.semanticSuccessLight}
                        />
                      ) : (
                        <>
                          <GeometryForms
                            name="circle-fill"
                            size={Size.iconSizeExtraMin}
                            color={Colors.semanticDangerLight}
                          />
                        </>
                      )}
                    </View>
                    <InputText
                      // isInputText={() => setIsInputText(!isInputText)}
                      label={
                        fontLanguage.create_project[0].second_screen
                          .confirm_pass_label
                      }
                      inputType={true}
                      multiline={false}
                      numOfLines={1}
                      isSecureText={true}
                      onChangeText={value => validatePassword(value)}
                      value={rawPassword2}
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </>
    );
  };

  const thirdScreen = () => {
    return (
      <>
        <KeyboardAvoidingView>
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              width: '100%',
              marginHorizontal: RFPercentage(1),
            }}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {questions.map((item, index) => (
                <QuestionCard
                  onPress={() => {
                    Keyboard.dismiss(), onSelectedCard(index, item);
                  }}
                  onEdit={() => {
                    Keyboard.dismiss(), onEditResponseType(index, item);
                  }}
                  onDelete={() => onDelete(item)}
                  onDuplicate={() => duplicate(item)}
                  onFocus={() => onSelectedCard(index, item)}
                  onCheck={() => {
                    const updatedQuestions = [...questions];
                    updatedQuestions[index].mandatory =
                      !updatedQuestions[index].mandatory;
                    setQuestions(updatedQuestions);
                  }}
                  checkbox={item.mandatory}
                  key={index}
                  index={index + 1}
                  selected={index === isSelectedCardAnswer}
                  form={item}
                  onChangeText={(fieldName, value) =>
                    handleQuestionChange(index, fieldName, value)
                  }
                  responseType={item.answer_type}
                />
              ))}
              <TouchableOpacity
                style={{width: RFPercentage(4), alignSelf: 'center'}}
                onPress={createAnswer}>
                <PlusImg
                  style={{
                    position: 'relative',
                    alignSelf: 'center',
                    marginVertical: RFPercentage(3),
                  }}
                  height={RFPercentage(4)}
                  width={RFPercentage(4)}
                  fill={'black'}
                />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </>
    );
  };

  //#endregion

  return (
    <KeyboardAvoidingView
      // keyboardVerticalOffset={RFPercentage(2)}
      style={{flex: 1, backgroundColor: 'transparent'}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Ajusta la vista por encima del teclado
    >
      <SafeAreaView style={{flexGrow: 1}}>
        <HeaderComponent
          title={
            isEdit
              ? fontLanguage.create_project[0].title_edit
              : fontLanguage.create_project[0].title_create
          }
          onPressLeft={() => navigation.goBack()}
          rightIcon={true}
          renderRight={() => {
            if (isEdit && canDelete) {
              return (
                <TouchableOpacity
                  activeOpacity={0.5}
                  onPress={() => showModalDelete()}>
                  <View
                    style={{
                      justifyContent: 'center',
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginRight: RFPercentage(3),
                      marginTop: RFPercentage(0.4),
                    }}>
                    {/* <IconTemp name="arrow-left" size={Size.iconSizeMedium} /> */}
                    <Delete
                      width={RFPercentage(2.5)}
                      height={RFPercentage(2.5)}
                      fill={Colors.semanticDangerLight}
                    />
                  </View>
                </TouchableOpacity>
              );
            } else {
              return <></>;
            }
          }}
        />
        {/* <TouchableWithoutFeedback onPress={handlePressOutside}> */}
        <View style={styles.container}>
          {/* los puntitos */}
          <View style={styles.stepsContainer}>
            {Array.from({length: totalSteps}, (_, index) => (
              <View
                key={index}
                style={[
                  styles.stepDot,
                  index === currentStep - 1 && styles.activeStepDot,
                ]}
              />
            ))}
          </View>
          {/* cada elemento de aquí dentro contendrá cada vista de la creación del proyecto. Dentro habrá un scrollview para cada elemento? */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              // height: 'auto',
            }}
            style={{}}
            ref={scrollViewRef}>
            {currentStep === 1 && firstScreen()}
            {currentStep === 2 && secondScreen()}
            {currentStep === 3 && thirdScreen()}
            <View style={styles.buttonContainer}>
              {currentStep > 1 && (
                <CustomButton
                  backgroundColor={'white'}
                  outlineColor={'black'}
                  fontColor="black"
                  label={fontLanguage.global[0].back_button}
                  onPress={handlePrevStep}
                />
              )}
              {currentStep < totalSteps && (
                <CustomButton
                  backgroundColor={Colors.primaryLigth}
                  label={fontLanguage.global[0].continue_button}
                  onPress={handleNextStep}
                />
              )}
              {currentStep === 3 && (
                <>
                  {isEdit == true ? (
                    <CustomButton
                      backgroundColor={Colors.primaryLigth}
                      label={fontLanguage.create_project[0].save_changes}
                      onPress={() => editData()}
                    />
                  ) : (
                    <CustomButton
                      backgroundColor={Colors.primaryLigth}
                      label={fontLanguage.create_project[0].create_continue}
                      onPress={() => showData()}
                    />
                  )}
                </>
              )}
            </View>
            {/* modal save proyect */}
            <SaveProyectModal
              visible={saveModal}
              hideModal={hideModalSave}
              onPress={hideModalSave}
              size={RFPercentage(4)}
              color={Colors.semanticWarningDark}
              label={fontLanguage.create_project[0].modals.save_problem_label}
              helper={false}
            />
            <SaveProyectModal
              visible={errorPass}
              hideModal={hideModalErrorPass}
              onPress={hideModalErrorPass}
              size={RFPercentage(4)}
              color={Colors.semanticWarningDark}
              label={fontLanguage.create_project[0].modals.pass_problem_label}
              helper={false}
            />
            <InfoModal
              visible={infoModal}
              hideModal={hideModalInfo}
              onPress={hideModalInfo}
              size={RFPercentage(4)}
              color={Colors.primaryLigth}
              label={
                fontLanguage.create_project[0].modals
                  .how_to_add_organizations_label
              }
              subLabel={
                fontLanguage.create_project[0].modals
                  .how_to_add_organizations_sublabel
              }
              helper={false}
            />

            <DeleteModal
              visible={deleteModal}
              hideModal={hideModalDelete}
              onPress={() => {
                onDeleteProject();
              }}
              size={RFPercentage(4)}
              color={Colors.semanticWarningDark}
              label={fontLanguage.create_project[0].modals.delete_proyect_label}
              subLabel={
                fontLanguage.create_project[0].modals.delete_proyect_sublabel
              }
              helper={false}
            />
            <ProyectGuideModal
              hideModal={hideModalGuide}
              visible={guideModal}
              onPress={() => console.log('pressed')}
            />
          </ScrollView>
          {showCategoryList && (
            <View style={styles.showCategoryView}>
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
                    backgroundColor: 'grey',
                    height: 8,
                    width: '10%',
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
                    {fontLanguage.create_project[0].categories}
                  </Text>
                </View>
                <View>
                  <TouchableOpacity onPress={() => setShowCategoryList(false)}>
                    <Text style={{color: Colors.primaryLigth}}>
                      {fontLanguage.global[0].close_button}
                    </Text>
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
                  const isChecked = userCategories.includes(item);
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        setCheckCategories(item);
                      }}
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
                      <Text>{item.topic}</Text>
                    </TouchableOpacity>
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
                    setUserCategories([]);
                  }}>
                  <Text style={{color: Colors.primaryLigth}}>
                    {fontLanguage.global[0].clean_all_button}
                  </Text>
                </TouchableOpacity>
                <View style={{width: widthPercentageToDP(20)}}>
                  <CustomButton
                    backgroundColor={Colors.primaryLigth}
                    label={fontLanguage.create_project[0].apply}
                    onPress={() => setShowCategoryList(false)}
                  />
                </View>
              </View>
            </View>
          )}
          {showAnswerTypeList && (
            <View style={styles.showCategoryView}>
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
                    backgroundColor: 'grey',
                    height: 8,
                    width: '10%',
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
                      fontSize: FontSize.fontSizeText14,
                      fontWeight: 'bold',
                      color: 'black',
                    }}>
                    {fontLanguage.create_project[0].response_type}
                  </Text>
                </View>
                <View>
                  <TouchableOpacity
                    onPress={() => {
                      setShowAnswerTypeList(false),
                        setResponseSelected(-1),
                        setSelectedQuestion({
                          question_text: '',
                          answer_type: '',
                        });
                    }}>
                    <Text style={{color: Colors.lightblue}}>
                      {fontLanguage.global[0].close_button}
                    </Text>
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
                data={answerType}
                renderItem={({item, index}) => {
                  const isChecked = index === responseSelected ? true : false; //solo sirve para marcar el que está seleccionado
                  return (
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        width: RFPercentage(42),
                      }}>
                      {isChecked ? (
                        <View style={{width: RFPercentage(30)}}>
                          <TouchableOpacity
                            activeOpacity={0.6}
                            onPress={() => setResponseSelected(-1)}
                            // onPress={() => setResponseSelectedObject(item)}
                            // onPress={() => onSelectResponseTypeModal(-1)}
                            style={{
                              width: '100%',
                              justifyContent: 'center',
                              height: 35,
                              borderRadius: 12,
                              marginTop: '2.5%',
                              backgroundColor: Colors.primaryDark,
                            }}>
                            <View
                              style={{
                                flexDirection: 'row', // Coloca el icono y el texto en una fila
                                alignItems: 'center', // Centra verticalmente el contenido
                                justifyContent: 'flex-start', // Alinea el contenido al principio (izquierda)
                                paddingHorizontal: RFPercentage(5), // Añade espaciado horizontal al contenido
                                backgroundColor: 'transparent',
                              }}>
                              <View
                                style={{
                                  marginRight: 'auto',
                                  marginLeft: RFPercentage(1),
                                }}>
                                <IconTemp
                                  name={item.icon}
                                  size={Size.iconSizeMin}
                                  style={{alignSelf: 'center'}}
                                />
                              </View>

                              <Text
                                style={{
                                  flex: 1, // Permite que el texto ocupe el espacio restante
                                  textAlign: 'center', // Centra horizontalmente el texto
                                  fontWeight: '500',
                                  fontSize: FontSize.fontSizeText14 / fontScale,
                                  alignSelf: 'center',
                                  fontFamily: FontFamily.NotoSansDisplayMedium,
                                  color: '#fff',
                                }}>
                                {item.name}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={{width: RFPercentage(22)}}>
                          <TouchableOpacity
                            activeOpacity={0.6}
                            onPress={() => {
                              onResponseSelected(index), //se guarda el index del type
                                onSelectResponseTypeModal(item.type, index), // se modifica la question para que cambie su type
                                setShowAnswerTypeList(false); // se cierra el modal
                            }}
                            style={{
                              width: '100%',
                              justifyContent: 'center',
                              height: 35,
                              borderRadius: 12,
                              marginTop: '2.5%',
                              backgroundColor: Colors.contentSecondaryDark,
                            }}>
                            <View
                              style={{
                                flexDirection: 'row', // Coloca el icono y el texto en una fila
                                alignItems: 'center', // Centra verticalmente el contenido
                                justifyContent: 'flex-start', // Alinea el contenido al principio (izquierda)
                                paddingHorizontal: RFPercentage(1), // Añade espaciado horizontal al contenido
                                backgroundColor: 'transparent',
                              }}>
                              <View
                                style={{
                                  marginRight: 'auto',
                                  marginLeft: RFPercentage(1),
                                }}>
                                <IconTemp
                                  name={item.icon}
                                  size={Size.iconSizeMin}
                                  style={{alignSelf: 'center'}}
                                />
                              </View>

                              <Text
                                style={{
                                  flex: 1,
                                  textAlign: 'left',
                                  fontWeight: '500',
                                  fontSize: FontSize.fontSizeText14 / fontScale,
                                  alignSelf: 'center',
                                  fontFamily: FontFamily.NotoSansDisplayMedium,
                                  color: '#000000',
                                  marginLeft: '15%',
                                }}>
                                {item.name}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                }}
              />
            </View>
          )}
        </View>
        <Spinner visible={waitingData} />
        <Toast />
        {/* </TouchableWithoutFeedback> */}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: RFPercentage(1),
  },
  stepDot: {
    width: widthPercentageToDP(2),
    height: heightPercentageToDP(1),
    borderRadius: 5,
    backgroundColor: 'lightgray',
    marginHorizontal: 5,
  },
  activeStepDot: {
    backgroundColor: Colors.contentQuaternaryLight,
  },
  stepText: {
    fontSize: 18,
    marginBottom: 20,
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
    elevation: 1,
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: widthPercentageToDP(85),
    marginVertical: '5%',
    alignSelf: 'center',
  },
  //estilos del input buscador de organizaciones

  input: {
    fontSize: FontSize.fontSizeText13,
    // marginBottom: 10,
    width: widthPercentageToDP(85),
    height: widthPercentageToDP(9),
    borderColor: 'grey',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: RFPercentage(1.4),
  },
  suggestionsList: {
    position: 'relative',
    top: 0,
    backgroundColor: 'white',
    // borderWidth: 1,
    borderColor: Colors.contentSecondaryDark,
    // borderBottomLeftRadius: 10,
    // borderBottomRightRadius: 10,
    // zIndex: 999,
    width: widthPercentageToDP(80),
    height: heightPercentageToDP(7),
    alignSelf: 'center',
    flexDirection: 'row',
    alignContent: 'center',
    alignItems: 'center',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0.1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  suggestionItem: {
    padding: 10,
    // borderBottomWidth: 1,
    height: RFPercentage(6),
    // backgroundColor: 'gray',
    textAlignVertical: 'center',
    color: 'black',
  },
});
