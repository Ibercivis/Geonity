import 'react-native-gesture-handler';

import React from 'react';



import {PermissionsProvider} from './src/context/PermissionsContext';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {Navigator} from './src/navigation/Navigator';
import {AuthProvider} from './src/context/AuthContext';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ModalProvider} from './src/context/ModalContext';
import { PaperProvider } from 'react-native-paper';

const App = () => {
  const tema = DefaultTheme;
  tema.colors.background = 'white';
  tema.colors.text = 'black';
  return (
    <AppAuth>
      <AppState>
        <SafeAreaProvider>
          <PaperProvider>
            <ModalProvider>
              <NavigationContainer theme={tema}>
                <Navigator />
              </NavigationContainer>
            </ModalProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </AppState>
    </AppAuth>
  );
};

const AppState = ({children}: any) => {
  return <PermissionsProvider>{children}</PermissionsProvider>;
};
const AppAuth = ({children}: any) => {
  return <AuthProvider>{children}</AuthProvider>;
};

export default App;
