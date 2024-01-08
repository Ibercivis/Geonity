import {createContext, useEffect, useState} from 'react';
import {AppState, Platform} from 'react-native';
import {
  PERMISSIONS,
  PermissionStatus,
  request,
  check,
  openSettings,
} from 'react-native-permissions';

// aquí se pondría el permiso
export interface PermissionsState {
  locationStatus: PermissionStatus;
  camera: PermissionStatus;
}

export const permissionInitState: PermissionsState = {
  locationStatus: 'unavailable',
  camera: 'unavailable',
};

type PermissionsContextProps = {
  permissions: PermissionsState;
  askLocationPermission: () => void;
  checkLocationPErmission: () => void;
};

// qué exporta
export const PermissionsContext = createContext({} as PermissionsContextProps);

export const PermissionsProvider = ({children}: any) => {
  const [permissions, setPermissions] = useState(permissionInitState);

  useEffect(() => {
    AppState.addEventListener('change', state => {
      if (state === 'active') {
        checkLocationPErmission();
      }
    });
  }, []);

  const askLocationPermission = async () => {
    let permissionStatus: PermissionStatus;
    let permissionStatusCamera: PermissionStatus;

    if (Platform.OS === 'ios') {
      permissionStatus = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      permissionStatusCamera = await request(PERMISSIONS.IOS.CAMERA);
    } else {
      permissionStatus = await request(
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Get your location to post request',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      permissionStatusCamera = await request(PERMISSIONS.ANDROID.CAMERA);
    }

    if (permissionStatus === 'blocked') {
      openSettings();
    }
    if (permissionStatusCamera === 'blocked') {
      openSettings();
    }
    setPermissions({
      ...permissions,
      locationStatus: permissionStatus,
      camera: permissionStatusCamera,
    });
  };

  const checkLocationPErmission = async () => {
    let permissionStatus: PermissionStatus;
    let permissionStatusCamera: PermissionStatus;

    if (Platform.OS === 'ios') {
      permissionStatus = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      permissionStatusCamera = await check(PERMISSIONS.IOS.CAMERA);
    } else {
      permissionStatus = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      permissionStatusCamera = await check(PERMISSIONS.ANDROID.CAMERA);
    }
    setPermissions({
      ...permissions,
      locationStatus: permissionStatus,
      camera: permissionStatusCamera,
    });
  };

  const checkCameraPermission = async () => {
    let permissionStatus: PermissionStatus;

    if (Platform.OS === 'ios') {
      permissionStatus = await check(PERMISSIONS.IOS.CAMERA);
    } else {
      permissionStatus = await check(PERMISSIONS.ANDROID.CAMERA);
    }
    console.log('camera permission ' + permissionStatus);
    setPermissions({...permissions, camera: permissionStatus});
  };

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        askLocationPermission,
        checkLocationPErmission,
      }}>
      {children}
    </PermissionsContext.Provider>
  );
};
