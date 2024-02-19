import React, {useContext, useState} from 'react';
import {PermissionsContext} from '../context/PermissionsContext';
import {AuthContext} from '../context/AuthContext';
import {LoadingScreen} from '../screens/LoadingScreen';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {HomeNavigator} from './HomeNavigator';
import CustomTab from '../components/utility/CustomTab';
import {
  ImageBackground,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation, useRoute} from '@react-navigation/native';
import {ProfileScreen} from '../screens/ProfileScreen';
import {RFPercentage} from 'react-native-responsive-fontsize';
// import Plus from '../assets/icons/general/plus-lg1.svg';
import {Colors} from '../theme/colors';
import {FontSize} from '../theme/fonts';
import PlusSquare from '../assets/icons/general/plus-square.svg';
import { useLanguage } from '../hooks/useLanguage';
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen';

const Tab = createBottomTabNavigator<StackParams>();
const {fontLanguage} = useLanguage();

export type StackParams = {
  // NavigatorMap: undefined;
  // NavigatorMapBox: undefined;
  ProfileScreen: undefined;
  HomeNavigator: undefined;
  CenterButtonTab: undefined;
};

const CenterButtonTab = () => {
  // Navigation
  const navigation = useNavigation();

  const [modalVisible, setModalVisible] = useState(false);

  const openCategoryModal = () => {
    setModalVisible(true);
  };

  const closeCategoryModal = () => {
    setModalVisible(false);
  };

  const navigateTo = (route: string) => {
    navigation.navigate(route as never);
    closeCategoryModal();
  };

  return (
    <TouchableOpacity
      onPress={openCategoryModal}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: RFPercentage(4),
        // width: RFPercentage(5),
        // height: RFPercentage(5),
        // borderRadius: 35,
        backgroundColor: 'white', // Customize the button color
        marginVertical: RFPercentage(1),
      }}>
      <PlusSquare
        width={RFPercentage(3.2)}
        height={RFPercentage(3.2)}
        fill={'#000000'}
      />
      {/* <Text style={{color: 'white'}}>Botón</Text> */}

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeCategoryModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalViewContainer}>
            <View style={styles.modalHeader}>
              <View style={{flexDirection: 'row'}}>
                <View style={{justifyContent:'center', marginRight:'3%', top: RFPercentage(0.2)}}>
                  <PlusSquare
                    width={RFPercentage(2.2)}
                    height={RFPercentage(2.2)}
                    fill={'#0055b6'}
                  />
                </View>

                <Text
                  style={{
                    color: 'black',
                    fontSize: FontSize.fontSizeText20,
                    fontWeight: 'bold',
                    textAlignVertical:'center',
                    marginLeft: '2%'
                  }}>
                  {fontLanguage.modals[0].bottom_tab_nav.title}
                </Text>
              </View>
              <TouchableOpacity onPress={closeCategoryModal}>
                <Text style={{color: 'blue'}}>{fontLanguage.global[0].close_button}</Text>
              </TouchableOpacity>
            </View>
            <View
              style={{
                marginTop:'4%',
                flexDirection: 'row',
                height: '85%',
                justifyContent: 'space-between',
                width:'95%'
                
              }}>
              <TouchableOpacity
                style={styles.cards}
                onPress={() => navigateTo('CreateProject')}>
                <View style={{flex: 1}}>
                  <ImageBackground
                    borderRadius={10}
                    // source={require(urii)}
                    source={require('../assets/backgrounds/nuevoproyecto.jpg')}
                    style={{borderRadius: 10, height: '100%'}}>
                    <View
                      style={{alignItems: 'stretch', flex: 1, borderRadius: 5, justifyContent:'center'}}>
                      <Text
                        style={{
                          textAlign: 'center',
                          // marginBottom: '5%',
                          marginLeft: '10%',
                          marginRight: '10%',
                          // marginTop: RFPercentage(8),
                          // paddingTop: '4%',
                          textAlignVertical:'center',
                          backgroundColor: 'white',
                          alignSelf: 'center',
                          padding: '4%',
                          borderRadius: 7,
                          color:'black'
                        }}>
                        {fontLanguage.modals[0].bottom_tab_nav.project}
                      </Text>
                    </View>
                  </ImageBackground>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cards} onPress={() => navigateTo('CreateOrganization')}>
                <View style={{flex: 1}}>
                  <ImageBackground
                    borderRadius={10}
                    // source={require(urii)}
                    source={require('../assets/backgrounds/nuevaorganizacion.jpg')}
                    style={{borderRadius: 10, height: '100%'}}>
                    <View style={{alignItems: 'stretch', flex: 1, justifyContent:'center'}}>
                      <Text
                        style={{
                          textAlign: 'center',
                          // marginBottom: '5%',
                          marginLeft: '10%',
                          marginRight: '10%',
                          // marginTop: RFPercentage(8),
                          backgroundColor: 'white',
                          alignSelf: 'center',
                          padding: '4%',
                          borderRadius: 7,
                          color:'black'
                        }}>
                        {fontLanguage.modals[0].bottom_tab_nav.organization}
                      </Text>
                    </View>
                  </ImageBackground>
                </View>
              </TouchableOpacity>
            </View>
            {/* Aquí puedes agregar el contenido de categorías */}
          </View>
        </View>
      </Modal>
    </TouchableOpacity>
  );
};

