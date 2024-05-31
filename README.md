![Alt text](gnd.png)
This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Step 1: Start the Metro Server

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
# using npm
npm run android

# OR using Yarn
yarn android
```

### For iOS

```bash
# using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

## Step 3: Modifying your App

Now that you have successfully run the app, let's modify it.

1. Open `App.tsx` in your text editor of choice and edit some lines.
2. For **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Developer Menu** (<kbd>Ctrl</kbd> + <kbd>M</kbd> (on Window and Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (on macOS)) to see your changes!

   For **iOS**: Hit <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in your iOS Simulator to reload the app and see your changes!

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [Introduction to React Native](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

# Geonity Guide

## Arrancar react native
```bash

# instala los paquetes
- npm i

# leer el archivo podfile que contiene las dependencias y las instala
- cd ios
- pod install

# Cambiar el ViewPropTypes. Para ello, "accede a node_modules/react-native/index.js" y sustituye el contenido a continuación "//Deprecated Prop Types" por:

get ColorPropType(): $FlowFixMe {
  return require('deprecated-react-native-prop-types').ColorPropType;
},

get EdgeInsetsPropType(): $FlowFixMe {
  return require('deprecated-react-native-prop-types').EdgeInsetsPropType;
},

get PointPropType(): $FlowFixMe {
  return require('deprecated-react-native-prop-types').PointPropType;
},

get ViewPropTypes(): $FlowFixMe {
  return require('deprecated-react-native-prop-types').ViewPropTypes;
},

```

## Comandos para iniciar el proyecto
- npx react-native run-android
- npx react-native run-ios

## Comandos de utilidad
```bash
# limpia el proyecto
- cd android
- ./gradlew clean 
```

```bash
# limpia el proyecto para sacar a producción en android
- npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/

```

## Login Android
```bash
# datos
- keystore - 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
- android ID cliente 0Auth: 235777853257-k7u75rffibndst0j0s3h7cadpp2k5bd5.apps.googleusercontent.com
- webClient ID 0Auth: 235777853257-rnbdsrqchtl76jq0givh1h6l7u47rs4k.apps.googleusercontent.com
- secret: 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
```

## Crear APP

```bash

```

## Geonity-ios
instalada librería opcional npm install --save rn-fetch-blob para ver si con esto descarga bien en ios, sino, borrar librería

iOs version of Geonity app
ios-deploy - package instalado en ios, eliminar en android

## Librerías

1. react-native-async-storage/async-storage

```bash
# Esta dependencia proporciona una API simple y asincrónica para almacenar datos persistentes clave-valor en React Native.
- npm install @react-native-async-storage/async-storage@1.21.0

```
2. react-native-community/geolocation

```bash
# Este paquete permite acceder a la ubicación del usuario en dispositivos móviles.
- npm install @react-native-community/geolocation@3.1.0

```
3. react-native-masked-view/masked-view

```bash
# Este componente proporciona una vista con máscara que se utiliza para renderizar una capa de vista que se recorta con una máscara.
- npm install @react-native-masked-view/masked-view@0.3.1

```
4. react-native-picker/picker

```bash
# Este componente proporciona un selector de elementos para React Native.
- npm install @react-native-picker/picker@2.6.1

```

5. react-navigation/bottom-tabs

```bash
# Este paquete proporciona una navegación por pestañas en React Navigation.
- npm install @react-navigation/bottom-tabs@6.5.11

```

6. react-navigation/native

```bash
# Este paquete proporciona la base de la navegación en React Navigation.
- npm install @react-navigation/native@6.1.9

```

7. react-navigation/stack

```bash
# Este paquete proporciona la navegación de tipo pila en React Navigation.
- npm install @react-navigation/stack@6.3.20

```

8. rneui/base

```bash
# Este paquete es una base de UI para componentes de React Native.
- npm install @rneui/base@4.0.0-rc.8

```

9. rnmapbox/maps

```bash
# Este paquete permite la integración de mapas de Mapbox en una aplicación de React Native.
- npm install @rnmapbox/maps@10.1.3

```

10. types/react-native-snap-carousel

```bash
# Este paquete proporciona tipos TypeScript para react-native-snap-carousel.
- npm install @types/react-native-snap-carousel@3.8.10

```

11. axios

```bash
# Este paquete permite realizar solicitudes HTTP.
- npm install axios@1.3.2

```

12. date-fns

```bash
# Este paquete proporciona utilidades de fecha y hora.
- npm install date-fns@3.1.0

```

13. react

```bash
# Esta es la librería principal de React para la construcción de interfaces de usuario.
- npm install react

```

14. react-native

```bash
# Este es el marco de trabajo principal para el desarrollo de aplicaciones móviles en React Native.
- npm install react-native

```

15. react-native-bootstrap-icons

```bash
# Este paquete proporciona iconos Bootstrap en una aplicación de React Native.
- npm install react-native-bootstrap-icons@1.5.0

```

16. react-native-fs

```bash
# Este paquete proporciona acceso a sistemas de archivos locales en React Native.
- npm install react-native-fs@2.20.0

```

17. react-native-gesture-handler

```bash
# Este paquete proporciona gestos táctiles avanzados para aplicaciones de React Native.
- npm install react-native-gesture-handler@2.14.0

```

18. react-native-image-crop-picker

```bash
# Este paquete proporciona una funcionalidad avanzada para recortar y seleccionar imágenes en React Native.
- npm install react-native-image-crop-picker@0.40.2

```

19. react-native-image-picker

```bash
# Este paquete proporciona una funcionalidad para seleccionar imágenes desde la galería o la cámara en React Native.
- npm install react-native-image-picker@7.1.0

```

20. react-native-linear-gradient

```bash
# Este paquete proporciona un componente de gradiente lineal para React Native.
- npm install react-native-linear-gradient@2.8.3

```

21. react-native-modal

```bash
# Este paquete proporciona un componente de modal para React Native.
- npm install react-native-modal@13.0.1

```

22. react-native-pager-view

```bash
# Este paquete proporciona un componente de vista de páginas para React Native.
- npm install react-native-pager-view@6.2.3

```

23. react-native-paper

```bash
# Este paquete proporciona componentes de IU de Material Design para React Native.
- npm install react-native-paper@5.12.3

```

24. react-native-permissions

```bash
# Este paquete proporciona una API para solicitar permisos en aplicaciones de React Native.
- npm install react-native-permissions@4.0.4

```

25. react-native-reanimated

```bash
# Este paquete proporciona una API de animación declarativa para React Native.
- npm install react-native-reanimated@3.6.1

```

26. react-native-responsive-fontsize

```bash
# Este paquete proporciona un método para definir el tamaño de la fuente de forma sensible al tamaño de la pantalla en React Native.
- npm install react-native-responsive-fontsize@0.5.1

```

27. react-native-responsive-screen

```bash
# Este paquete proporciona un método para definir dimensiones de diseño sensibles en React Native.
- npm install react-native-responsive-screen@1.4.2

```

28. react-native-safe-area-context

```bash
# Este paquete proporciona un contexto para manejar el área segura en React Native.
- npm install react-native-safe-area-context@4.9.0

```

29. react-native-screens

```bash
# Este paquete proporciona una API de navegación de pantalla para React Native.
- npm install react-native-screens@3.29.0

```

30. react-native-share

```bash
# Este paquete proporciona una funcionalidad para compartir contenido en aplicaciones de React Native.
- npm install react-native-share@10.0.2

```

31. react-native-snap-carousel

```bash
# Este paquete proporciona un componente de carrusel deslizable para React Native.
- npm install react-native-snap-carousel@3.9.1

```

32. react-native-splash-screen

```bash
# Este paquete proporciona un splash screen para aplicaciones de React Native.
- npm install react-native-splash-screen@3.3.0

```

33. react-native-picker/picker

```bash
# Este componente proporciona un selector de elementos para React Native.
- npm install @react-native-picker/picker@2.6.1

```

34. react-native-svg

```bash
# Este paquete proporciona componentes SVG para aplicaciones de React Native.
- npm install react-native-svg@14.1.0

```

35. react-native-svg-transformer

```bash
# Este paquete proporciona un transformador SVG para React Native.
- npm install react-native-svg-transformer@1.3.0

```

36. react-native-tab-view

```bash
# Este paquete proporciona un componente de vista de pestañas para React Native.
- npm install react-native-tab-view@3.5.2

```

37. react-native-toast-message

```bash
# Este paquete proporciona un componente de mensaje emergente de tostada para React Native.
- npm install react-native-toast-message@2.2.0

```

38. react-native-vector-icons

```bash
# Este paquete proporciona iconos vectoriales para aplicaciones de React Native.
- npm install react-native-vector-icons@10.0.3

```
39. react-native-image-zoom

```bash
# Este paquete permite establecer una imagen a la que se le puede hacer zoom. NO FUNCIONA
- npm install @likashefqet/react-native-image-zoom

```
40. react-native-image-zoom-viewer

```bash
# Este paquete permite establecer una o varias imagen a la que se le puede hacer zoom.
- npm i react-native-image-zoom-viewer --save

```
41. react-native-date-picker

```bash
# Este paquete añade la opción de incluir fechas
- npm install react-native-date-picker

```
42. react-native-dots-pagination

```bash
# Este paquete añade la opción de incluir dots
- npm install react-native-dots-pagination

```

