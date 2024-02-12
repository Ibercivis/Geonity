import React, {useEffect, useState} from 'react';
import {Platform, NativeModules} from 'react-native';
import {formatISO, addHours} from 'date-fns';
import translateES from '../theme/es.json';
import translateEN from '../theme/en.json';

export const useLanguage = () => {
  const deviceLanguage =
    Platform.OS === 'ios'
      ? NativeModules.SettingsManager.settings.AppleLocale ||
        NativeModules.SettingsManager.settings.AppleLanguages[0] //iOS 13
      : NativeModules.I18nManager.localeIdentifier;
  
  const fontLanguage = NativeModules.I18nManager.localeIdentifier === 'es_ES' ? translateES.strings : translateEN.strings;

  return {deviceLanguage, fontLanguage};
};
