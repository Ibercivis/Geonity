import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  StatusBar,
  View,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Text,
  FlatList,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StackParams} from '../../../navigation/HomeNavigator';
import {StackScreenProps} from '@react-navigation/stack';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Chevron from '../../../assets/icons/general/chevron-left-1 circle.svg';
import {FontFamily, FontSize, FontWeight} from '../../../theme/fonts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import citmapApi, {baseURL} from '../../../api/citmapApi';
import {
  Organization,
  Project,
  ShowProject,
  User,
} from '../../../interfaces/interfaces';
import {Card} from '../../utility/Card';
import {SaveProyectModal} from '../../utility/Modals';
import {Colors} from '../../../theme/colors';
import NotContribution from '../../../assets/icons/profile/No hay contribuciones.svg';
import PencilSquare from '../../../assets/icons/general/pencil-square.svg';
import {CommonActions, useFocusEffect} from '@react-navigation/native';
import {heightPercentageToDP} from 'react-native-responsive-screen';
import { useLanguage } from '../../../hooks/useLanguage';

interface Props extends StackScreenProps<StackParams, 'OrganizationPage'> {}

export const OrganizationPage = (props: Props) => {
  //#region CONST
  const {fontLanguage} = useLanguage();
  const [organization, setOrganization] = useState<Organization>();
  const [projectList, setProjectList] = useState<ShowProject[]>([]);
  const [canEdit, setCanEdit] = useState(false);
  /**
   * Elementos del modal
   */
  const [saveModal, setSaveModal] = useState(false);
  const showModalSave = () => setSaveModal(true);
  const hideModalSave = () => setSaveModal(false);
  //#endregion

  //#region USE EFFECTS
  useEffect(() => {
    if (props.route.params.isNew) {
      showModalSave();
    }
    getOrganizationApi();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Aquí puedes cargar de nuevo los datos, por ejemplo, realizando una llamada a la API
      // Puedes usar la variable "route.params.id" para obtener el ID necesario
      getOrganizationApi();
    }, [props.route.params.id]),
  );

  //#endregion

  //#region METHODS

  /**
   * Metodo para volver atrás
   */
  const onBack = () => {
    props.navigation.goBack();
  };

  /**
   * metodo para ir a la edición del proyecto
   */
  const editProyect = () => {
    if (organization) {
      props.navigation.dispatch(
        CommonActions.navigate({
          name: 'CreateOrganization',
          params: {id: organization.id},
        }),
      );
    }
  };

  //#endregion

  //#region API CALLS

  const getOrganizationApi = async () => {
    let token;

    while (!token) {
      token = await AsyncStorage.getItem('token');
    }

    try {
      // const resp = await citmapApi.get<Organization>(
      //   `/organization/${props.route.params.id}`,
      //   {
      //     headers: {
      //       Authorization: token,
      //     },
      //   },
      // );

      const resp = await fetch(
        `${baseURL}/organization/${props.route.params.id}`,
        {
          method: 'GET',
          headers: {
            // Accept: 'application/json',
            // 'Content-Type': 'application/json',
            Authorization: token,
          },
          // body: JSON.stringify({
          //   firstParam: 'yourValue',
          //   secondParam: 'yourOtherValue',
          // }),
        },
      );
      const userInfo = await citmapApi.get<User>(
        '/users/authentication/user/',
        {
          headers: {
            Authorization: token,
          },
        },
      );

      let organiza: Organization;
      if (resp.ok) {
        organiza = await resp.json();
        if (userInfo.data.pk === organiza.creator) {
          setCanEdit(true);
        }
        setOrganization(organiza);
      }

      projectListApi();
    } catch (err) {
      console.log(err);
    }
  };

  const projectListApi = async () => {
    let token;

    while (!token) {
      token = await AsyncStorage.getItem('token');
    }
    try {
      const resp = await citmapApi.get<ShowProject[]>('/project/', {
        headers: {
          Authorization: token,
        },
      });

      const filteredProjectsSet = new Set<ShowProject>();

      resp.data.forEach(project => {
        // Verificar si organizations_write existe y contiene el ID
        if (project.organizations) {
          if (
            project.organizations.some(
              orgID => orgID.id === props.route.params.id,
            )
          ) {
            filteredProjectsSet.add(project);
          }
        }
      });

      const filteredProjects: ShowProject[] = Array.from(filteredProjectsSet);

      console.log(JSON.stringify(filteredProjects, null, 2));
      setProjectList(filteredProjects);
    } catch (err) {
      console.log('lo que falla es project list api ' + err);
    }
  };
  //#endregion

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{flexGrow: 1}}>
        <StatusBar hidden />
        {/* contenedor datos organizacion */}
        <View style={style.organizationContainer}>
          {/* vista que da efecto de curva */}
          <View
            style={{
              ...style.curvedView,
              backgroundColor: organization?.cover ? 'transparent' : 'grey',
            }}>
            <Image
              source={
                organization?.cover
                  ? {uri: organization?.cover}
                  : require('../../../assets/backgrounds/nuevoproyecto.jpg')
              }
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
          </View>
          {/* boton back */}
          <TouchableOpacity style={style.buttonBack} onPress={onBack}>
            <Chevron
              width={RFPercentage(5)}
              height={RFPercentage(5)}
              fill={'#ffffff'}
            />
          </TouchableOpacity>

          {/* boton edit */}
          {canEdit && (
            <TouchableOpacity
              style={style.buttonEdit}
              onPress={() => editProyect()}>
              <PencilSquare
                width={RFPercentage(5)}
                height={RFPercentage(5)}
                fill={'#000000'}
              />
            </TouchableOpacity>
          )}

          {/* titulo de la organizacion */}
          <Text style={style.title}>{organization?.principalName}</Text>
          {/* contenedor de datos de organizacion */}
          <View style={style.organizationInfoContainer}>
            <View
              style={{
                height: heightPercentageToDP(8),
                width: '80%',
                alignItems: 'center',
                alignContent: 'center',
                alignSelf: 'center',
                flexDirection: 'row',
              }}>
              <View
                style={{
                  width: '50%',
                  height: '100%',
                  // backgroundColor: 'green',
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    alignItems: 'center',
                    alignContent: 'center',
                    alignSelf: 'center',
                    fontFamily: FontFamily.NotoSansDisplayMedium,
                    color: 'black',
                    fontSize: FontSize.fontSizeText17,
                  }}>
                  {projectList.length}
                </Text>
                <Text
                  style={{
                    alignItems: 'center',
                    alignContent: 'center',
                    alignSelf: 'center',
                  }}>
                  {fontLanguage.organization[0].project}
                </Text>
              </View>
              <View
                style={{
                  width: '50%',
                  height: '100%',
                  // backgroundColor: 'grey',
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    alignItems: 'center',
                    alignContent: 'center',
                    alignSelf: 'center',
                    fontFamily: FontFamily.NotoSansDisplayMedium,
                    color: 'black',
                    fontSize: FontSize.fontSizeText17,
                  }}>
                  {organization?.members.length}
                </Text>
                <Text
                  style={{
                    alignItems: 'center',
                    alignContent: 'center',
                    alignSelf: 'center',
                  }}>
                  {fontLanguage.organization[0].member}
                </Text>
              </View>
            </View>
            <View
              style={{
                height: organization?.description ? 'auto' : 0,
                width: '80%',
                marginTop: '3%',
                // backgroundColor: 'purple',
                alignItems: 'center',
                alignContent: 'center',
                alignSelf: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  alignItems: 'center',
                  alignContent: 'center',
                  alignSelf: 'center',
                  textAlign: 'center',
                  color: 'black',
                  fontSize: FontSize.fontSizeText13,
                  fontFamily: FontFamily.NotoSansDisplayLight,
                  fontWeight: '300',
                }}>
                {organization?.description}
              </Text>
            </View>
          </View>
          {/* vista que contiene  el avatar */}
          <View style={{...style.organizationAvatar}}>
            <ImageBackground
              borderRadius={100}
              // source={require(urii)}
              source={
                organization?.logo
                  ? {uri: organization?.logo}
                  : require('../../../assets/backgrounds/nuevoproyecto.jpg')
              }
              style={{
                height: RFPercentage(17),
                width: RFPercentage(17),
                zIndex: 1,
                borderWidth: organization?.logo ? 0 : 1,
                borderRadius: organization?.logo ? 0 : 100,
                backgroundColor: organization?.logo
                  ? 'transparent'
                  : Colors.contentPrimaryDark,
              }}
            />
          </View>
        </View>

        {/* contenedor proyectos */}
        <View style={{...style.projectView, height: 'auto'}}>
          <Text
            style={{
              fontSize: FontSize.fontSizeText20,
              fontWeight: 'bold',
              color: 'black',
              marginHorizontal: RFPercentage(3),
            }}>
            {fontLanguage.organization[0].project}
          </Text>
          {projectList.length <= 0 ? (
            <>
              <View
                style={{alignItems: 'center', marginTop: '7%', opacity: 0.5}}>
                <Text
                  style={{
                    color: 'black',
                    fontSize: FontSize.fontSizeText20,
                    fontFamily: FontFamily.NotoSansDisplayRegular,
                    fontWeight: '700',
                  }}>
                  {fontLanguage.organization[0].no_projects}
                </Text>
                <Text
                  style={{
                    width: '65%',
                    textAlign: 'center',
                    color: 'black',
                    fontSize: FontSize.fontSizeText13,
                    fontFamily: FontFamily.NotoSansDisplayMedium,
                    fontWeight: '600',
                    marginTop: '3%',
                  }}>
                  {fontLanguage.organization[0].info_no_projects_text}
                </Text>
                <View style={{alignItems: 'center'}}>
                  <NotContribution
                    width={RFPercentage(28)}
                    height={RFPercentage(28)}
                  />
                </View>
              </View>
            </>
          ) : (
            <ScrollView
              style={{flex: 1}}
              contentContainerStyle={{alignItems: 'center', height: 'auto'}}>
              {projectList.map((item, index) => {
                if (item.cover && item.cover[0]) {
                  console.log(item.cover[0].image);
                }
                return (
                  <Card
                    key={index}
                    type="projectOrganization"
                    categoryImage={index}
                    totalLikes={item.total_likes}
                    contribution={item.contributions}
                    title={item.name}
                    description={item.description}
                    boolHelper={item.is_liked_by_user}
                    cover={
                      item.cover && item.cover[0] ? item.cover[0].image : ''
                    }
                    onPress={() =>
                      props.navigation.navigate('ProjectPage', {id: item.id!})
                    }
                  />
                );
              })}
            </ScrollView>
          )}

          <SaveProyectModal
            visible={saveModal}
            hideModal={hideModalSave}
            onPress={hideModalSave}
            size={RFPercentage(6)}
            color={Colors.semanticSuccessLight}
            label={fontLanguage.organization[0].modal_label_created}
            subLabel={fontLanguage.organization[0].modal_sublabel_created}
          />
          {/* <FlatList
            style={{flex: 1}}
            contentContainerStyle={{alignItems: 'center'}}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            data={projectList}
            renderItem={({item, index}) => {
              return (
                <Card
                  key={index}
                  type="projectFound"
                  categoryImage={index}
                  title={item.name}
                  description={item.description}
                  onPress={() => props.navigation.navigate('ProjectPage', {id: item.id})}
                />
              );
            }}
          /> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const style = StyleSheet.create({
  curvedView: {
    // backgroundColor: 'red',
    height: RFPercentage(101),
    width: RFPercentage(107),
    alignSelf: 'center',
    borderRadius: 365,
    top: RFPercentage(-82),
    overflow: 'hidden',
    alignItems: 'center', // Centra horizontalmente la imagen
    justifyContent: 'center',
    // borderBottomRightRadius: 500,
    // borderBottomLeftRadius: 500
  },
  organizationAvatar: {
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: RFPercentage(5),
    left: RFPercentage(5),
    top: RFPercentage(15),
    backgroundColor: 'transparent',
  },
  organizationContainer: {
    backgroundColor: 'transparent',
    marginBottom: '5%',
    // height: RFPercentage(65),
    // borderBottomWidth: 1,
    alignItems: 'center',
    alignContent: 'center',
  },
  organizationInfoContainer: {
    // backgroundColor: 'yellow',

    marginTop: RFPercentage(-67),
    alignItems: 'center',
    alignContent: 'center',
    width: RFPercentage(45),
    height: 'auto',
  },
  projectView: {backgroundColor: 'transparent'},
  buttonBack: {
    position: 'absolute',
    top: RFPercentage(4),
    left: RFPercentage(2),
    zIndex: 10,
    // backgroundColor: 'black',
    // opacity: 0.4,
    borderRadius: 100,
    padding: RFPercentage(1.2),
  },
  title: {
    position: 'absolute',
    marginTop: heightPercentageToDP(5),
    left: RFPercentage(5),
    right: RFPercentage(5),
    zIndex: 3,
    fontSize: FontSize.fontSizeText20,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    textAlignVertical: 'center',
    textShadowColor: 'black', // Color del contorno
    textShadowOffset: {width: 1, height: 1}, // Ajusta según sea necesario
    textShadowRadius: 2,
  },
  buttonEdit: {
    position: 'absolute',
    top: RFPercentage(4),
    right: RFPercentage(2),
    zIndex: 999,
    // backgroundColor: 'white',
    borderRadius: 100,
    padding: RFPercentage(1.2),
  },
});
