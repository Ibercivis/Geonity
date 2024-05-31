import {StackScreenProps} from '@react-navigation/stack';
import {
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {Size} from '../theme/size';
// import {
//   GoogleSignin,
//   statusCodes,
// } from '@react-native-google-signin/google-signin';
import {useState, useContext, useRef, useEffect} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';
import {AuthContext} from '../context/AuthContext';
import {useForm} from '../hooks/useForm';
import {LoadingScreen} from './LoadingScreen';
import Wave from 'react-native-waveview';
import {FontFamily, FontSize} from '../theme/fonts';
import translate from '../theme/es.json';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {InputText} from '../components/utility/InputText';
import {Divider, HelperText} from 'react-native-paper';
import {Colors} from '../theme/colors';
import {CustomButton} from '../components/utility/CustomButton';
import {GeometryForms} from '../components/utility/GeometryForms';
import {Spinner} from '../components/utility/Spinner';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {PoliciesModal, SaveProyectModal} from '../components/utility/Modals';
import Toast from 'react-native-toast-message';
import {useLanguage} from '../hooks/useLanguage';
import { CustomButtonOutline } from '../components/utility/CustomButtonOutline';
import { GoogleSignin, statusCodes } from 'react-native-google-signin';

interface Props extends StackScreenProps<any, any> {}

export const LoginScreen = ({navigation, route}: Props) => {
  const {fontLanguage} = useLanguage();

  //#region VARIABLES

  /** COMÚN */
  const [nameScreen, setNameScreen] = useState('login');
  const [numberScreen, setNumberScreen] = useState(1);
  const {
    isGuest,
    signIn,
    signOut,
    signUp,
    errorMessage,
    removeError,
    recoveryPass,
    setIsGuest,
  } = useContext(AuthContext);

  //#region LOGIN VARIABLES
  const {fontScale} = useWindowDimensions();
  // si hay errores, el scroll se habilitará para que los elementos puedan ser visualizados
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const {top} = useSafeAreaInsets();
  const {onChange, form} = useForm({
    userName: '',
    password: '',
  });
  //#endregion

  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [userError, setUserError] = useState(false);
  const [passError, setPassError] = useState(false);

  //#region COMUNES
  const [onTouchBorderWidth, setOnTouchBorderWidth] = useState(0);
  const [onTouchBorderWidth2, setOnTouchBorderWidth2] = useState(0);
  const [onTouchBorderWidth3, setOnTouchBorderWidth3] = useState(0);
  const spinValue = useRef(new Animated.Value(0)).current;
  const transitionSpinValue = useRef(new Animated.Value(0)).current;
  const horizontalAnimation = useRef(new Animated.Value(0)).current;
  const [marginHorizontal, setMarginHorizontal] = useState(-28); //-28 el estable
  //#endregion

  //#region REGISTER VARIABLES

  const {
    username,
    email,
    password1,
    password2,
    onChange: onChangeRegister,
    form: formRegister,
  } = useForm({
    username: '',
    email: '',
    password1: '',
    password2: '',
  });

  const [usernameError, setUsernameError] = useState(false);
  const [mailRegisterError, setMailRegisterError] = useState(false);
  const [password1Error, setPassword1Error] = useState(false);
  const [password2Error, setPassword2Error] = useState(false);
  const [password2ErrorMessage, setPassword2ErrorMessage] = useState(
    fontLanguage.register_screen[0].password2_input_err1,
  );

  const [saveModal, setSaveModal] = useState(false);
  const showModalSave = () => setSaveModal(true);
  const hideModalSave = () => setSaveModal(false);

  const [singUpModal, setSingUpModal] = useState(false);
  const showModalSingUp = () => setSingUpModal(true);
  const hideModalSingUp = () => setSingUpModal(false);

  const [policiesModal, setPoliciesModal] = useState(false);
  const showModalPolicies = () => setPoliciesModal(true);
  const hideModalPolicies = () => setPoliciesModal(false);

  //#endregion

  //#region FORGET PASS
  const {onChange: onChangeForgot, form: formForgot} = useForm({
    email: '',
  });
  const [recoveryPassErr, setRecoveryPassErr] = useState(false);
  //#endregion

  //#endregion

  //#region USE EFFECTS
  /**
   * Termina la pantalla de carga
   */
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  useEffect(() => {
    // if (onTouchBorderWidth > 0) {
    setTimeout(() => {
      // navigation.replace('ForgotPassword');
      // setNameScreen('register')
      setOnTouchBorderWidth(0);
      setOnTouchBorderWidth2(0);
      setOnTouchBorderWidth3(0);
    }, 160);
    // }
  }, [onTouchBorderWidth, onTouchBorderWidth2, onTouchBorderWidth3]);

  useEffect(() => {
    setIsGuest(false);
    console.log(isGuest);
    GoogleSignin.configure({
      offlineAccess: true,
      iosClientId:
        '235777853257-djkpgca69noinapgft2ua7vgq2bcieg3.apps.googleusercontent.com',
      webClientId:
        '235777853257-rnbdsrqchtl76jq0givh1h6l7u47rs4k.apps.googleusercontent.com',
    });
  }, []);

  useEffect(() => {
    if (errorMessage.length === 0) return;
    if (errorMessage === '200') {
      console.log('Sin error');
      showModalSingUp();
      //TODO que solo llame al onTouchLogin cuando haya creado correctamente el usuario
      onTouchLogin();
      return;
    }
    setUserError(true);
    setRecoveryPassErr(true);
    Toast.show({
      type: 'error',
      text1: 'Error',
      // text2: 'No se han podido obtener los datos, por favor reinicie la app',
      text2: errorMessage,
    });
    removeError();
    hideModalSingUp();
  }, [errorMessage]);

  //#endregion

  //#region METHODS/LOGIN

  //aquí se comprobaría si existe el usuario y en caso de que sí, se le permitiría pasar
  const loggin = async () => {
    setLoading(true);
    Keyboard.dismiss();
    // console.log(JSON.stringify(form, null, 2));
    const state = await signIn(
      {
        correo: form.userName,
        password: form.password,
      },
      false,
    );
    setLoading(false);
  };

  const onGuest = async () => {
    setLoading(true);
    console.log('isGuest en login');
    const state = await setIsGuest(true);
    // console.log(state)
    console.log(isGuest);
    setLoading(false);
  };

  //TODO mover todo esto a un contexto para que se pueda controlar el logout desde cualquier lado
  const logginGoogle = async () => {
    try {
      setIsLoading(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log(JSON.stringify(userInfo, null, 2))
      setIsLoading(false);
      // signIn();
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
        console.log('SIGN IN CANCELLED');
        console.log(error.code);
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
        console.log('IN PROGRESS');
        console.log(error.code);
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
        console.log('PLAY SERVICES NOT AVAILABLE');
        console.log(error.code);
      } else {
        // some other error happened
        console.log('OTRO');
        console.log(error);
      }
      setIsLoading(false);
    }
  };

  //#endregion

  //#region METHODS/REGISTER
  const onRegister = async () => {
    setLoading(true);
    let valid = true;
    //valida correo
    const regex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
    const passvalidate = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

    if (formRegister.username.length <= 0) {
      valid = false;
      setUsernameError(true);
    }

    if (!regex.test(formRegister.email)) {
      valid = false;
      setMailRegisterError(true);
    }
    // console.log(JSON.stringify(formRegister, null, 2))
    if (!passvalidate.test(formRegister.password1)) {
      valid = false;
      setPassword1Error(true);
      // setPassword2Error(true);
    } else {
      setPassword1Error(false);
    }
    // primero se valida si está bien escrita la segunda pass
    if (!passvalidate.test(formRegister.password2)) {
      valid = false;
      setPassword2ErrorMessage(
        fontLanguage.register_screen[0].password2_input_err2,
      );
      setPassword2Error(true);
    } else {
      // si entra aquí significa que está bien escrita la pass2
      //ahora se mira si coincide con la 1
      if (!validatePassword(formRegister.password2)) {
        //si no coincide
        valid = false;
        // setPassword1Error(true);
        setPassword2ErrorMessage(
          fontLanguage.register_screen[0].password2_input_err1,
        );
        setPassword2Error(true);
      } else {
        setPassword2Error(false);
      }
    }

    Keyboard.dismiss();

    if (valid) {
      signUp({
        username: username,
        email: email,
        password1: password1,
        password2: password2,
      });
    } else {
      showModalSave();
    }
    setLoading(false);
  };

  const validatePassword = (value: any) => {
    if (value === formRegister.password1) {
      return true;
    } else {
      return false;
    }
  };
  //#endregion

  //#region METHODS/FORGOT
  const onChangeEmailForgot = (value: string) => {
    if (recoveryPassErr) {
      setRecoveryPassErr(false);
    }
    onChangeForgot(value, 'email');
  };

  const sendForgotenMail = () => {
    let valid = true;
    //valida correo
    const regex = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
    if (!regex.test(formForgot.email)) {
      valid = false;
      setRecoveryPassErr(true);
    }
    try {
      Keyboard.dismiss();
      if (valid) {
        recoveryPass(formForgot.email);
        onTouchLogin();
      }
    } catch (err) {
      console.log(JSON.stringify(err, null, 2));
    }
  };

  //#endregion

  //#region METHODS/ANIMATED-TIMMING
  const onTouchForgetPass = () => {
    setOnTouchBorderWidth(1.5);
    setNumberScreen(3);
    setTimeout(() => {
      // navigation.replace('ForgotPassword');
      setNameScreen('forgot');
    }, 160);
    // setIsAnimated(true);
    Animated.timing(spinValue, {
      toValue: 10,
      duration: 450,
      useNativeDriver: true,
    }).start();
    Animated.timing(transitionSpinValue, {
      toValue: 10,
      duration: 800,
      useNativeDriver: true,
    }).start();
    clearErrors();
  };

  const onTouchRegister = () => {
    setOnTouchBorderWidth2(1.5);
    setNumberScreen(2);
    setTimeout(() => {
      // navigation.replace('ForgotPassword');
      setNameScreen('register');
    }, 160);
    Animated.timing(spinValue, {
      toValue: 10,
      duration: 650,
      useNativeDriver: true,
    }).start();
    Animated.timing(transitionSpinValue, {
      toValue: 10,
      duration: 800,
      useNativeDriver: true,
    }).start();
    clearErrors();
  };

  const onTouchLogin = () => {
    setOnTouchBorderWidth3(1.5);
    setNumberScreen(1);
    setTimeout(() => {
      // setNameScreen('login');
    }, 160);
    Animated.timing(spinValue, {
      toValue: 0,
      duration: 650,
      useNativeDriver: true,
    }).start();
    Animated.timing(transitionSpinValue, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
    clearErrors();
  };

  const clearErrors = () => {
    setPassError(false);
    setUserError(false);
    setUsernameError(false);
    setPassword1Error(false);
    setPassword2Error(false);
    setMailRegisterError(false);
  };

  //#endregion

  if (isLoading) {
    return <LoadingScreen />;
  }

  const screenHorizontal = () => {
    switch (nameScreen) {
      case 'register':
        return (
          // <ScrollView style={{width: '100%', flexGrow: 1}}>
          <View style={{marginHorizontal: '3%'}}>
            <View style={{}}>
              {/* contenedor de los inputs */}
              <View
                style={{
                  // width: '100%',
                  height: 'auto',
                  alignSelf: 'center',
                  justifyContent: 'center',
                }}>
                {/* name */}
                <View
                  style={{
                    // width: '100%',
                    height: 'auto',
                    flexDirection: 'row',
                    // flex: 1
                  }}>
                  <View
                    style={{
                      left: '-5%',
                      top: '50%',
                      alignSelf: 'center',
                      justifyContent: 'center',
                      position: 'absolute',
                    }}>
                    {/* primero si se ve o si no ( si el usuario ha pinchado en el input ) y luego si está bien o mal  */}
                    {false ? (
                      <GeometryForms
                        name="circle-fill"
                        size={Size.iconSizeExtraMin}
                        color={Colors.semanticSuccessLight}
                      />
                    ) : (
                      <></>
                    )}
                  </View>
                  <InputText
                    label={fontLanguage.register_screen[0].user_name_input}
                    keyboardType="email-address"
                    multiline={false}
                    numOfLines={1}
                    isValid={!usernameError}
                    onChangeText={value => {
                      onChangeRegister(value, 'username');
                      if (usernameError) {
                        setUsernameError(false);
                      }
                    }}
                  />
                </View>
                {usernameError ? (
                  <HelperText
                    type="error"
                    visible={true}
                    style={{
                      fontSize: FontSize.fontSizeText13 / fontScale,
                      fontFamily: FontFamily.NotoSansDisplayLight,
                      color: Colors.semanticWarningDark,
                      right: '3%',
                      fontWeight: '600',
                    }}>
                    {fontLanguage.register_screen[0].user_name_input_err}
                  </HelperText>
                ) : (
                  <></>
                )}

                {/* email */}
                <View
                  style={{
                    // width: '100%',
                    height: 'auto',
                    flexDirection: 'row',
                  }}>
                  <View
                    style={{
                      left: '-5%',
                      top: '50%',
                      alignSelf: 'center',
                      justifyContent: 'center',
                      position: 'absolute',
                    }}>
                    {false ? (
                      <GeometryForms
                        name="circle-fill"
                        size={Size.iconSizeExtraMin}
                        color={Colors.semanticSuccessLight}
                      />
                    ) : (
                      <></>
                    )}
                  </View>
                  <InputText
                    label={fontLanguage.register_screen[0].email_input}
                    keyboardType="email-address"
                    multiline={false}
                    numOfLines={1}
                    isValid={!mailRegisterError}
                    onChangeText={value => {
                      onChangeRegister(value, 'email');
                      if (mailRegisterError) {
                        setMailRegisterError(false);
                      }
                    }}
                  />
                </View>
                {mailRegisterError ? (
                  <HelperText
                    type="error"
                    visible={true}
                    style={{
                      fontSize: FontSize.fontSizeText13 / fontScale,
                      fontFamily: FontFamily.NotoSansDisplayLight,
                      color: Colors.semanticWarningDark,
                      right: '3%',
                      fontWeight: '600',
                    }}>
                    {fontLanguage.register_screen[0].email_input_err}
                  </HelperText>
                ) : (
                  <></>
                )}
                {/* password */}
                <View
                  style={{
                    // width: '100%',
                    height: 'auto',
                    flexDirection: 'row',
                  }}>
                  <View
                    style={{
                      left: '-5%',
                      top: '50%',
                      alignSelf: 'center',
                      justifyContent: 'center',
                      position: 'absolute',
                    }}>
                    {false ? (
                      <GeometryForms
                        name="circle-fill"
                        size={Size.iconSizeExtraMin}
                        color={Colors.semanticSuccessLight}
                      />
                    ) : (
                      <></>
                    )}
                  </View>
                  <InputText
                    // isInputText={() => setIsInputText(!isInputText)}
                    label={fontLanguage.register_screen[0].password1_input}
                    inputType={true}
                    multiline={false}
                    numOfLines={1}
                    isSecureText={true}
                    isValid={!password1Error}
                    onChangeText={value => {
                      onChangeRegister(value, 'password1');
                      if (password1Error) {
                        setPassword1Error(false);
                      }
                    }}
                  />
                </View>
                {password1Error ? (
                  <HelperText
                    type="error"
                    visible={true}
                    style={{
                      fontSize: FontSize.fontSizeText13 / fontScale,
                      fontFamily: FontFamily.NotoSansDisplayLight,
                      color: Colors.semanticWarningDark,
                      right: '3%',
                      fontWeight: '600',
                    }}>
                    {fontLanguage.register_screen[0].password1_input_err}
                  </HelperText>
                ) : (
                  <></>
                )}
                {/*confirm password */}
                <View
                  style={{
                    // width: '100%',
                    height: 'auto',
                    flexDirection: 'row',
                  }}>
                  <View
                    style={{
                      left: '-5%',
                      top: '50%',
                      alignSelf: 'center',
                      justifyContent: 'center',
                      position: 'absolute',
                    }}>
                    {false ? (
                      <GeometryForms
                        name="circle-fill"
                        size={Size.iconSizeExtraMin}
                        color={Colors.semanticSuccessLight}
                      />
                    ) : (
                      <></>
                    )}
                  </View>
                  <InputText
                    // isInputText={() => setIsInputText(!isInputText)}
                    label={fontLanguage.register_screen[0].password2_input}
                    inputType={true}
                    multiline={false}
                    numOfLines={1}
                    isSecureText={true}
                    isValid={!password2Error}
                    onChangeText={value => {
                      onChangeRegister(value, 'password2');
                      if (password2Error) {
                        setPassword2Error(false);
                      }
                    }}
                  />
                </View>
                {password2Error ? (
                  <HelperText
                    type="error"
                    visible={true}
                    style={{
                      fontSize: FontSize.fontSizeText13 / fontScale,
                      fontFamily: FontFamily.NotoSansDisplayLight,
                      color: Colors.semanticWarningDark,
                      right: '3%',
                      fontWeight: '600',
                    }}>
                    {password2ErrorMessage}
                  </HelperText>
                ) : (
                  <></>
                )}
              </View>

              {/* register button */}
              <CustomButton
                backgroundColor={Colors.secondaryDark}
                label={fontLanguage.register_screen[0].register_button}
                onPress={() => showModalPolicies()}
              />
              {/* divider */}
              <View
                style={{
                  flexDirection: 'row',
                  // width: '100%',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '10%',
                }}>
                <Divider style={{borderWidth: 0.6, width: '45%'}} />
                <Text
                  style={{
                    alignItems: 'center',
                    fontWeight: 'bold',
                    color: 'black',
                  }}>
                  o
                </Text>
                <Divider style={{borderWidth: 0.6, width: '45%'}} />
              </View>

              {/* loggin buttons */}
              {/* <View style={styles.loginButtonsContainer}>
                  <CustomButtonOutline
                    backgroundColor="white"
                    fontColor="black"
                    iconLeft="google"
                    label={fontLanguage.register_screen[0].register_google}
                    onPress={() => console.log()}
                  />
                  <CustomButtonOutline
                    backgroundColor="white"
                    fontColor="black"
                    iconLeft="apple"
                    label={fontLanguage.register_screen[0].register_apple}
                    onPress={() => console.log()}
                  />
                  <CustomButtonOutline
                    backgroundColor="white"
                    fontColor="black"
                    iconLeft="microsoft"
                    label={
                      fontLanguage.register_screen[0].register_microsoft
                    }
                    onPress={() => console.log()}
                  />
                </View> */}

              {/* back */}
              <View style={{marginHorizontal: '20%', marginTop: '10%'}}>
                <TouchableOpacity
                  activeOpacity={1}
                  style={{
                    alignSelf: 'center',
                    flexDirection: 'row',
                    borderBottomWidth: onTouchBorderWidth2,
                    borderBottomColor: Colors.primaryLigth,
                  }}
                  onPress={() => onTouchLogin()}
                  onFocus={() => setOnTouchBorderWidth2(0)}>
                  <Text
                    style={{
                      color: 'black',
                      fontWeight: '400',
                      fontFamily: FontFamily.NotoSansDisplayRegular,
                      fontSize: FontSize.fontSizeText13 / fontScale,
                    }}>
                    {fontLanguage.register_screen[0].have_account}
                  </Text>
                  <Text
                    style={{
                      color: Colors.primaryLigth,
                      fontWeight: '600',
                      fontFamily: FontFamily.NotoSansDisplaySemiBold,
                      fontSize: FontSize.fontSizeText13 / fontScale,
                    }}>
                    {fontLanguage.register_screen[0].enter}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          // </ScrollView>
        );
      case 'forgot':
        return (
          <View style={{marginHorizontal: '1%'}}>
            {/* info */}
            <View
              style={{
                justifyContent: 'center',
                alignSelf: 'center',
                marginTop: '7%',
                marginBottom: '8%',
              }}>
              <Text
                style={{
                  fontFamily: FontFamily.NotoSansDisplayMedium,
                  fontSize: FontSize.fontSizeText18 / fontScale,
                  color: 'black',
                  textAlignVertical: 'center',
                  textAlign: 'center',
                  marginBottom: '1%',
                }}>
                {fontLanguage.recovery_screen[0].title_info}
              </Text>
              <Text
                style={{
                  fontFamily: FontFamily.NotoSansDisplayLight,
                  fontSize: FontSize.fontSizeText14 / fontScale,
                  color: 'black',
                  marginHorizontal: '13%',
                  marginTop: '7%',
                  textAlignVertical: 'center',
                  textAlign: 'center',
                }}>
                {fontLanguage.recovery_screen[0].content_info}
              </Text>
            </View>
            <View>
              {/* email */}
              <InputText
                // isInputText={() => setIsInputText(!isInputText)}
                label={fontLanguage.login_screen[0].mail_input_recover}
                keyboardType="email-address"
                multiline={false}
                numOfLines={1}
                onChangeText={value => onChangeEmailForgot(value)}
              />
            </View>
            {recoveryPassErr ? (
              <HelperText
                type="error"
                visible={true}
                style={{
                  fontSize: FontSize.fontSizeText13,
                  fontFamily: FontFamily.NotoSansDisplayLight,
                  color: Colors.semanticWarningDark,
                  right: '3%',
                  fontWeight: '600',
                }}>
                {fontLanguage.login_screen[0].mail_input_recover_err}
              </HelperText>
            ) : (
              <></>
            )}
            <View
              style={{
                marginBottom: '15.5%',
              }}>
              <CustomButton
                backgroundColor={Colors.secondaryDark}
                label={fontLanguage.recovery_screen[0].send_email}
                onPress={() => sendForgotenMail()}
              />
            </View>
            {/* divider */}
            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                justifyContent: 'space-between',
                alignItems: 'center',
                // marginTop: '10%',
              }}>
              <Divider style={{borderWidth: 0.6, width: '45%'}} />
              <Text
                style={{
                  alignItems: 'center',
                  fontWeight: 'bold',
                  color: 'black',
                }}>
                o
              </Text>
              <Divider style={{borderWidth: 0.6, width: '45%'}} />
            </View>
            {/* button create */}
            {/* 
            
            <View
              style={{
                marginHorizontal: '26%',
                marginTop: '2%',
                zIndex: 1,
              }}>
              <CustomButton
                backgroundColor={Colors.primaryDark}
                fontFamily={FontFamily.NotoSansDisplayRegular}
                label={fontLanguage.recovery_screen[0].create_account}
                onPress={() => navigation.replace('LoginScreen')}
              />
            </View>
            
            */}

            {/* back */}
            <View
              style={{marginHorizontal: '26%', marginTop: '15%', zIndex: 2}}>
              <TouchableOpacity
                activeOpacity={1}
                style={{
                  alignSelf: 'center',
                  flexDirection: 'row',
                  borderBottomWidth: onTouchBorderWidth3,
                  borderBottomColor: Colors.primaryLigth,
                }}
                onPress={() => onTouchLogin()}
                onFocus={() => setOnTouchBorderWidth3(0)}>
                <Text
                  style={{
                    color: Colors.primaryLigth,
                    fontWeight: '600',
                    fontFamily: FontFamily.NotoSansDisplaySemiBold,
                    fontSize: FontSize.fontSizeText13,
                  }}>
                  {fontLanguage.recovery_screen[0].back}
                </Text>
                <Text
                  style={{
                    color: 'black',
                    fontWeight: '400',
                    fontFamily: FontFamily.NotoSansDisplayRegular,
                    fontSize: FontSize.fontSizeText13,
                  }}>
                  {fontLanguage.recovery_screen[0].session}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return <></>;
    }
  };

  return (
    <>
      {/* <ScrollView
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled"> */}
      {/* Ocultar la barra de estado */}
      <StatusBar hidden />
      <KeyboardAvoidingView style={styles.parent}>
        {/* contenedor de formas geometricas y titulo */}
        <SafeAreaView style={styles.child1}>
          <View
            style={{
              position: 'absolute',
              zIndex: 999,
              bottom: -5,
              backgroundColor: 'white',
            }}>
            <Image
              style={styles.titleImage}
              source={require('../assets/backgrounds/Portada.png')}
            />
            <View
              style={{
                position: 'absolute',
                justifyContent: 'center',
                bottom: '30%',
                alignSelf: 'center',
              }}>
              <Text
                style={{
                  fontFamily: FontFamily.NotoSansDisplayMedium,
                  fontSize: FontSize.fontSizeText18 / fontScale,
                  color: 'white',
                }}>
                {numberScreen === 2
                  ? fontLanguage.login_screen[0].subtitle_register
                  : numberScreen === 3
                  ? fontLanguage.login_screen[0].subtitle_problems
                  : fontLanguage.login_screen[0].subtitle}
              </Text>
            </View>
            <Animated.View
              style={{
                flex: 1,
                marginVertical: 0,
                marginHorizontal: RFPercentage(marginHorizontal), //-88
                backgroundColor: 'transparent',
                transform: [
                  {
                    translateX: spinValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, widthPercentageToDP(-10.5)],
                    }),
                  },
                ],
              }}>
              <Wave
                style={{flex: 1}}
                H={RFPercentage(6)}
                waveParams={[
                  {A: RFPercentage(9), T: RFPercentage(60), fill: '#FFF'},
                ]}
                animated={false}
              />
            </Animated.View>
          </View>
        </SafeAreaView>
        <ScrollView
          scrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          // disableScrollViewPanResponder={true}
          showsVerticalScrollIndicator={false}>
          {/* contenedor de los elementos  */}
          <View style={styles.child2}>
            <View style={styles.inputsContainer}>
              {/* aquí va el contenido */}
              <Animated.View
                style={{
                  flexDirection: 'row',
                  transform: [
                    {
                      translateX: transitionSpinValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, widthPercentageToDP(-10.5)],
                      }),
                    },
                  ],
                }}>
                <View style={{marginHorizontal: '9%'}}>
                  {/* inputs */}
                  <View>
                    {/* email */}
                    <InputText
                      // isInputText={() => setIsInputText(!isInputText)}
                      label={fontLanguage.login_screen[0].mail_input}
                      keyboardType="email-address"
                      multiline={false}
                      numOfLines={1}
                      onChangeText={value => onChange(value, 'userName')}
                    />
                    {false ? (
                      <HelperText
                        type="error"
                        visible={true}
                        style={{
                          fontSize: FontSize.fontSizeText13,
                          fontFamily: FontFamily.NotoSansDisplayLight,
                          color: Colors.semanticWarningDark,
                          right: '3%',
                          fontWeight: '600',
                        }}>
                        {fontLanguage.new_project_screen[0].project_name_helper}
                      </HelperText>
                    ) : (
                      <></>
                    )}
                    {/* password */}
                    <InputText
                      // isInputText={() => setIsInputText(!isInputText)}
                      label={fontLanguage.login_screen[0].password_input}
                      inputType={true}
                      multiline={false}
                      numOfLines={1}
                      isSecureText={true}
                      onChangeText={value => onChange(value, 'password')}
                    />
                    {false ? (
                      <HelperText
                        type="error"
                        visible={true}
                        style={{
                          fontSize: FontSize.fontSizeText13,
                          fontFamily: FontFamily.NotoSansDisplayLight,
                          color: Colors.semanticWarningDark,
                          right: '3%',
                          fontWeight: '600',
                        }}>
                        {fontLanguage.new_project_screen[0].project_name_helper}
                      </HelperText>
                    ) : (
                      <></>
                    )}
                  </View>

                  <CustomButton
                    backgroundColor={Colors.secondaryDark}
                    label={fontLanguage.login_screen[0].login_button}
                    onPress={() => loggin()}
                  />

                  <TouchableOpacity
                    activeOpacity={1}
                    style={{
                      alignSelf: 'flex-end',
                      marginTop: '5%',
                      flexDirection: 'row',
                      borderBottomWidth: onTouchBorderWidth,
                      borderBottomColor: Colors.primaryLigth,
                    }}
                    onPress={() => onTouchForgetPass()}
                    onFocus={() => setOnTouchBorderWidth(0)}>
                    <Text
                      style={{
                        color: 'black',
                        fontWeight: '400',
                        fontFamily: FontFamily.NotoSansDisplayRegular,
                        fontSize: FontSize.fontSizeText13 / fontScale,
                      }}>
                      {fontLanguage.login_screen[0].recovery_password}
                    </Text>
                    <Text
                      style={{
                        color: Colors.primaryLigth,
                        fontWeight: '600',
                        fontFamily: FontFamily.NotoSansDisplaySemiBold,
                        fontSize: FontSize.fontSizeText13 / fontScale,
                      }}>
                      {fontLanguage.login_screen[0].recovery_password_2}
                    </Text>
                  </TouchableOpacity>

                  {/* loggin buttons */}
                  {/* <View style={styles.loginButtonsContainer}>
                    <CustomButtonOutline
                      backgroundColor="white"
                      fontColor="black"
                      iconLeft="google"
                      label={fontLanguage.login_screen[0].loggin_google}
                      onPress={() => logginGoogle()}
                    />
                    <CustomButtonOutline
                        backgroundColor="white"
                        fontColor="black"
                        iconLeft="apple"
                        label={fontLanguage.login_screen[0].loggin_apple}
                        onPress={() => console.log()}
                      />
                      <CustomButtonOutline
                        backgroundColor="white"
                        fontColor="black"
                        iconLeft="microsoft"
                        label={
                          fontLanguage.login_screen[0].loggin_microsoft
                        }
                        onPress={() => console.log()}
                      />
                  </View>  */}

                  {/* divider */}
                  <View>
                    <View
                      style={{
                        flexDirection: 'row',
                        width: '100%',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '14%',
                      }}>
                      <Divider style={{borderWidth: 0.6, width: '45%'}} />
                      <Text
                        style={{
                          alignItems: 'center',
                          fontWeight: 'bold',
                          color: 'black',
                        }}>
                        o
                      </Text>
                      <Divider style={{borderWidth: 0.6, width: '45%'}} />
                    </View>
                    <View
                      style={{
                        marginHorizontal: '26%',
                        marginTop: '14%',
                        marginBottom: '10%',
                      }}>
                      <CustomButton
                        backgroundColor={Colors.primaryDark}
                        fontFamily={FontFamily.NotoSansDisplayRegular}
                        label={fontLanguage.login_screen[0].register}
                        onPress={() =>
                          // navigation.replace('RegisterScreen')
                          onTouchRegister()
                        }
                      />
                    </View>
                  </View>
                  {/* invitado */}

                  <TouchableOpacity
                    activeOpacity={0.4}
                    style={{
                      alignSelf: 'center',
                      marginTop: '5%',
                      marginBottom: '20%',
                      flexDirection: 'row',
                      zIndex: 2,
                      borderRadius: 10,
                      backgroundColor: 'white',
                      shadowColor: '#000',
                      shadowOffset: {
                        width: 0,
                        height: 1,
                      },
                      shadowOpacity: 0.2,
                      shadowRadius: 1.41,
                      // width: '100%',
                      elevation: Platform.OS == 'android' ? 1 : 0,
                    }}
                    onPress={() => onGuest()}>
                    <Text
                      style={{
                        color: 'black',
                        fontWeight: '400',
                        fontFamily: FontFamily.NotoSansDisplayRegular,
                        fontSize: FontSize.fontSizeText15,
                        marginHorizontal: '3%',
                        marginVertical: ' 1%',
                      }}>
                      {fontLanguage.login_screen[0].guest}
                    </Text>
                  </TouchableOpacity>
                  <View style={{marginTop: '20%'}}></View>
                </View>
                {/* <View style={{width: '25.4%', backgroundColor: 'blue'}}></View> */}
                <SafeAreaView>
                  <View
                    style={{
                      alignContent: 'center',
                      alignItems: 'center',
                      alignSelf: 'center',
                      marginLeft: widthPercentageToDP(13),
                      width: widthPercentageToDP(85),
                      // backgroundColor:'yellow'
                    }}>
                    {screenHorizontal()}
                  </View>
                </SafeAreaView>
              </Animated.View>
            </View>
          </View>
          <Spinner visible={loading} />

          <SaveProyectModal
            visible={saveModal}
            hideModal={hideModalSave}
            onPress={hideModalSave}
            size={RFPercentage(8)}
            color={Colors.semanticWarningDark}
            label={fontLanguage.modals[0].save_project_login_err}
            helper={false}
          />

          <SaveProyectModal
            visible={singUpModal}
            hideModal={hideModalSingUp}
            onPress={hideModalSingUp}
            size={RFPercentage(8)}
            color={Colors.semanticSuccessLight}
            label={fontLanguage.modals[0].singup_message}
            helper={true}
          />
          <PoliciesModal
            visible={policiesModal}
            hideModal={hideModalPolicies}
            onPress={() => {
              onRegister(), hideModalPolicies();
            }}
            size={RFPercentage(8)}
            color={Colors.semanticWarningDark}
            label=""
            helper={false}
          />
        </ScrollView>
        <Toast position="bottom" />
      </KeyboardAvoidingView>
      {/* </ScrollView> */}
      {/* <LoginTemplate navigation={navigation} route={route} /> */}
    </>
  );
};

const styles = StyleSheet.create({
  parent: {
    flex: 1,
    backgroundColor: 'white',
  },
  inputsContainer: {
    height: 'auto',
    backgroundColor: 'white',
    // marginHorizontal: '9%',
    marginTop: '5%',
    marginBottom: '17%',
    // right: '1%',
  },
  loginButtonsContainer: {
    marginHorizontal: '17%',
    marginTop: '10%',
    marginBottom: '5%',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'white',
    height: heightPercentageToDP(5), //15 para todos
  },
  child1: {
    height: '28%',
    backgroundColor: 'white',
  },
  child2: {
    height: '70%',
    backgroundColor: 'white',
  },
  titleImage: {
    alignSelf: 'center',
    height: Size.globalHeight / 2.6,
    width: Size.globalWidth,
    left: 0,
    bottom: 4,
  },
});
