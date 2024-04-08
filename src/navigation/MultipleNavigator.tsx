import {createStackNavigator} from '@react-navigation/stack';
import React, {useContext, useEffect} from 'react';
import {BottomTabNavigation} from './BottomTabNavigation';
import {CreateProject} from '../components/screen_components/Project/CreateProject';
import {CreateOrganization} from '../components/screen_components/Organization/CreateOrganization';
import { ProjectPage } from '../components/screen_components/Home/ProjectPage';
import { ParticipateMap } from '../components/screen_components/Project/ParticipateMap';
import { OrganizationPage } from '../components/screen_components/Home/OrganizationPage';
import { ProjectList } from '../components/screen_components/Home/ProjectList';
import { OrganizationList } from '../components/screen_components/Home/OrganizationList';
import { Location } from '../interfaces/appInterfaces';
export type StackParams = {
  BottomTabNavigation: undefined;
  ModalScreen: undefined;
  CreateProject: {
    id?: number;
  };
  CreateOrganization: {
    id?: number;
  };
  ProjectPage: {
    id: number;
    isNew?: boolean;
    fromProfile?: boolean;
  };
  OrganizationPage: {
    id: number;
    isNew?: boolean;
  };
  ParticipateMap: {
    id: number;
    coords?: Location;
  };
  ProjectList: {
    id?: number;
    title?: string
  };
  OrganizationList: {
    id?: number;
    // dashboard?: boolean;
  };
};
const Stack = createStackNavigator<StackParams>();

export function MultipleNavigator() {
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          zIndex: -999,
        },
        cardStyle:{
          backgroundColor:'white'
        },
      }}>
      <Stack.Screen
        name="BottomTabNavigation"
        component={BottomTabNavigation}
      />
      <Stack.Screen name="CreateProject" component={CreateProject} />
      <Stack.Screen name="CreateOrganization" component={CreateOrganization} />
      <Stack.Screen name="ProjectPage" component={ProjectPage} />
      <Stack.Screen name="OrganizationPage" component={OrganizationPage} />
      <Stack.Screen name="ProjectList" component={ProjectList} />
      <Stack.Screen name="OrganizationList" component={OrganizationList} />
      <Stack.Screen
        name="ParticipateMap"
        component={ParticipateMap}
        options={({navigation}) => ({
         
        })}
      />
    </Stack.Navigator>
  );
}
