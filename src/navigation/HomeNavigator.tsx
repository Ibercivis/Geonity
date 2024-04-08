import {createStackNavigator} from '@react-navigation/stack';
import {Mark, HasTag, Topic} from '../interfaces/appInterfaces';
import {HomeScreen} from '../screens/HomeScreen';
import {ProjectList} from '../components/screen_components/Home/ProjectList';
import {ProjectPage} from '../components/screen_components/Home/ProjectPage';
import {OrganizationList} from '../components/screen_components/Home/OrganizationList';
import {OrganizationPage} from '../components/screen_components/Home/OrganizationPage';
import {useContext, useEffect} from 'react';
import {PermissionsContext} from '../context/PermissionsContext';
import {ParticipateMap} from '../components/screen_components/Project/ParticipateMap';
import {PermissionsScreen} from '../screens/PermissionsScreen';

export type StackParams = {
  HomeScreen: {
    dashboard?: boolean;
  };
  ProjectList: {
    id?: number;
    title?: string
  };
  OrganizationList: {
    id?: number;
    // dashboard?: boolean;
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
  CreateProject: undefined;
  NewProjectScreen: {
    projectName?: string;
    description?: string;
    photo?: string;
    marks?: Mark[];
    hastag?: number[];
    topic?: number[];
  };
  Marcador: {
    projectName: string;
    description: string;
    photo?: string;
    marks?: Mark[];
    hastag: number[];
    topic: number[];
    onBack?: boolean;
  };
  MarcadorExample: {
    projectName: string;
    description: string;
    photo?: string;
    marks: Mark[];
    hastag: number[];
    topic: number[];
  };
  OrganisationScreen: {
    name: string;
    url: string;
    description: string;
    type: string;
    publicContact: string;
    emailContact: string;
    organisationLogo: string;
    creditLogo: string;
  };
  ParticipateMap: {
    id: number;
  };
  PermissionsScreen: undefined;
};

const Stack = createStackNavigator<StackParams>();

export function HomeNavigator() {
  const {permissions, checkLocationPErmission} = useContext(PermissionsContext);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: 'white',
          zIndex: -999,
        },
      }}>
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        initialParams={{dashboard: true}}
      />
      {/* <Stack.Screen name="ProjectList" component={ProjectList} />
      <Stack.Screen name="OrganizationList" component={OrganizationList} /> */}
      {/* <Stack.Screen name="ProjectPage" component={ProjectPage} /> */}
      {/* <Stack.Screen name="OrganizationPage" component={OrganizationPage} />
      <Stack.Screen
        name="ParticipateMap"
        component={ParticipateMap}
        options={({navigation}) => ({
         
        })}
      /> */}
      <Stack.Screen name="PermissionsScreen" component={PermissionsScreen} />

      {/* {permissions.locationStatus === 'granted' ? (
        <Stack.Screen name="ParticipateMap" component={ParticipateMap} />
      ) : (
      )} */}
    </Stack.Navigator>
  );
}
