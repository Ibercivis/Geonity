import React, {SetStateAction, useEffect, useState} from 'react';
import {StackScreenProps} from '@react-navigation/stack';
import {SafeAreaView, View} from 'react-native';

import {Home} from '../components/screen_components/Home/Home';
import { StackParams } from '../navigation/BottomTabNavigation';
import { Profile } from '../components/screen_components/User/Profile';

interface Props extends StackScreenProps<StackParams, 'ProfileScreen'> {}

export const ProfileScreen = ({navigation, route}: Props) => {
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      {/* <View style={{flex: 1}}>
        {/* {route.params.dashboard ? ( <Home navigation={navigation} route={route} /> ) : (<MyProjects navigation={navigation} route={route} />)} */}
      {/* </View> */} 
      <Profile navigation={navigation} route={route} />
    </SafeAreaView>
  );
};
