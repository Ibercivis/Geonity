import React, {useContext, useEffect, useRef, useState} from 'react';
import {Text, View, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import {PermissionsContext} from '../context/PermissionsContext';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {LoadingScreen} from './LoadingScreen';

export const PermissionsScreen = () => {
  const [state, setState] = useState(0);
  const {permissions, checkLocationPErmission, askLocationPermission} =
    useContext(PermissionsContext);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  useEffect(() => {
    if (permissions.locationStatus === 'unavailable') {
      checkLocationPErmission();
    }
  }, []);

  useEffect(() => {
    if (permissions.locationStatus === 'granted') {
    }
  }, [permissions]);

  const checkLocationPermission = async () => {
    await askLocationPermission();
  };

  return (
    // <View style={styles.container}>
    //   <Text>Permiso de ubicación requerido y camara</Text>
    //   <TouchableOpacity
    //     style={styles.button}
    //     onPress={checkLocationPermission}
    //     activeOpacity={0.6}>
    //     <Text style={styles.touchableText}>Dar permisos</Text>
    //   </TouchableOpacity>
    // </View>
    <>
      <LoadingScreen />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    minWidth: RFPercentage(8),
    marginBottom: RFPercentage(2),
    marginTop: RFPercentage(2),
    backgroundColor: 'white',
    padding: RFPercentage(1),
    borderRadius: 10,
    paddingVertical: '5%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0.1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 5,
  },
  touchableText: {
    fontWeight: 'bold',
    fontSize: 20,
    color: 'black',
  },
});
