import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {IconTemp} from '../components/utility/IconTemp';
import { globalStyles } from '../theme/theme';

export const LoadingScreen = () => {
  return (
    <View style={{...globalStyles.globalMargin, ...styles.container}}>
      <ActivityIndicator size={50} color='black' />
    </View>
  );
};
const styles = StyleSheet.create({
  container:{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
  },
})