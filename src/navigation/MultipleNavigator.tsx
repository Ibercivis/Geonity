import {createStackNavigator} from '@react-navigation/stack';
import React, {useContext, useEffect} from 'react';
import {BottomTabNavigation} from './BottomTabNavigation';
import {CreateProject} from '../components/screen_components/Project/CreateProject';
import {CreateOrganization} from '../components/screen_components/Organization/CreateOrganization';

export type StackParams = {
  BottomTabNavigation: undefined;
  ModalScreen: undefined;
  CreateProject: {
    id?: number;
  };
  CreateOrganization: {
    id?: number;
  };
  
};
const Stack = createStackNavigator<StackParams>();

export function MultipleNavigator() {
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          // zIndex: -999,
        },
      }}>
      <Stack.Screen
        name="BottomTabNavigation"
        component={BottomTabNavigation}
      />
      <Stack.Screen name="CreateProject" component={CreateProject} />
      <Stack.Screen name="CreateOrganization" component={CreateOrganization} />

      
    </Stack.Navigator>
  );
}
