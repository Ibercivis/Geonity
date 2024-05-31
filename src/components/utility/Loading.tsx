import React from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';

export const Loading = () => {
  return (
    <View style={{...styles.indicator}}>
      <ActivityIndicator color="black" size={50} />
      <Text>Loading...</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  indicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