export const BottomTabNavigation = () => {
  //permite conocer por medio del contexto si se han garantizado los permisos que elijamos
  const {permissions} = useContext(PermissionsContext);

  //si no está logged, se le redirigirá hasta la pantalla de login
  const {status} = useContext(AuthContext);
  // const actualRoute = useRoute();
  if (status === 'checking') {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'transparent'}}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: {backgroundColor: 'transparent'},
          // tabBarBackground() {
          //   return (
          //     <View style={{flex: 1, backgroundColor: 'white'}}>
          //       <LinearGradient
          //         colors={['transparent', '#fff']}
          //         style={{flex: 1}}
          //         start={{x: 0, y: 0}}
          //         end={{x: 0, y: 1}}
          //       />
          //     </View>
          //   );
          // },
        }}
        tabBar={({state, descriptors, navigation}) => (
          // <View style={styles.tabBarContainer}>
            <LinearGradient
                  colors={['transparent', '#d3d3d3',  '#ffffff']}
                  style={styles.tabBarContainer}
                  start={{x: 0, y: 0}}
                  end={{x: 0, y: 1}}
                  
                >

                
            {state.routes.map((route, index) => {
              const {options} = descriptors[route.key];

              if (route.name === 'CenterButtonTab') {
                return <CenterButtonTab key={route.key} />;
              }
              const label =
                route.name === 'HomeNavigator' ? fontLanguage.global[0].home : fontLanguage.modals[0].bottom_tab_nav.profile;

              return (
              <>{
                false ? (<></>) : (
                  <CustomTab
                  key={route.key}
                  label={label.toString()}
                  icon={route.name === 'HomeNavigator' ? 'home' : fontLanguage.modals[0].bottom_tab_nav.settings}
                  route={route.name}
                  focused={state.index === index}
                  onPress={() => {
                    const event = navigation.emit({
                      type: 'tabPress',
                      target: route.key,
                      canPreventDefault: true,
                    });

                    if (!event.defaultPrevented) {
                      navigation.navigate(route.name);
                    }
                  }}
                />
                )
              }
              
              </>
                
              );
            })}
            </LinearGradient>
          // </View>
        )}>
        {/* esto sería cambiarlo a que lleve a homeScreem o a otro donde se incluya para ver los proyectos */}
        <Tab.Screen
          name="HomeNavigator"
          component={HomeNavigator}
          options={{
            headerShown:false,
            tabBarIcon: ({focused}) => (
              <CustomTab
                label="Home"
                route="HomeNavigator"
                focused={focused}
                onPress={() => {}}
                icon="home"
              />
            ),
            unmountOnBlur: true,
          }}
        />
        <Tab.Screen name="CenterButtonTab" component={CenterButtonTab} />
        <Tab.Screen
          name="ProfileScreen"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({focused}) => (
              <CustomTab
                label={fontLanguage.modals[0].bottom_tab_nav.profile}
                route="ProfileScreen"
                focused={focused}
                onPress={() => {}}
                icon="Profile"
              />
            ),
            unmountOnBlur: true,
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'transparent', // Customize the tab bar background color
    borderTopWidth: 0,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: heightPercentageToDP(10)
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: widthPercentageToDP(10),
    height: 40,
    borderRadius: 20,
    backgroundColor: 'blue',
  },
  buttonText: {
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalViewContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '42%',
    paddingHorizontal: RFPercentage(5),
    paddingVertical: RFPercentage(5),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: '0.5%',
    marginBottom: RFPercentage(2),
  },

  cards: {
    height: '95%',
    // width: RFPercentage(18),
    width:'50%',
    margin: 4,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5.41,
    elevation: 2,
  },
});
