import React, {useContext, useEffect} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {PermissionsContext} from '../context/PermissionsContext';
import {LoginScreen} from '../screens/LoginScreen';
import {AuthContext} from '../context/AuthContext';
import {LoadingScreen} from '../screens/LoadingScreen';
import {MultipleNavigator} from './MultipleNavigator';
import {StyleSheet} from 'react-native';
import {PermissionsScreen} from '../screens/PermissionsScreen';
import SplashScreen from 'react-native-splash-screen';

const Stack = createStackNavigator();

export const Navigator = () => {
  //permite conocer por medio del contexto si se han garantizado los permisos que elijamos
  const {permissions} = useContext(PermissionsContext);

  //si no está logged, se le redirigirá hasta la pantalla de login
  const {status, isGuest} = useContext(AuthContext);
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  if (status === 'checking') {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: {
          backgroundColor: 'transparent',
        },
        headerTransparent: true,
      }}>
      {permissions.locationStatus === 'granted' &&
      permissions.camera === 'granted' ? (
        <>
          {status !== 'authenticated' && !isGuest ? (
            <>
              <Stack.Screen
                name="LoginScreen"
                component={LoginScreen}
                options={{
                  // transitionSpec: {
                  //   open: config,
                  //   close: config,
                  // },
                  cardStyleInterpolator: ({current, next, layouts}) => {
                    return {
                      cardStyle: {
                        transform: [
                          {
                            translateX: current.progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-layouts.screen.width, 0],
                            }),
                          },
                          {
                            scale: 1,
                          },
                        ],
                      },
                    };
                  },
                }}
              />
            </>
          ) : (
            // <Stack.Screen name="DrawerNavigation" component={DrawerNavigation} />
            // <Stack.Screen name="BottomTabNavigation" component={BottomTabNavigation} />
            <Stack.Screen
              name="MultipleNavigator"
              component={MultipleNavigator}
            />
          )}
        </>
      ) : (
        <Stack.Screen name="PermissionsScreen" component={PermissionsScreen} />
      )}

      {/* {permissions.locationStatus === 'granted' ? (
        <Stack.Screen name="MapScreen" component={MapScreen} />
      ) : (
        <Stack.Screen name="PermissionsScreen" component={PermissionsScreen} />
      )} */}
    </Stack.Navigator>
  );
};

const config = {
  // animation: 'timing',
  config: {
    stiffness: 1000,
    damping: 10000,
    mass: 12,
    overshootClamping: true,
    restDisplacementThreshold: 1.01,
    restSpeedThreshold: 1.01,
  },
};

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
