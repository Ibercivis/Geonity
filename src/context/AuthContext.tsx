import React, {createContext, useEffect, useReducer} from 'react';
import {authReducer} from './authReducer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LoginData,
  LoginResponse,
  RegisterData,
  RegisterResponse,
  User,
} from '../interfaces/appInterfaces';
import citmapApi from '../api/citmapApi';

//definir la información que habrá aquí
export interface AuthState {
  status: 'checking' | 'authenticated' | 'not-authenticated';
  token: string | null;
  errorMessage: string;
  message: string;
  user: User | null;
  isGuest: boolean;
}

//estado inicial
const authInitialState: AuthState = {
  user: null,
  token: null,
  errorMessage: '',
  message: '',
  status: 'checking',
  isGuest: false,
};

//definir todo lo que el contexto va a pasarle a los hijos. Le dice a react como luce y que expone el context
type AuthContextProps = {
  errorMessage: string;
  message: string;
  token: string | null;
  user: User | null;
  signIn: (loginData: LoginData, isGuest: boolean) => Promise<boolean>;
  signUp: (data: RegisterData) => void;
  signOut: () => void;
  setIsGuest: (setGuest: boolean) => void;
  status: 'checking' | 'authenticated' | 'not-authenticated';
  removeError: () => void;
  recoveryPass: (email: string) => void;
  changePass: (pass1: string, pass2: string) => void;
  isGuest: boolean;
  // setUsername: (userName: string) => void;
  // setPassword: (password: string) => void;
};

//crea el contexto
export const AuthContext = createContext({} as AuthContextProps);

//componente proveedor del estado
export const AuthProvider = ({children}: any) => {
  const [authState, action] = useReducer(authReducer, authInitialState);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return action({type: 'notAuthenticated'});
    const key = 'Token ' + token;
    let keyToken;
    try {
      const resp = await citmapApi.get('/users/authentication/user/', {
        headers: {
          Authorization: token,
        },
      });
      keyToken = JSON.stringify(resp.config.headers.Authorization, null, 1);
      // console.log(keyToken);
      if (resp.status !== 200) {
        await AsyncStorage.removeItem('token');
        return action({type: 'notAuthenticated'});
      } else {
        // console.log(JSON.stringify(resp.status, null, 2));
        await AsyncStorage.setItem('token', token);
        action({
          type: 'signIn',
          payload: {
            token: token,
            isGuest: false,

            // user: resp.data.usuario,
          },
        });
      }
    } catch (err) {
      await AsyncStorage.removeItem('token');
      return action({type: 'notAuthenticated'});
    }

    // await AsyncStorage.setItem('token', keyToken);
  };

  const signIn = async (loginData: LoginData) => {
    try {
      const resp = await citmapApi.post('/users/authentication/login/', {
        username: loginData.correo,
        password: loginData.password,
      });
      // console.log('LOGGED');
      // console.log(JSON.stringify(resp, null, 2));
      if (resp.data) {
        action({
          type: 'signIn',
          payload: {
            token: resp.data.key,
            isGuest: false,
          },
        });

        let key = 'Token ' + resp.data.key;
        //cuando se loggea, hay que guardar el token como "Token (token)"
        await AsyncStorage.setItem('token', key);
        // console.log(JSON.stringify(resp.data, null, 2));
        console.log(key);
      } else {
        action({
          type: 'addError',
          payload:
            'No se pudo iniciar sesión debido a un problema en el servidor',
        });
      }
      return true;
    } catch (err: any) {
      //TODO arreglar para que capture los errores bien
      console.log('Error completo:');
      console.log(JSON.stringify(err, null, 2));

      console.log('Mensaje de error:');
      console.log(JSON.stringify(err.message, null, 2));

      if (err.response) {
        console.log('Código de estado de la respuesta:');
        console.log(JSON.stringify(err.response.status, null, 2));
        console.log('Datos de respuesta del servidor:');
        console.log(JSON.stringify(err.response.data, null, 2));
      } else if (err.request) {
        console.log('No se recibió respuesta del servidor');
        console.log('Solicitud:');
        console.log(JSON.stringify(err.request, null, 2));
      } else {
        console.log('Error al realizar la solicitud:');
        console.log(JSON.stringify(err.message, null, 2));
      }
      // return false;

      let textError = '';
      const dataError = JSON.stringify(err.response.data, null);
      const dataErrorObj = JSON.parse(dataError);
      for (const x in dataErrorObj) {
        textError += dataErrorObj[x] + '\n';
      }
      action({
        type: 'addError',
        payload: textError,
      });
      return false;
    }
  };

  const signUp = async (data: RegisterData) => {
    try {
      const resp = await citmapApi.post<RegisterResponse>(
        '/users/registration/',
        {
          username: data.username,
          email: data.email,
          password1: data.password1,
          password2: data.password2,
        },
      );
      if (resp.data) {
        let key = 'Token ' + resp.data.key;
        console.log(key); // Accede a la clave "key" del objeto
        await AsyncStorage.setItem('token', key);
        action({
          type: 'signUp',
          payload: {token: key},
        });
      }
    } catch (err: any) {
      console.log(err.response.data);
      let textError = '';
      const dataError = JSON.stringify(err.response.data, null);
      const dataErrorObj = JSON.parse(dataError);
      for (const x in dataErrorObj) {
        textError += dataErrorObj[x] + '\n';
      }
      console.log(textError);
      action({
        type: 'addError',
        payload: textError,
      });
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('token');
    action({type: 'singOut'});
  };

  const removeError = () => {
    action({type: 'removeError'});
  };

  const recoveryPass = async (email: string) => {
    try {
      console.log('entra en recovery');
      const resp = await citmapApi.post(
        '/users/authentication/password/reset/',
        {
          email: email,
        },
      );
      action({
        type: 'recoveryPass',
        payload: resp.data.detail,
      });
    } catch (err: any) {
      action({
        type: 'addError',
        payload: err.message,
      });
    }
  };
  const changePass = async (pass1: string, pass2: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const resp = await citmapApi.post(
        '/authentication/password/change/',
        {
          new_password1: pass1,
          new_password2: pass2,
        },
        {
          headers: {
            Authorization: token,
          },
        },
      );
      action({
        type: 'changePass',
        payload: resp.data.detail,
      });
    } catch (err: any) {
      action({
        type: 'addError',
        payload: err.message,
      });
    }
  };

  const setIsGuest = async (setGuest: boolean) => {
    action({
      type: 'setGuest',
      payload: {isGuest: setGuest},
    });
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        signIn,
        signOut,
        signUp,
        removeError,
        recoveryPass,
        changePass,
        setIsGuest,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
