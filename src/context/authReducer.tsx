import React from 'react';
import {User} from '../interfaces/appInterfaces';
import {AuthState} from './AuthContext';

type AuthAction =
  | {
      type: 'signIn';
      payload: {token: string, isGuest?: boolean};
    }
  | {
      type: 'signUp';
      payload: {token: string};
    }
  | {
      type: 'singOut';
    }
  | {type: 'addError'; payload: string}
  | {type: 'removeError'}
  | {type: 'notAuthenticated'}
  | {type: 'recoveryPass'; payload: string}
  | {type: 'changePass'; payload: string}
  | {type: 'setGuest'; payload: {isGuest: boolean}};

//genera estado
export const authReducer = (
  state: AuthState,
  action: AuthAction,
): AuthState => {
  switch (action.type) {
    case 'signUp':
      return {
        ...state,
        errorMessage: '',
        status: 'not-authenticated',
        token: action.payload.token,
        // token: null,
        isGuest: false,
      };

    case 'signIn':
      return {
        ...state,
        errorMessage: '',
        status: 'authenticated',
        token: action.payload.token,
        isGuest: action.payload.isGuest || false,
        // user: action.payload.user,
      };

    case 'singOut':
      return {
        ...state,
        status: 'not-authenticated',
        token: null,
        user: null,
        isGuest: false,
      };

    case 'addError':
      return {
        ...state,
        user: null,
        status: 'not-authenticated',
        token: null,
        errorMessage: action.payload,
      };

    case 'removeError':
      return {
        ...state,
        errorMessage: '',
        message: '',
      };

    case 'notAuthenticated':
      return {
        ...state,
        status: 'not-authenticated',
        token: null,
        user: null,
      };

    case 'recoveryPass':
      return {
        ...state,
        message: action.payload,
      };
    case 'changePass':
      return {
        ...state,
        message: action.payload,
      };

      case 'setGuest':
        return {
          ...state,
          isGuest: action.payload.isGuest,
        };
    default:
      return state;
  }
};
