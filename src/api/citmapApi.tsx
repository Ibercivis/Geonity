import axios from "axios";

import AsyncStorage from '@react-native-async-storage/async-storage';

// const baseURL = 'http://fran.ibercivis.es:10000/api';
// const baseURL = 'http://jorge.ibercivis.es:10000/api';
export const baseURL = 'http://dev.ibercivis.es:10001/api';
// export const baseURL = 'https://geonity.ibercivis.es/api';
export const imageUrl = 'http://dev.ibercivis.es:10001';

const citmapApi = axios.create({baseURL});


//esto añadirá el token siempre en el encabezado a las peticiones siempre y cuando el token exista
citmapApi.interceptors.request.use(

    async (config) => {
        // console.log('entra en interceptors')
        const token = await AsyncStorage.getItem('token');
        if(token){
            // console.log(token)
            // axios.defaults.headers['Authorization'] = token;
            // config.headers['Authorization'] = token;
            // console.log('MUESTREO DEL TOKEN: ', token)
            // token = 'Token '+token;
            // config.headers!['Key'] = token;
            // config.headers!['Authorization'] = token;
            // console.log('pasa el header '+ token)
        }

        return config;
    }

)

export default citmapApi;