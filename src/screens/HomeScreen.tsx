import React, {SetStateAction, useEffect, useState} from 'react';
import {StackScreenProps} from '@react-navigation/stack';
import {SafeAreaView, View} from 'react-native';

import {Home} from '../components/screen_components/Home/Home';
import { StackParams } from '../navigation/HomeNavigator';

interface Props extends StackScreenProps<StackParams, 'HomeScreen'> {}

export const HomeScreen = ({navigation, route}: Props) => {
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
      {/* <View style={{flex: 1}}>
        {/* {route.params.dashboard ? ( <Home navigation={navigation} route={route} /> ) : (<MyProjects navigation={navigation} route={route} />)} */}
      {/* </View> */} 
      <Home navigation={navigation} route={route} />
    </SafeAreaView>
  );
};
