import Geolocation from '@react-native-community/geolocation';
// import Geolocation from 'react-native-geolocation-service';
import {useEffect, useRef, useState} from 'react';
import {Location} from '../interfaces/appInterfaces';

export const useLocation = () => {
  const [hasLocation, setHasLocation] = useState(false);
  const [routeLines, setRouteLines] = useState<Location[]>([]);

  const [loading, setLoading] = useState(false);

  const [initialPositionArray, setInitialPositionArray] = useState<number[]>(
    [0,0],
  );
  const [initialPosition, setInitialPosition] = useState<Location>({
    latitude: 0,
    longitude: 0,
  });

  const [userLocation, setUserLocation] = useState<Location>({
    latitude: 0,
    longitude: 0,
  });

  const watchId = useRef<number>();
  const isMounted = useRef<boolean>(true);

  // useEffect(() => {
  //   // Comprueba si el GPS ya está habilitado al cargar la aplicación
  //   Geolocation.getCurrentPosition(
  //     (position) => {
  //       setLoading(true);
  //     },
  //     (error) => {
  //       setGpsEnabled(false);
  //     }
  //   );
  // }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    
    if (!hasLocation) {
      // getCurrLocation();
      getCurrentLocation().then(location => {
        if (!isMounted.current) return;
        setInitialPosition(location);
        setInitialPositionArray([location.longitude, location.latitude]);
        setUserLocation(location);
        setRouteLines(routes => [...routes, location]);
        setHasLocation(true);
        setLoading(false);
      }).catch(error => {
        console.error("Error al obtener la ubicación:", error);
        setLoading(true);
        // Aquí puedes manejar el error de la manera que desees
      });;
    }
  }, []);

  const getCurrentLocation = (): Promise<Location> => {
    Geolocation.setRNConfiguration({
      authorizationLevel: 'always', // Cambia a 'always' si necesitas acceso constante
      skipPermissionRequests: false,
    });
    // Solicita permisos y habilita el GPS
    Geolocation.requestAuthorization(); // Esto mostrará un cuadro de diálogo para solicitar permisos

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        info => {
          resolve({
            latitude: info.coords.latitude,
            longitude: info.coords.longitude,
          });
          setInitialPositionArray([info.coords.longitude, info.coords.latitude]);
          setUserLocation(info.coords);
          setHasLocation(true);
          setLoading(false);
        },
        err => {
          if (err.code === 1) {
            console.log("Permiso denegado");
          } else if (err.code === 2) {
            console.log("Ubicación no disponible");
          } else if (err.code === 3) {
            console.log("Tiempo de espera agotado");
          }
          reject({err}),
            {
              enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 
            };
            setLoading(true);
        },
      );
    });
  };

  const followUserLocation = () => {
    watchId.current = Geolocation.watchPosition(
      ({coords}) => {
        // console.log('entrado en watch position')
        if (!isMounted.current) return;
        const location: Location = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        // console.log('entra en watchPosition');
        setUserLocation(location);
        setRouteLines(routes => [...routes, location]);
        setLoading(false);
      },
      err => console.log(err),
      {
        enableHighAccuracy: true,
        distanceFilter: 5, //metros para que te notifique
        timeout: 20000, maximumAge: 1000 
      },
    );
  };

  const stopFollowUserLocation = () => {
    if (watchId.current) Geolocation.clearWatch(watchId.current);
  };

  return {
    hasLocation,
    initialPosition,
    getCurrentLocation,
    followUserLocation,
    userLocation,
    stopFollowUserLocation,
    routeLines,
    initialPositionArray,
    setInitialPositionArray,
    loading
  };
};
