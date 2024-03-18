import {StackScreenProps} from '@react-navigation/stack';
import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  Animated,
  FlatList,
  Image,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {TabView, SceneMap} from 'react-native-tab-view';
import {
  Organization,
  UserProfile,
  ShowProject,
  User,
  UserInfo,
  CountryData,
} from '../../../interfaces/interfaces';
import AsyncStorage from '@react-native-async-storage/async-storage';
import citmapApi, {imageUrl} from '../../../api/citmapApi';
import {HeaderComponent} from '../../HeaderComponent';
import {useForm} from '../../../hooks/useForm';
import {RFPercentage} from 'react-native-responsive-fontsize';
import Geo from '../../../assets/icons/general/geo-alt-fill.svg';
import Bookmark from '../../../assets/icons/general/bookmark-fill.svg';
import People from '../../../assets/icons/general/people.svg';
import Heart from '../../../assets/icons/general/heart.svg';
import HeartFill from '../../../assets/icons/general/heart-fill.svg';
import PencilSquare from '../../../assets/icons/general/pencil-square-1.svg';
import {HasTag, Location} from '../../../interfaces/appInterfaces';
import {LoadingScreen} from '../../../screens/LoadingScreen';
import {FontFamily, FontSize, fonts} from '../../../theme/fonts';
import {Switch} from 'react-native-paper';
import {InputText} from '../../utility/InputText';
import {Picker} from '@react-native-picker/picker';
import {globalStyles} from '../../../theme/theme';
import {IconBootstrap} from '../../utility/IconBootstrap';
import {Size} from '../../../theme/size';
import {Colors} from '../../../theme/colors';
import PlusImg from '../../../assets/icons/general/Plus-img.svg';
import Person from '../../../assets/icons/general/person.svg';
import ImagePicker from 'react-native-image-crop-picker';
import {
  DeleteModal,
  GenderSelectorModal,
  InfoModal,
  PassModal,
  SaveProyectModal,
  VisibilityBirthday,
  VisibilityOrganizationModal,
} from '../../utility/Modals';
import Lock from '../../../assets/icons/general/lock-fill.svg';
import Card from '../../../assets/icons/general/card-fill.svg';
import World from '../../../assets/icons/general/world-fill.svg';
import NotContribution from '../../../assets/icons/profile/No hay contribuciones.svg';
import NotCreated from '../../../assets/icons/profile/No hay creados.svg';
import NotLiked from '../../../assets/icons/profile/No hay me gusta.svg';
import {CommonActions, useNavigation} from '@react-navigation/native';
import {Country} from '../../../interfaces/interfaces';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import {Spinner} from '../../utility/Spinner';
import Toast from 'react-native-toast-message';
import {useLanguage} from '../../../hooks/useLanguage';
import {CustomButton} from '../../utility/CustomButton';
import {AuthContext} from '../../../context/AuthContext';
import {PermissionsContext} from '../../../context/PermissionsContext';

interface Props extends StackScreenProps<any, any> {}

export const Profile = ({navigation}: Props) => {
  //#region Variables
  // const navigation = useNavigation();
  const {fontLanguage} = useLanguage();
  const MAX_CHARACTERS = 300;
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    {key: 'one', title: fontLanguage.profile[0].title_one},
    {key: 'two', title: fontLanguage.profile[0].title_two},
    {key: 'three', title: fontLanguage.profile[0].title_three},
  ]);

  //controla el estado del scroll
  const scrollViewRef = useRef<ScrollView | null>(null);
  const [isAllCharged, setIsAllCharged] = useState(false);
  const [userEdit, setUserEdit] = useState(false);
  const [canEdit, setCanEdit] = useState(true);

  const [projectList, setProjectList] = useState<ShowProject[]>([]);
  const [createdProjects, setCreatedProject] = useState<ShowProject[]>([]);
  const [contributionProject, setContributionProject] = useState<ShowProject[]>(
    [],
  );
  const [likedProject, setLikedProject] = useState<ShowProject[]>([]);
  const [organization, setOrganization] = useState<Organization[]>([]);
  const [organizationUser, setOrganizationUser] = useState<Organization>();
  const [countries, setCountries] = useState<[]>([]);
  const [hastags, setHastags] = useState<HasTag[]>([]);

  const [profileImage, setProfileImage] = useState<any>();
  const [profileImageCharged, setProfileImageCharged] = useState<any>();
  const [profileImageBlob, setProfileImageBlob] = useState<any>();

  const [user, setUser] = useState<User>({
    pk: 0,
    username: '',
    email: '',
    first_name: '',
    last_name: '',
  });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    biography: '',
    visibility: false,
    country: {
      code: '',
      name: '',
    },
    created_organizations: [],
    participated_projects: [],
    created_projects: [],
    liked_projects: [],
  });
  const {form, onChange, setObject} = useForm<UserProfile>(userProfile);
  const [isSwitchOn, setIsSwitchOn] = useState(false);

  const onToggleSwitch = () => {
    setIsSwitchOn(!isSwitchOn);
    // form.visibility = !form.visibility
  };

  const [modalVisibleGenre, setModalVisibleGenre] = useState(false);
  const [modalVisibleOrganization, setModalVisibleOrganization] =
    useState(false);
  const [modalVisibleUbicacion, setModalVisibleUbicacion] = useState(false);
  const [modalVisibleBirth, setModalVisibleBirth] = useState(false);
  const [modalVisibleSave, setModalVisibleSave] = useState(false);
  const [genre, setGenre] = useState('');
  const [visibilityOrganization, setVisibilityOrganization] = useState('');
  const [visibilityUbicacion, setVisibilityUbicacion] = useState('');
  const [visibilityBirth, setVisibilityBirth] = useState('');
  const [saveAll, setSaveAll] = useState(false);

  const [infoModal, setInfoModal] = useState(false);
  const showModalInfo = () => setInfoModal(true);
  const hideModalInfo = () => setInfoModal(false);

  const [deleteModal, setDelete] = useState(false);
  const showModalDelete = () => setDelete(true);
  const hideModalDelete = () => setDelete(false);

  const [selectedCountry, setSelectedCountry] = useState([]);

  const {signOut} = useContext(AuthContext);

  const [passModal, setPassModal] = useState(false);
  const showModalPass = () => setPassModal(true);
  const hideModalPass = () => setPassModal(false);

  const [isValidPass, setIsValidPass] = useState(true);
  const {permissions, checkLocationPErmission, askLocationPermission} =
    useContext(PermissionsContext);

  const [observationSelected, setObservationSelected] = useState<{
    id: number;
    is_private: boolean;
    location: Location;
  }>({id: 0, is_private: false, location: {latitude: 0, longitude: 0}});

  //#endregion

  //#region tabs

  const Contribution = () => (
    <>
      {contributionProject && contributionProject.length <= 0 ? (
        <>
          <View
            style={{
              alignItems: 'center',
              marginTop: '7%',
              paddingBottom: '5%',
            }}>
            <Text
              style={{
                color: 'black',
                fontSize: FontSize.fontSizeText20,
                fontFamily: FontFamily.NotoSansDisplayRegular,
                fontWeight: '700',
              }}>
              {fontLanguage.profile[0].contribution_not_participate}
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
              {fontLanguage.profile[0].contribution_participate}
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
        <FlatList
          style={{flex: 1}}
          contentContainerStyle={{
            alignItems: 'center',
            marginBottom: '20%',
            backgroundColor: 'transparent',
            paddingBottom: '5%',
          }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          data={userProfile.created_observations}
          renderItem={({item, index}) => {
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.5}
                style={style.projectFound}
                onPress={() => {
                  navigateToMap(
                    item.id_project,
                    item.geoposition,
                    item.is_private_project,
                  );
                }}>
                <View style={{flexDirection: 'row'}}>
                  <View style={{width: '30%'}}>
                    {item.cover_project ? (
                      <Image
                        source={{
                          uri: imageUrl + item.cover_project.image,
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderTopLeftRadius: 10,
                          borderBottomLeftRadius: 10,
                          resizeMode: 'cover',
                          backgroundColor: 'transparent',
                          marginRight: '2%',
                        }}
                      />
                    ) : (
                      <Image
                        source={{
                          uri: require('../../../assets/backgrounds/nuevoproyecto.jpg'),
                        }}
                        style={{
                          width: '12%',
                          height: '110%',
                          borderRadius: 50,
                          resizeMode: 'cover',
                          backgroundColor: 'blue',
                          marginRight: '2%',
                        }}
                      />
                    )}
                  </View>
                  <View
                    style={{
                      paddingHorizontal: RFPercentage(2),
                      width: '70%',
                      marginTop: RFPercentage(2),
                      marginBottom: 6,
                    }}>
                    <Text
                      style={{
                        // backgroundColor: 'blue',
                        fontSize: FontSize.fontSizeText17,
                        fontWeight: '600',
                        color: 'black',
                        fontFamily: FontFamily.NotoSansDisplaySemiBold,
                        marginBottom: '1%',
                        alignSelf: 'flex-start',
                      }}>
                      {item.name_project}
                    </Text>

                    <View style={{flexWrap: 'wrap'}}>
                      <Text
                        style={{
                          alignSelf: 'flex-start',
                          flexWrap: 'wrap',
                          marginBottom: '2%',
                        }}>
                        {formatDate(item.updated_at)}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </>
  );

  const Contribution2 = () => (
    <>
      {contributionProject && contributionProject.length <= 0 ? (
        <>
          <View style={{alignItems: 'center', marginTop: '7%'}}>
            <Text
              style={{
                color: 'black',
                fontSize: FontSize.fontSizeText20,
                fontFamily: FontFamily.NotoSansDisplayRegular,
                fontWeight: '700',
              }}>
              {fontLanguage.profile[0].contribution_not_participate}
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
              {fontLanguage.profile[0].contribution_participate}
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
        <FlatList
          style={{flex: 1}}
          contentContainerStyle={{alignItems: 'center'}}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          data={contributionProject}
          renderItem={({item, index}) => {
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.5}
                style={style.projectFound}
                onPress={() => navigateTo(item.id)}>
                <View
                  style={
                    {
                      // paddingHorizontal: RFPercentage(3),
                      // width:'100%',
                      // backgroundColor:'green'
                    }
                  }>
                  <View
                    style={{
                      // marginHorizontal: RFPercentage(2),
                      paddingHorizontal: RFPercentage(2),
                      width: '100%',
                      marginTop: RFPercentage(2),
                      marginBottom: 6,
                    }}>
                    <Text
                      style={{
                        // backgroundColor: 'blue',
                        fontSize: FontSize.fontSizeText17,
                        fontWeight: '600',
                        color: 'black',
                        fontFamily: FontFamily.NotoSansDisplaySemiBold,
                        marginBottom: '1%',
                        alignSelf: 'flex-start',
                      }}>
                      {item.name}
                    </Text>
                    <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                      {item.hasTag.map((x, i) => {
                        const matchingHastag = hastags.find(
                          hastag => hastag.id === x,
                        );
                        if (matchingHastag) {
                          return (
                            <Text
                              key={i}
                              style={{
                                alignSelf: 'flex-start',
                                color: 'blue',
                                marginBottom: '2%',
                              }}>
                              #{matchingHastag.hasTag}
                              {'  '}
                            </Text>
                          );
                        }
                      })}
                    </View>
                    <View style={{flexWrap: 'wrap'}}>
                      <Text
                        style={{
                          alignSelf: 'flex-start',
                          flexWrap: 'wrap',
                          marginBottom: '2%',
                        }}>
                        {item.description.length > 150
                          ? item.description.slice(0, 150) + '...'
                          : item.description}
                      </Text>
                    </View>
                  </View>
                  <ImageBackground
                    borderBottomLeftRadius={10}
                    borderBottomRightRadius={10}
                    source={
                      item.cover && item.cover[0]
                        ? {uri: imageUrl + item.cover[0].image}
                        : require('../../../assets/backgrounds/nuevoproyecto.jpg')
                    }
                    style={{
                      ...style.imageBackground,
                      width: '100%',
                      height: RFPercentage(23),
                      backgroundColor: item.cover ? 'transparent' : 'grey',
                    }}>
                    <View
                      style={{
                        position: 'absolute',
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'center',
                        bottom: 2,
                        left: 0,
                        right: 0,
                        justifyContent: 'space-between',
                        // marginHorizontal: RFPercentage(1),
                        width: '100%',
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          backgroundColor: 'white',
                          borderRadius: 15,
                          margin: '2%',
                          paddingHorizontal: '3%',
                          paddingVertical: '2%',
                        }}>
                        <People width={16} height={16} color={'#000000'} />
                        <Text
                          style={{
                            fontSize: FontSize.fontSizeText13,
                            marginHorizontal: RFPercentage(1),
                          }}>
                          {item.contributions}
                        </Text>
                        {item.is_liked_by_user ? (
                          <HeartFill width={16} height={16} color={'#ff0000'} />
                        ) : (
                          <Heart width={16} height={16} color={'#000000'} />
                        )}
                        <Text
                          style={{
                            fontSize: FontSize.fontSizeText13,
                            marginHorizontal: RFPercentage(1),
                          }}>
                          {item.total_likes}
                        </Text>
                      </View>
                      {/* <View
                      style={{
                        flexDirection: 'row',
                        backgroundColor: 'white',
                        borderRadius: 15,
                        margin: '2%',
                        paddingHorizontal: '3%',
                        paddingVertical: '2%',
                      }}>
                      <TouchableOpacity
                        onPress={() => toggleLike(item.id)}
                        style={{flexDirection: 'row'}}>
                        {item.is_liked_by_user ? (
                          <HeartFill width={16} height={16} color={'#ff0000'} />
                        ) : (
                          <Heart width={16} height={16} color={'#000000'} />
                        )}
                        <Text
                          style={{
                            fontSize: FontSize.fontSizeText13,
                            marginHorizontal: RFPercentage(1),
                          }}>
                          {item.total_likes}
                        </Text>
                      </TouchableOpacity>
                    </View> */}
                    </View>
                  </ImageBackground>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </>
  );
  const Liked = () => (
    <>
      {likedProject && likedProject.length <= 0 ? (
        <>
          <View style={{alignItems: 'center', marginTop: '7%'}}>
            <Text
              style={{
                width: '65%',
                textAlign: 'center',
                color: 'black',
                fontSize: FontSize.fontSizeText20,
                fontFamily: FontFamily.NotoSansDisplayRegular,
                fontWeight: '700',
              }}>
              {fontLanguage.profile[0].liked_not_fav}
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
              {fontLanguage.profile[0].liked_fav}
            </Text>
            <View style={{alignItems: 'center'}}>
              <NotLiked width={RFPercentage(28)} height={RFPercentage(28)} />
            </View>
          </View>
        </>
      ) : (
        <FlatList
          style={{flex: 1}}
          contentContainerStyle={{alignItems: 'center'}}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          data={likedProject}
          renderItem={({item, index}) => {
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.5}
                style={style.projectFound}
                onPress={() => navigateTo(item.id)}>
                <View
                  style={
                    {
                      // paddingHorizontal: RFPercentage(3),
                      // width:'100%',
                      // backgroundColor:'green'
                    }
                  }>
                  <View
                    style={{
                      // marginHorizontal: RFPercentage(2),
                      paddingHorizontal: RFPercentage(2),
                      width: '100%',
                      marginTop: RFPercentage(2),
                      marginBottom: 6,
                    }}>
                    <Text
                      style={{
                        // backgroundColor: 'blue',
                        fontSize: FontSize.fontSizeText17,
                        fontWeight: '600',
                        color: 'black',
                        fontFamily: FontFamily.NotoSansDisplaySemiBold,
                        marginBottom: '1%',
                        alignSelf: 'flex-start',
                      }}>
                      {item.name}
                    </Text>
                    <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                      {item.hasTag.map((x, i) => {
                        const matchingHastag = hastags.find(
                          hastag => hastag.id === x,
                        );
                        if (matchingHastag) {
                          return (
                            <Text
                              key={i}
                              style={{
                                alignSelf: 'flex-start',
                                color: 'blue',
                                marginBottom: '2%',
                              }}>
                              #{matchingHastag.hasTag}
                              {'  '}
                            </Text>
                          );
                        }
                      })}
                    </View>
                    <View style={{flexWrap: 'wrap'}}>
                      <Text
                        style={{
                          alignSelf: 'flex-start',
                          flexWrap: 'wrap',
                          marginBottom: '2%',
                        }}>
                        {item.description.length > 150
                          ? item.description.slice(0, 150) + '...'
                          : item.description}
                      </Text>
                    </View>
                  </View>
                  <ImageBackground
                    borderBottomLeftRadius={10}
                    borderBottomRightRadius={10}
                    source={
                      item.cover && item.cover[0]
                        ? {uri: imageUrl + item.cover[0].image}
                        : require('../../../assets/backgrounds/nuevoproyecto.jpg')
                    }
                    style={{
                      ...style.imageBackground,
                      width: '100%',
                      height: RFPercentage(23),
                      backgroundColor: item.cover ? 'transparent' : 'grey',
                    }}>
                    <View
                      style={{
                        position: 'absolute',
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'center',
                        bottom: 2,
                        left: 0,
                        right: 0,
                        justifyContent: 'space-between',
                        // marginHorizontal: RFPercentage(1),
                        width: '100%',
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          backgroundColor: 'white',
                          borderRadius: 15,
                          margin: '2%',
                          paddingHorizontal: '3%',
                          paddingVertical: '2%',
                        }}>
                        <People width={16} height={16} color={'#000000'} />
                        <Text
                          style={{
                            fontSize: FontSize.fontSizeText13,
                            marginHorizontal: RFPercentage(1),
                          }}>
                          {item.contributions}
                        </Text>
                        {true ? (
                          <HeartFill width={16} height={16} color={'#ff0000'} />
                        ) : (
                          <Heart width={16} height={16} color={'#000000'} />
                        )}
                        <Text
                          style={{
                            fontSize: FontSize.fontSizeText13,
                            marginHorizontal: RFPercentage(1),
                          }}>
                          {item.total_likes}
                        </Text>
                      </View>
                      {/* <View
                      style={{
                        flexDirection: 'row',
                        backgroundColor: 'white',
                        borderRadius: 15,
                        margin: '2%',
                        paddingHorizontal: '3%',
                        paddingVertical: '2%',
                      }}>
                      <TouchableOpacity
                        onPress={() => toggleLike(item.id)}
                        style={{flexDirection: 'row'}}>
                        {item.is_liked_by_user ? (
                          <HeartFill width={16} height={16} color={'#ff0000'} />
                        ) : (
                          <Heart width={16} height={16} color={'#000000'} />
                        )}
                        <Text
                          style={{
                            fontSize: FontSize.fontSizeText13,
                            marginHorizontal: RFPercentage(1),
                          }}>
                          {item.total_likes}
                        </Text>
                      </TouchableOpacity>
                    </View> */}
                    </View>
                  </ImageBackground>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </>
  );
  const Created = () => (
    <>
      {createdProjects && createdProjects.length <= 0 ? (
        <>
          <View style={{alignItems: 'center', marginTop: '7%'}}>
            <Text
              style={{
                width: '65%',
                textAlign: 'center',
                color: 'black',
                fontSize: FontSize.fontSizeText20,
                fontFamily: FontFamily.NotoSansDisplayRegular,
                fontWeight: '700',
              }}>
              {fontLanguage.profile[0].created_not}
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
              {fontLanguage.profile[0].created_proyect}
            </Text>
            <View style={{alignItems: 'center'}}>
              <NotCreated width={RFPercentage(28)} height={RFPercentage(28)} />
            </View>
          </View>
        </>
      ) : (
        <FlatList
          style={{flex: 1}}
          contentContainerStyle={{alignItems: 'center'}}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          data={createdProjects}
          renderItem={({item, index}) => {
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.5}
                style={style.projectFound}
                onPress={() => navigateTo(item.id)}>
                <View
                  style={
                    {
                      // paddingHorizontal: RFPercentage(3),
                      // width:'100%',
                      // backgroundColor:'green'
                    }
                  }>
                  <View
                    style={{
                      // marginHorizontal: RFPercentage(2),
                      paddingHorizontal: RFPercentage(2),
                      width: '100%',
                      marginTop: RFPercentage(2),
                      marginBottom: 6,
                    }}>
                    <Text
                      style={{
                        // backgroundColor: 'blue',
                        fontSize: FontSize.fontSizeText17,
                        fontWeight: '600',
                        color: 'black',
                        fontFamily: FontFamily.NotoSansDisplaySemiBold,
                        marginBottom: '1%',
                        alignSelf: 'flex-start',
                      }}>
                      {item.name}
                    </Text>
                    <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                      {item.hasTag.map((x, i) => {
                        const matchingHastag = hastags.find(
                          hastag => hastag.id === x,
                        );
                        if (matchingHastag) {
                          return (
                            <Text
                              key={i}
                              style={{
                                alignSelf: 'flex-start',
                                color: 'blue',
                                marginBottom: '2%',
                              }}>
                              #{matchingHastag.hasTag}
                              {'  '}
                            </Text>
                          );
                        }
                      })}
                    </View>
                    <View style={{flexWrap: 'wrap'}}>
                      <Text
                        style={{
                          alignSelf: 'flex-start',
                          flexWrap: 'wrap',
                          marginBottom: '2%',
                        }}>
                        {item.description.length > 150
                          ? item.description.slice(0, 150) + '...'
                          : item.description}
                      </Text>
                    </View>
                  </View>
                  <ImageBackground
                    borderBottomLeftRadius={10}
                    borderBottomRightRadius={10}
                    source={
                      item.cover && item.cover[0]
                        ? {uri: imageUrl + item.cover[0].image}
                        : require('../../../assets/backgrounds/nuevoproyecto.jpg')
                    }
                    style={{
                      ...style.imageBackground,
                      width: '100%',
                      height: RFPercentage(23),
                      backgroundColor: item.cover ? 'transparent' : 'grey',
                    }}>
                    <View
                      style={{
                        position: 'absolute',
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'center',
                        bottom: 2,
                        left: 0,
                        right: 0,
                        justifyContent: 'space-between',
                        // marginHorizontal: RFPercentage(1),
                        width: '100%',
                      }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          backgroundColor: 'white',
                          borderRadius: 15,
                          margin: '2%',
                          paddingHorizontal: '3%',
                          paddingVertical: '2%',
                        }}>
                        <People width={16} height={16} color={'#000000'} />
                        <Text
                          style={{
                            fontSize: FontSize.fontSizeText13,
                            marginHorizontal: RFPercentage(1),
                          }}>
                          {item.contributions}
                        </Text>
                        {item.is_liked_by_user ? (
                          <HeartFill width={16} height={16} color={'#ff0000'} />
                        ) : (
                          <Heart width={16} height={16} color={'#000000'} />
                        )}
                        <Text
                          style={{
                            fontSize: FontSize.fontSizeText13,
                            marginHorizontal: RFPercentage(1),
                          }}>
                          {item.total_likes}
                        </Text>
                      </View>
                      {/* <View
                      style={{
                        flexDirection: 'row',
                        backgroundColor: 'white',
                        borderRadius: 15,
                        margin: '2%',
                        paddingHorizontal: '3%',
                        paddingVertical: '2%',
                      }}>
                      <TouchableOpacity
                        onPress={() => toggleLike(item.id)}
                        style={{flexDirection: 'row'}}>
                        {item.is_liked_by_user ? (
                          <HeartFill width={16} height={16} color={'#ff0000'} />
                        ) : (
                          <Heart width={16} height={16} color={'#000000'} />
                        )}
                        <Text
                          style={{
                            fontSize: FontSize.fontSizeText13,
                            marginHorizontal: RFPercentage(1),
                          }}>
                          {item.total_likes}
                        </Text>
                      </TouchableOpacity>
                    </View> */}
                    </View>
                  </ImageBackground>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </>
  );

  const renderScene = SceneMap({
    one: Contribution,
    two: Liked,
    three: Created,
  });

  const _renderTabBar = (props: {
    navigationState: {routes: any[]};
    position: {interpolate: (arg0: {inputRange: any; outputRange: any}) => any};
  }) => {
    const inputRange = props.navigationState.routes.map((x, i) => i);

    return (
      <View style={styles.tabBar}>
        {props.navigationState.routes.map((route, i) => {
          const opacity = props.position.interpolate({
            inputRange,
            outputRange: inputRange.map(inputIndex =>
              inputIndex === i ? 1 : 0.25,
            ),
          });
          const fontWeight = '500';
          return (
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setIndex(i)}>
              <Animated.Text
                style={{
                  opacity,
                  fontWeight,
                  color: 'black',
                  // fontSize:
                  //   route.title.length <= 9
                  //     ? FontSize.fontSizeText15
                  //     : FontSize.fontSizeText13,
                  fontSize: FontSize.fontSizeText13,
                  fontFamily: FontFamily.NotoSansDisplayMedium,
                }}
                numberOfLines={1}
                ellipsizeMode="tail">
                {route.title}
              </Animated.Text>
              <View
                style={[
                  styles.tabBarIndicator,
                  {backgroundColor: i === index ? '#304be2' : 'transparent'},
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  //#endregion

  //#region useEffects
  useEffect(() => {
    setUserEdit(false);
    userDataApi();
    // projectListApi(); //este habrá que moverlo a dentro del userDataApi para que cargue en el futuro los proyectos que el tiene favs y demás
  }, []);

  useEffect(() => {
    userDataApi();
  }, [userEdit]);

  useEffect(() => {
    getHastagApi();
  }, []);

  useEffect(() => {
    projectListApi();
    getOrganizationApi();
  }, [userProfile]);

  //#endregion

  //#region api
  const projectListApi = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await citmapApi.get<ShowProject[]>('/project/', {
        headers: {
          Authorization: token,
        },
      });
      setLikedProject(resp.data.filter(x => x.is_liked_by_user === true));
      //convierte la lista de de participated a una de valores id solo
      const idsListParticipated = userProfile.participated_projects.map(
        obj => obj.id,
      );
      setContributionProject(
        resp.data.filter(x => idsListParticipated.includes(x.id)),
      );
      // console.log(idsListParticipated);
      setCreatedProject(resp.data.filter(x => x.creator === user.pk));
    } catch {}
  };

  const userDataApi = async () => {
    let token;

    while (!token) {
      token = await AsyncStorage.getItem('token');
    }
    try {
      const resp = await citmapApi.get<User>('/users/authentication/user/', {
        headers: {
          Authorization: token,
        },
      });
      setUser(resp.data);
      const profile = await citmapApi.get<UserInfo>(`/users/${resp.data.pk}/`, {
        headers: {
          Authorization: token,
        },
      });
      setUserProfile(profile.data.profile);
      form.country = profile.data.profile.country;
      form.biography = profile.data.profile.biography;
      if (profile.data.profile.cover) {
        setProfileImageCharged(profile.data.profile.cover);
      }
      setIsSwitchOn(profile.data.profile.visibility);
      getCountriesApi();
      // console.log(JSON.stringify(profile.data.profile, null, 2));
    } catch {}
  };

  const getHastagApi = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await citmapApi.get<HasTag[]>('/project/hastag/', {
        headers: {
          Authorization: token,
        },
      });
      setHastags(resp.data);
    } catch {}
  };

  const getOrganizationApi = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await citmapApi.get<Organization[]>('/organization/', {
        headers: {
          Authorization: token,
        },
      });
      setOrganization(resp.data);
      if (resp.data) {
      }
    } catch {}
  };

  const getCountriesApi = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await citmapApi.get<[]>('/users/countries/', {
        headers: {
          Authorization: token,
        },
      });
      setCountries(resp.data);
      if (userProfile.country) {
        const country = resp.data.find(x => x[1] === userProfile.country);
        if (country) {
          setSelectedCountry(country);
        }
      }
      setIsAllCharged(true);
    } catch {}
  };

  //#endregion

  //#region Methods

  const formatDate = (updated_at: any) => {
    const date = new Date(updated_at);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  };

  const writeForm = () => {
    setObject(userProfile);
  };

  const rightRenderIconHeader = () => {
    if (userEdit) {
      return (
        <View
          style={{
            justifyContent: 'center',
            flexDirection: 'row',
            alignSelf: 'center',
            marginTop: RFPercentage(0.5),
          }}>
          <TouchableOpacity onPress={() => saveProfile()}>
            <Text style={{color: 'blue'}}>
              {fontLanguage.global[0].save_button}
            </Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View
          style={{
            justifyContent: 'center',
            flexDirection: 'row',
            alignSelf: 'center',
            marginTop: RFPercentage(0.3),
          }}>
          <TouchableOpacity
            style={styles.buttonEdit}
            onPress={() => setUserEdit(!userEdit)}>
            <PencilSquare
              width={RFPercentage(2.5)}
              height={RFPercentage(2.5)}
              fill={'#000000'}
            />
          </TouchableOpacity>
        </View>
      );
    }
  };

  const showModalGenre = () => setModalVisibleGenre(true);
  const showModalSave = () => setModalVisibleSave(true);
  const hideModalSave = () => setModalVisibleSave(false);
  const hideModalGenre = () => setModalVisibleGenre(false);
  const showModalOrganization = () => setModalVisibleOrganization(true);
  const hideModalOrganization = () => setModalVisibleOrganization(false);
  const showModalBirth = () => setModalVisibleBirth(true);
  const hideModalBirth = () => setModalVisibleBirth(false);
  const showModalLocation = () => setModalVisibleUbicacion(true);
  const hideModalLocation = () => setModalVisibleUbicacion(false);
  const [controlSizeImage, setControlSizeImage] = useState(false);
  const showModalControlSizeImage = () => setControlSizeImage(true);
  const hideModalControlSizeImage = () => setControlSizeImage(false);

  const setSelectedGenreMethod = (gender: string) => {
    setGenre(gender); // Guarda el género seleccionado en el estado
    // hideModalGenre(); // Cierra el modal
  };

  const setSelectedOrganizationVisibilityMethod = (state: string) => {
    setVisibilityOrganization(state);
    // hideModalOrganization(); // Cierra el modal
  };
  const setSelectedBirthVisibilityMethod = (state: string) => {
    setVisibilityBirth(state);
    // hideModalOrganization(); // Cierra el modal
  };

  const setSelectedLocationVisibilityMethod = (state: string) => {
    setVisibilityUbicacion(state);
    // hideModalOrganization(); // Cierra el modal
  };

  const setSelectedSaveMethod = (state: string) => {
    setVisibilityOrganization(state);
  };

  //metodo para poder navegar entre
  const navigateTo = (projectId: number) => {
    // navigation.dispatch(
    //   CommonActions.reset({
    //     index: 0,
    //     routes: [
    //       {
    //         name: 'HomeNavigator',
    //         state: {
    //           routes: [
    //             {
    //               name: 'ProjectPage',
    //               params: {
    //                 id: projectId,
    //                 isNew: false,
    //                 fromProfile: true,
    //               },
    //             },
    //           ],
    //         },
    //       },
    //     ],
    //   }),
    // );
    navigation.navigate('ProjectPage', {
      id: projectId,
      isNew: false,
      fromProfile: true,
    });
  };

  const navigateToMap = (id: number, coords: string, is_private: boolean) => {
    const location = parseGeoposition(coords);
    if (location) setObservationSelected({id, is_private, location});

    if (is_private) {
      showModalPass();
    } else {
      if (permissions.locationStatus === 'granted') {
        navigation.navigate('ParticipateMap', {id: id, coords: location});
      }
    }
  };

  const navigateToMapPass = async (value1?: string) => {
    if (observationSelected.is_private) {
      if (value1) {
        try {
          const token = await AsyncStorage.getItem('token');
          const isValid = await citmapApi.post(
            `/projects/${observationSelected.id}/validate-password/`,
            {password: value1},
            {
              headers: {
                Authorization: token,
              },
            },
          );
          if (isValid.data) {
            setIsValidPass(true);
            hideModalPass();
            if (permissions.locationStatus === 'granted') {
              navigation.navigate('ParticipateMap', {
                id: observationSelected.id,
                coords: observationSelected.location,
              });
            }
          }
        } catch (err) {
          console.log('password erronea');
          setIsValidPass(false);
        }
      }
    } else {
      console.log('no es privado');
    }
  };

  const openProfilePhoto = () => {
    ImagePicker.openPicker({
      mediaType: 'photo',
      multiple: false,
      quality: 1,
      maxWidth: 300,
      maxHeight: 300,
      includeBase64: true,
    })
      .then(response => {
        if (response && response.data) {
          if (response.size < 4 * 1024 * 1024) {
            const newImage = response;
            setProfileImage(response);
            setProfileImageBlob({
              uri: newImage.path, // Debes ajustar esto según la estructura de response
              type: newImage.mime, // Tipo MIME de la imagen
              name: 'cover.jpg', // Nombre de archivo de la imagen (puedes cambiarlo)
            });
          } else {
            // showModalControlSizeImage();
            Toast.show({
              type: 'error',
              text1: 'Image',
              // text2: 'No se han podido obtener los datos, por favor reinicie la app',
              text2: fontLanguage.profile[0].image_weight,
            });
          }
        }
      })
      .catch(err => {
        Toast.show({
          type: 'info',
          text1: 'Image',
          // text2: 'No se han podido obtener los datos, por favor reinicie la app',
          text2: fontLanguage.profile[0].image_not_selected,
        });
      });
  };

  const iconVisibility = (text: String) => {
    switch (
      text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase()
    ) {
      case 'solo tu':
        return (
          <Lock
            width={RFPercentage(1.4)}
            height={RFPercentage(2)}
            fill={Colors.contentTertiaryLight}
          />
        );

      case 'solo tu y proyectos':
        return (
          <Card
            width={RFPercentage(1.4)}
            height={RFPercentage(2)}
            fill={Colors.contentTertiaryLight}
          />
        );
      case 'publico':
        return (
          <World
            width={RFPercentage(1.4)}
            height={RFPercentage(2)}
            fill={Colors.contentTertiaryLight}
          />
        );
    }
  };

  //se usará para dar o quitar likes en el perfil
  const toggleLike = async (idProject: number) => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await citmapApi.post(
        `/projects/${idProject}/toggle-like/`,
        {},
        {
          headers: {
            Authorization: token,
          },
        },
      );
      // onRefresh();
    } catch (err) {}
  };

  /**
   * cuando guarda el proyecto, comprueba si hay datos en los campos de cambiar pass y comprueba que sean iguales,
   * tras esto, llama a cambiar pass
   */
  const saveProfile = async () => {
    setIsAllCharged(false);
    if (userEdit) {
      const token = await AsyncStorage.getItem('token');

      const formData = new FormData();
      formData.append('biography', form.biography);
      formData.append('country', form.country.code);
      formData.append('visibility', isSwitchOn);
      if (profileImageBlob) {
        formData.append('cover', profileImageBlob);
      }
      console.log(JSON.stringify(formData, null, 2));
      try {
        const resp = await citmapApi.patch('/users/profile/', formData, {
          headers: {
            Authorization: token,
            // 'Content-Type': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
        });
        if (resp) {
          Toast.show({
            type: 'success',
            text1: fontLanguage.profile[0].toast_save_success,
            // text2: 'No se han podido obtener los datos, por favor reinicie la app',
            // text2: '',
          });
        }
      } catch (error: any) {
        if (error.response) {
          // Se recibió una respuesta del servidor con un código de estado de error

          if (error.response.status === 400) {
            console.log(
              'Error 400: Solicitud incorrecta - La solicitud tiene un formato incorrecto o faltan datos.',
            );
          } else if (error.response.status === 401) {
            console.log(
              'Error 401: No autorizado - La solicitud requiere autenticación.',
            );
          } else if (error.response.status === 403) {
            console.log(
              'Error 403: Prohibido - No tienes permiso para acceder a este recurso.',
            );
          } else if (error.response.status === 404) {
            console.log(
              'Error 404: No encontrado - El recurso solicitado no existe en el servidor.',
            );
          } else {
            console.log(
              `Error ${error.response.status}: Error en la solicitud.`,
            );
          }
          Toast.show({
            type: 'error',
            text1: fontLanguage.profile[0].toast_err,
            // text2: 'No se han podido obtener los datos, por favor reinicie la app',
            text2: error.response.data,
          });
          // Puedes acceder a detalles adicionales de la respuesta del servidor:
          console.log('Mensaje del servidor:', error.response.data);
          console.log('Encabezados de respuesta:', error.response.headers);
        } else if (error.request) {
          // La solicitud se realizó, pero no se recibió una respuesta
          console.log(
            'Error de red: No se pudo recibir una respuesta del servidor.',
          );
          Toast.show({
            type: 'error',
            text1: fontLanguage.profile[0].toast_err,
            // text2: 'No se han podido obtener los datos, por favor reinicie la app',
            text2: error.request,
          });
        } else {
          // Se produjo un error durante la configuración de la solicitud
          console.log('Error de configuración de la solicitud:', error.message);
          Toast.show({
            type: 'error',
            text1: fontLanguage.profile[0].toast_err,
            // text2: 'No se han podido obtener los datos, por favor reinicie la app',
            text2: error.message,
          });
        }
      } finally {
        setUserEdit(!userEdit);
        setIsAllCharged(true);
      }
    }
  };

  const onDelete = async () => {
    try {
      let token;
      while (!token) {
        token = await AsyncStorage.getItem('token');
      }
      console.log(JSON.stringify(token));
      const resp = await citmapApi.delete(`/users/delete/`, {
        headers: {
          Authorization: token,
        },
      });
      Toast.show({
        type: 'success',
        text1: fontLanguage.profile[0].user_deleted_success,
      });
      hideModalDelete();
      // logaut
      signOut();
    } catch (err) {
      signOut();
      console.log(JSON.stringify(err, null, 2));
      // Toast.show({
      //   type: 'error',
      //   text1: fontLanguage.organization[0].project_deleted_error,
      // });
    }
  };

  const changeCountry = (code: string) => {
    const newCountry = countries.find(x => x[0] === code);
    const newCountryValue = newCountry
      ? {code: newCountry[0], name: newCountry[1]}
      : {code: 'ES', name: 'ESPAÑA'};
    onChange(newCountryValue, 'country');
  };

  const parseGeoposition = (geopositionStr: string) => {
    // Verificamos si la cadena contiene 'POINT ('
    if (geopositionStr.includes('POINT (')) {
      // Extraemos las coordenadas de la cadena usando una expresión regular
      const match = /POINT \(([^ ]+) ([^)]+)\)/.exec(geopositionStr);

      if (match && match.length === 3) {
        // Obtenemos las coordenadas de la expresión regular
        const longitudeStr = match[1];
        const latitudeStr = match[2];

        // Convertimos las cadenas a números
        const longitude = parseFloat(longitudeStr);
        const latitude = parseFloat(latitudeStr);

        // Obtenemos el SRID de la cadena
        const sridMatch = /SRID=([^;]+)/.exec(geopositionStr);
        const srid = sridMatch ? sridMatch[1] : '';

        // Creamos una instancia de GeoPosition con los valores obtenidos
        const geoPosition: Location = {
          longitude,
          latitude,
        };

        return geoPosition;
      }
    }
  };

  //#endregion

  // if (!isAllCharged) {
  //   return <LoadingScreen />;
  // }

  return (
    <>
      <HeaderComponent
        title={!userEdit ? user.username : fontLanguage.profile[0].edit_profile}
        onPressLeft={() => navigation.goBack()}
        onPressRight={() => saveProfile()}
        rightIcon={canEdit ? true : false}
        renderRight={() => rightRenderIconHeader()}
      />
      {userEdit ? (
        <>
          <SafeAreaView style={{flex: 1, marginBottom: '10%'}}>
            <ScrollView
              style={styles.scrollParent}
              nestedScrollEnabled={true}
              ref={scrollViewRef}
              contentContainerStyle={{flexGrow: 1}}
              keyboardShouldPersistTaps="handled">
              {/* imagen de perfil */}
              <View
                style={{
                  width: '100%',
                  height: RFPercentage(15), // Aquí establece la altura al 25% del ancho de la pantalla
                  justifyContent: 'center', // Centra verticalmente
                  alignItems: 'center', // Centra horizontalmente
                  marginVertical: RFPercentage(5),
                  // backgroundColor: 'red',
                }}>
                <View
                  style={{
                    width: '30%',
                    height: '100%', // Mantén la altura igual a la del contenedor
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: Colors.secondaryBackground,
                    borderRadius: 10,
                    // backgroundColor: 'green',
                  }}>
                  {profileImage ? (
                    <>
                      <Image
                        source={{
                          uri: 'data:image/jpeg;base64,' + profileImage.data,
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          // borderRadius: 50,
                          resizeMode: 'cover',
                        }}
                      />
                    </>
                  ) : profileImageCharged ? (
                    <>
                      <Image
                        source={{
                          uri: profileImageCharged,
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          // borderRadius: 50,
                          resizeMode: 'cover',
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <TouchableOpacity onPress={() => openProfilePhoto()}>
                        <Person
                          fill={'black'}
                          height={RFPercentage(7)}
                          width={RFPercentage(7)}
                        />
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity
                    onPress={() => openProfilePhoto()}
                    style={{
                      width: RFPercentage(4),
                      position: 'absolute',
                      bottom: RFPercentage(-1),
                      left: RFPercentage(12.4),
                      zIndex: 999,
                    }}>
                    <PlusImg
                      width={RFPercentage(4)}
                      height={RFPercentage(4)}
                      fill={'#0059ff'}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* formulario */}
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                }}>
                {/* visibilidad */}
                <View
                  style={{
                    width: '80%',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginVertical: RFPercentage(1),
                  }}>
                  <Text
                    style={{
                      color: 'black',
                      fontFamily: FontFamily.NotoSansDisplayMedium,
                      fontSize: FontSize.fontSizeText15,
                    }}>
                    {fontLanguage.profile[0].form.visibility}
                  </Text>
                  <Switch
                    value={isSwitchOn}
                    onValueChange={onToggleSwitch}
                    color={Colors.semanticSuccessLight}
                  />
                </View>

                {/* descripción de visibilidad  */}
                <View
                  style={{
                    // backgroundColor: 'yellow',
                    width: '80%',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginVertical: RFPercentage(1),
                  }}>
                  <Text
                    style={{
                      color: 'black',
                      fontFamily: FontFamily.NotoSansDisplayLight,
                      fontSize: FontSize.fontSizeText13,
                    }}>
                    {fontLanguage.profile[0].form.visibility_description}
                  </Text>
                </View>

                {/* nombre de usuario */}
                <View
                  style={{
                    width: '80%',
                    marginVertical: RFPercentage(1),
                  }}>
                  <Text
                    style={{
                      color: 'black',
                      fontFamily: FontFamily.NotoSansDisplayMedium,
                      fontSize: FontSize.fontSizeText15,
                    }}>
                    {fontLanguage.profile[0].form.user_name}
                  </Text>
                  <InputText
                    editable={false}
                    // isInputText={() => setIsInputText(!isInputText)}
                    label={fontLanguage.profile[0].form.user_name}
                    keyboardType="default"
                    multiline={false}
                    numOfLines={1}
                    onChangeText={value => console.log(value)}
                    value={user.username}
                  />
                </View>

                {/* biografia */}
                <View
                  style={{
                    width: '80%',
                    // height: 200,
                    marginVertical: RFPercentage(1),
                    marginHorizontal: RFPercentage(5),
                  }}>
                  <Text
                    style={{
                      color: 'black',
                      fontFamily: FontFamily.NotoSansDisplayMedium,
                      fontSize: FontSize.fontSizeText15,
                    }}>
                    {fontLanguage.profile[0].form.biography}
                  </Text>
                  <InputText
                    // isInputText={() => setIsInputText(!isInputText)}
                    label={fontLanguage.profile[0].form.biography}
                    keyboardType="default"
                    multiline={true}
                    maxLength={MAX_CHARACTERS}
                    numOfLines={5}
                    onChangeText={value => onChange(value, 'biography')}
                    value={form.biography}
                    onPressIn={() => {
                      if (scrollViewRef.current) {
                        scrollViewRef.current.scrollTo({
                          y: RFPercentage(15),
                          animated: true,
                        });
                      }
                    }}
                  />
                  <View
                    style={{
                      // width: '80%',
                      justifyContent: 'flex-end',
                      alignItems: 'flex-end',
                      flexDirection: 'row',
                    }}>
                    <Text
                      style={{
                        color:
                          form.biography &&
                          form.biography.length <= MAX_CHARACTERS
                            ? 'black'
                            : 'red',
                        fontSize: FontSize.fontSizeText13,
                      }}>
                      {form.biography && form.biography.length
                        ? form.biography.length
                        : 0}
                    </Text>
                    <Text style={{fontSize: FontSize.fontSizeText13}}>
                      /{MAX_CHARACTERS}
                    </Text>
                  </View>
                </View>

                {/* email */}
                {/* <View
                  style={{
                    width: '80%',
                    marginVertical: RFPercentage(1),
                  }}>
                  <Text style={{color: 'black'}}>Correo electrónico</Text>
                  <InputText
                    // isInputText={() => setIsInputText(!isInputText)}
                    label={'Email'}
                    keyboardType="email-address"
                    multiline={false}
                    numOfLines={1}
                    onChangeText={value => console.log(value)}
                    value={user.email}
                  />
                </View> */}

                {/* cambiar contraseña */}
                {/* <View
                  style={{
                    width: '80%',
                    marginVertical: RFPercentage(1),
                  }}>
                  <Text style={{color: 'black'}}>Cambiar contraseña</Text>
                  <InputText
                    // isInputText={() => setIsInputText(!isInputText)}
                    label={'Escriba la contraseña'}
                    inputType={true}
                    multiline={false}
                    numOfLines={1}
                    isSecureText={true}
                    onChangeText={value => console.log()}
                  />
                </View> */}

                {/* cambiar nueva contraseña */}
                {/* <View
                  style={{
                    width: '80%',
                    marginVertical: RFPercentage(1),
                  }}>
                  <Text style={{color: 'black'}}>
                    Confirmar nueva contraseña
                  </Text>
                  <InputText
                    // isInputText={() => setIsInputText(!isInputText)}
                    label={'Escriba la contraseña'}
                    inputType={true}
                    multiline={false}
                    numOfLines={1}
                    isSecureText={true}
                    onChangeText={value => console.log()}
                  />
                </View> */}

                {/* organizacion */}
                <View
                  style={{
                    width: '80%',
                    marginVertical: RFPercentage(1),
                  }}>
                  <Text
                    style={{
                      color: 'black',
                      fontFamily: FontFamily.NotoSansDisplayMedium,
                      fontSize: FontSize.fontSizeText15,
                    }}>
                    {fontLanguage.profile[0].form.organization}
                  </Text>

                  <TouchableOpacity
                    style={{backgroundColor: 'transparent'}}
                    activeOpacity={0.8}
                    onPress={showModalInfo}>
                    <View
                      style={{
                        ...globalStyles.inputContainer,
                        backgroundColor:
                          userProfile.created_organizations &&
                          userProfile.created_organizations.length > 0
                            ? Colors.semanticSuccessLight
                            : Colors.semanticInfoLight,

                        // height: '30%'
                        borderWidth: 0,
                      }}>
                      <View
                        style={{
                          flex: 1,
                          marginHorizontal: '5%',
                          justifyContent: 'center',
                          top: 1,
                        }}>
                        {userProfile.created_organizations &&
                        userProfile.created_organizations.length > 0 ? (
                          <IconBootstrap
                            name={'BookMark'}
                            size={RFPercentage(2)}
                            color={'white'}
                          />
                        ) : (
                          <View
                            style={{
                              justifyContent: 'center',
                              alignItems: 'center',
                              top: RFPercentage(0.4),
                            }}>
                            <IconBootstrap
                              name={'Info'}
                              size={RFPercentage(3)}
                              color={'white'}
                            />
                          </View>
                        )}
                      </View>
                      <Text
                        style={{
                          width: '80%',
                          fontSize: FontSize.fontSizeText13,
                          fontFamily: FontFamily.NotoSansDisplayLight,
                          fontWeight: '300',
                          color: 'white',
                          alignSelf: 'center',
                          textAlignVertical: 'center',
                          alignItems: 'center',
                          alignContent: 'center',
                          textAlign:
                            userProfile.created_organizations &&
                            userProfile.created_organizations.length > 0
                              ? 'center'
                              : 'left',
                          height: Size.window.height * 0.04,
                          paddingTop:
                            Platform.OS === 'ios' ? RFPercentage(0.9) : 0,
                        }}>
                        {userProfile.created_organizations &&
                        userProfile.created_organizations.length > 0
                          ? userProfile.created_organizations[0].principalName
                          : fontLanguage.profile[0].form.question_organization}
                      </Text>
                      {userProfile.created_organizations &&
                        userProfile.created_organizations.length > 0 && (
                          <View
                            style={{
                              marginRight: '7%',
                              // flex: 1,
                              alignItems: 'flex-end',
                              justifyContent: 'center',
                              top: '1%',
                            }}>
                            <IconBootstrap
                              name={'CheckCircle'}
                              size={RFPercentage(3)}
                              color={'white'}
                            />
                          </View>
                        )}
                    </View>
                  </TouchableOpacity>
                  {/* <View
                    style={{
                      flexDirection: 'row',
                      marginVertical: RFPercentage(1),
                    }}>
                    <TouchableOpacity onPress={() => showModalOrganization()}>
                      <Text
                        style={{
                          color: Colors.semanticInfoDark,
                          fontSize: FontSize.fontSizeText13,
                          marginRight: '2%',
                        }}>
                        ¿Quién puede ver esto?
                      </Text>
                    </TouchableOpacity>
                    {visibilityOrganization.length > 0 &&
                      iconVisibility(visibilityOrganization)}
                    <Text
                      style={{
                        color: Colors.contentTertiaryLight,
                        fontSize: FontSize.fontSizeText13,
                        fontFamily: FontFamily.NotoSansDisplayLight,
                        marginLeft: '2%',
                      }}>
                      {visibilityOrganization}
                    </Text>
                  </View> */}
                </View>

                {/* ubicacion */}
                <View
                  style={{
                    width: '80%',
                    marginVertical: RFPercentage(1),
                  }}>
                  <Text
                    style={{
                      color: 'black',
                      fontFamily: FontFamily.NotoSansDisplayMedium,
                      fontSize: FontSize.fontSizeText15,
                    }}>
                    {fontLanguage.profile[0].form.location}
                  </Text>
                  <Picker
                    selectedValue={form.country.code}
                    onValueChange={(itemValue, itemIndex) => {
                      // Aquí puedes manejar el valor seleccionado, por ejemplo, actualizando form.country
                      // En este ejemplo, simplemente imprimimos el valor seleccionado.
                      // setSelectedCountry(itemValue)
                      // onChange(itemValue, 'country')
                      changeCountry(itemValue);
                    }}
                    style={{
                      width: RFPercentage(41),
                      color: 'black',
                      fontFamily: FontFamily.NotoSansDisplayMedium,
                      fontSize: FontSize.fontSizeText15,
                    }}>
                    {countries.map((pais, index) => (
                      <Picker.Item
                        key={index}
                        label={pais[1]}
                        value={pais[0]}
                      />
                    ))}
                  </Picker>
                  {/* <View
                    style={{
                      flexDirection: 'row',
                      marginVertical: RFPercentage(1),
                    }}>
                    <TouchableOpacity onPress={() => showModalLocation()}>
                      <Text
                        style={{
                          color: Colors.semanticInfoDark,
                          fontSize: FontSize.fontSizeText13,
                        }}>
                        ¿Quién puede ver esto?
                      </Text>
                    </TouchableOpacity>
                    <Text
                      style={{
                        color: Colors.contentTertiaryLight,
                        fontSize: FontSize.fontSizeText13,
                        fontFamily: FontFamily.NotoSansDisplayLight,
                        marginLeft: '5%',
                      }}>
                      {visibilityUbicacion}
                    </Text>
                  </View> */}
                </View>

                <View
                  style={{
                    width: '70%',
                    marginHorizontal: RFPercentage(1),
                    marginBottom: '5%',
                  }}>
                  <CustomButton
                    onPress={() => showModalDelete()}
                    label={fontLanguage.profile[0].delete_user}
                    backgroundColor={Colors.semanticDangerLight}
                  />
                </View>
                {/* fecha nacimiento */}
                {/* <View
                  style={{
                    width: '80%',
                    marginVertical: RFPercentage(1),
                  }}>
                  <Text style={{color: 'black'}}>Fecha de nacimiento</Text>
                  <InputText
                    // isInputText={() => setIsInputText(!isInputText)}
                    label={'00 / 00 / 0000'}
                    keyboardType="number-pad"
                    multiline={false}
                    numOfLines={1}
                    onChangeText={value => onChange(value, 'first_name')}
                  />
                  <View
                    style={{
                      flexDirection: 'row',
                      marginVertical: RFPercentage(1),
                    }}>
                    <TouchableOpacity onPress={() => showModalBirth()}>
                      <Text
                        style={{
                          color: Colors.semanticInfoDark,
                          fontSize: FontSize.fontSizeText13,
                        }}>
                        ¿Quién puede ver esto?
                      </Text>
                    </TouchableOpacity>
                    <Text
                      style={{
                        color: Colors.contentTertiaryLight,
                        fontSize: FontSize.fontSizeText13,
                        fontFamily: FontFamily.NotoSansDisplayLight,
                        marginLeft: '5%',
                      }}>
                      {visibilityBirth}
                    </Text>
                  </View>
                </View> */}

                {/* sexo genero */}
                {/* <View
                  style={{
                    width: '80%',
                    marginVertical: RFPercentage(1),
                    marginBottom: RFPercentage(5),
                  }}>
                  <Text style={{color: 'black'}}>Sexo/Género</Text>
                  <View
                    style={{
                      ...globalStyles.inputContainer,
                      backgroundColor: 'transparent',
                    }}>
                    <View
                      style={{
                        flex: 1,
                        marginHorizontal: '5%',
                        justifyContent: 'center',
                        top: 1,
                      }}>
                      <IconBootstrap name={'info'} size={20} color={'white'} />
                    </View>
                    <Text
                      style={{
                        width: '80%',
                        fontSize: FontSize.fontSizeText13,
                        fontFamily: FontFamily.NotoSansDisplayLight,
                        fontWeight: '300',
                        color: 'black',
                        alignSelf: 'center',
                        textAlignVertical: 'center',
                        backgroundColor: 'transparent',
                        height: Size.window.height * 0.04,
                      }}>
                      {genre}
                    </Text>
                    <TouchableOpacity
                      onPress={() => showModalGenre()}
                      style={{
                        marginRight: '1%',
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        top: '1%',
                      }}>
                      <IconBootstrap
                        name={'CaretDown'}
                        size={20}
                        color={'black'}
                      />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => console.log('abrir modal visibilidad')}
                    style={{
                      flexDirection: 'row',
                      marginVertical: RFPercentage(1),
                    }}>
                    <Text
                      style={{
                        color: Colors.contentQuaternaryDark,
                        fontSize: FontSize.fontSizeText10,
                      }}>
                      ¿Quién puede ver esto?
                    </Text>
                  </TouchableOpacity>
                </View> */}
              </View>

              {/* modal genero */}
              <GenderSelectorModal
                visible={modalVisibleGenre}
                hideModal={hideModalGenre}
                onPress={hideModalGenre}
                setSelected={setSelectedGenreMethod}
                selected={genre}
              />

              {/* modal visibilidad organizacion */}
              <VisibilityOrganizationModal
                visible={modalVisibleOrganization}
                hideModal={hideModalOrganization}
                onPress={hideModalOrganization}
                setSelected={setSelectedOrganizationVisibilityMethod}
                selected={visibilityOrganization}
                label="¿Quién puede ver tu organizacion?"
              />
              {/* modal visibilidad ubicacion */}
              <VisibilityOrganizationModal
                visible={modalVisibleUbicacion}
                hideModal={hideModalLocation}
                onPress={hideModalLocation}
                setSelected={setSelectedLocationVisibilityMethod}
                selected={visibilityUbicacion}
                label="¿Quién puede ver tu ubicación?"
              />
              {/* modal visibilidad nacimiento */}
              <VisibilityBirthday
                visible={modalVisibleBirth}
                hideModal={hideModalBirth}
                onPress={hideModalBirth}
                setSelected={setSelectedBirthVisibilityMethod}
                selected={visibilityBirth}
                label="¿Quién puede ver tu fecha de nacimiento?"
              />
              <DeleteModal
                visible={deleteModal}
                hideModal={hideModalDelete}
                onPress={() => {
                  onDelete();
                }}
                size={RFPercentage(4)}
                color={Colors.semanticWarningDark}
                label={fontLanguage.profile[0].delete_modal_label}
                subLabel={fontLanguage.profile[0].delete_modal_sublabel}
                helper={false}
              />
            </ScrollView>
            <InfoModal
              visible={infoModal}
              hideModal={hideModalInfo}
              onPress={hideModalInfo}
              size={RFPercentage(4)}
              color={Colors.primaryLigth}
              label={fontLanguage.profile[0].form.modal_info_label}
              subLabel={fontLanguage.profile[0].form.modal_info_sublabel}
              subLabel2={fontLanguage.profile[0].form.modal_info_sublabel2}
              helper={false}
            />
            <SaveProyectModal
              visible={controlSizeImage}
              hideModal={hideModalControlSizeImage}
              onPress={hideModalControlSizeImage}
              size={RFPercentage(8)}
              color={Colors.semanticWarningDark}
              label={fontLanguage.profile[0].form.modal_save_image}
              helper={false}
            />
          </SafeAreaView>
        </>
      ) : (
        <SafeAreaView
          style={styles.scrollParent}
          // nestedScrollEnabled={true}
          // contentContainerStyle={{flexGrow: 1}}
          // keyboardShouldPersistTaps="handled"
        >
          {/* contenedor profile */}
          <View style={styles.profileContainer}>
            {/* info de arriba */}
            <View
              style={{
                height: RFPercentage(15),
                flexDirection: 'row',
                marginTop: RFPercentage(3),
                // borderRadius: 40
              }}>
              {/* foto de perfil */}
              <View
                style={{
                  width: RFPercentage(13),
                  // height: '100%',
                  height: RFPercentage(13),
                  marginRight: RFPercentage(1),
                  marginLeft: RFPercentage(1),
                  // borderRadius: 40
                }}>
                {/* TODO aquí cambiar a la imagen que viene de base de datos */}
                {profileImage ? (
                  <>
                    <Image
                      borderRadius={10}
                      source={{
                        uri: 'data:image/jpeg;base64,' + profileImage.data,
                      }}
                      style={{
                        height: '100%',
                        maxHeight: heightPercentageToDP(14),
                        maxWidth: RFPercentage(14),
                        // borderRadius: 10,
                        borderRadius: 10,
                        resizeMode: 'cover',
                      }}
                    />
                  </>
                ) : profileImageCharged ? (
                  <>
                    <Image
                      borderRadius={10}
                      source={{
                        uri: profileImageCharged,
                      }}
                      style={{
                        height: '100%',
                        maxHeight: heightPercentageToDP(14),
                        maxWidth: RFPercentage(14),
                        // borderRadius: 10,
                        borderRadius: 10,
                        resizeMode: 'cover',
                        top: heightPercentageToDP(1),
                      }}
                    />
                  </>
                ) : (
                  <>
                    <Image
                      borderRadius={100}
                      // source={require(urii)}
                      source={require('../../../assets/icons/profile/Profile.jpg')}
                      style={{
                        // height: '100%',
                        maxHeight: heightPercentageToDP(14),
                        maxWidth: RFPercentage(14),
                        borderRadius: 10,
                      }}
                    />
                  </>
                )}
              </View>
              {/* datos derecha */}
              <View
                style={{
                  width: '70%',
                  height: '28%',
                  flexDirection: 'column',
                }}>
                {/* contribuciones creados */}
                <View
                  style={{
                    width: '100%',
                    flexDirection: 'column',
                    // marginVertical: RFPercentage(1),
                  }}>
                  <View
                    style={{
                      width: '100%',
                      flexDirection: 'row',
                      justifyContent: 'space-around',
                    }}>
                    <View style={styles.viewDataProfile}>
                      <Text
                        style={{
                          fontFamily: FontFamily.NotoSansDisplayMedium,
                          color: 'black',
                          fontSize: FontSize.fontSizeText18,
                        }}>
                        {userProfile.participated_projects &&
                        userProfile.participated_projects.length > 0
                          ? userProfile.participated_projects.length
                          : 0}
                      </Text>
                    </View>
                    <View style={styles.viewDataProfile}>
                      <Text
                        style={{
                          fontFamily: FontFamily.NotoSansDisplayMedium,
                          color: 'black',
                          fontSize: FontSize.fontSizeText18,
                        }}>
                        {userProfile.created_projects &&
                        userProfile.created_projects.length > 0
                          ? userProfile.created_projects.length
                          : 0}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      width: '100%',
                      flexDirection: 'row',
                      justifyContent: 'space-around',
                      alignItems: 'center',
                      alignSelf: 'center',
                      marginTop: '2%',
                    }}>
                    <View style={styles.viewDataProfile}>
                      <Text>{fontLanguage.profile[0].contributions}</Text>
                    </View>
                    <View style={styles.viewDataProfile}>
                      <Text>{fontLanguage.profile[0].created}</Text>
                    </View>
                  </View>
                </View>
                {/* organizacion country name */}
                <View
                  style={{
                    width: '100%',
                    flexDirection: 'column',
                    marginVertical: RFPercentage(1.5),
                  }}>
                  <View
                    style={{
                      width: '100%',
                      marginHorizontal: RFPercentage(3),
                      marginVertical: RFPercentage(1),
                      flexDirection: 'row',
                    }}>
                    <Bookmark
                      width={RFPercentage(1.8)}
                      height={RFPercentage(1.8)}
                      fill={'#3a53e2'}
                    />
                    <Text
                      style={{
                        // fontWeight: 'bold',
                        height: '100%',
                        color: 'black',
                        alignSelf: 'center',
                        marginLeft: RFPercentage(0.5),
                        bottom: RFPercentage(0.1),
                        fontSize: FontSize.fontSizeText13,
                        fontFamily: FontFamily.NotoSansDisplayRegular,
                        // backgroundColor:'red'
                      }}>
                      {userProfile.created_organizations &&
                      userProfile.created_organizations.length > 0
                        ? userProfile.created_organizations[0].principalName
                        : fontLanguage.profile[0].without_organizations}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: '100%',
                      marginHorizontal: RFPercentage(3),
                      flexDirection: 'row',
                    }}>
                    <Geo
                      width={RFPercentage(1.8)}
                      height={RFPercentage(1.8)}
                      fill={'#3a53e2'}
                    />
                    <Text
                      style={{
                        // fontWeight: 'bold',
                        height: '100%',
                        color: 'black',
                        alignSelf: 'center',
                        marginLeft: RFPercentage(0.5),
                        bottom: RFPercentage(0.1),
                        fontSize: FontSize.fontSizeText13,
                        fontFamily: FontFamily.NotoSansDisplayRegular,
                      }}>
                      {userProfile.country &&
                      userProfile.country.name &&
                      userProfile.country.name.length > 0
                        ? userProfile.country.name
                        : fontLanguage.profile[0].without_location}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            {/* info de abajo */}
            <View
              style={{
                //   height: '60%',
                // flex: 1,
                alignSelf: 'center',
                // backgroundColor:'red',
                marginHorizontal: RFPercentage(3),
                marginVertical: RFPercentage(4),
                width: '100%',
              }}>
              <Text
                style={{
                  fontWeight: 'normal',
                  color: 'black',
                  fontSize: FontSize.fontSizeText14,
                  lineHeight: RFPercentage(2),
                  fontFamily: FontFamily.NotoSansDisplayLight,
                  textAlign: 'left',
                }}>
                {userProfile.biography &&
                userProfile.biography.length > 0 &&
                userProfile.biography != null &&
                userProfile.biography != undefined &&
                userProfile.biography != 'null'
                  ? userProfile.biography
                  : fontLanguage.profile[0].without_description}
              </Text>
            </View>
            <PassModal
              visible={passModal}
              hideModal={hideModalPass}
              onPress={hideModalPass}
              size={RFPercentage(6)}
              helper={isValidPass}
              color={Colors.semanticSuccessLight}
              label={fontLanguage.project[0].modal_pass_label}
              setPass={value => navigateToMapPass(value)}
            />
          </View>
          <TabView
            key={index}
            navigationState={{index, routes}}
            renderScene={renderScene}
            onIndexChange={setIndex}
            renderTabBar={_renderTabBar}
            style={{flex: 1}}

            //   initialLayout={{width: RFPercentage(20)}}
          />
          <Spinner visible={!isAllCharged} />
        </SafeAreaView>
      )}
      <Toast position="bottom" />
    </>
  );
};
const styles = StyleSheet.create({
  scrollParent: {
    flexGrow: 1,
  },
  profileContainer: {
    // height: RFPercentage(34),
    marginHorizontal: RFPercentage(3),
    // backgroundColor:'yellow'
  },
  viewDataProfile: {
    width: '50%',
    alignItems: 'center',
    alignSelf: 'center',
    fontSize: FontSize.fontSizeText13,
    fontFamily: FontFamily.NotoSansDisplayLight,
  },
  tabBar: {
    flexDirection: 'row',
    // paddingTop: StatusBar.currentHeight,
    // marginTop: RFPercentage(2),
    marginHorizontal: RFPercentage(2),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    padding: RFPercentage(1),
  },
  tabBarIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.2,
  },
  buttonEdit: {
    // position: 'absolute',
    // top: RFPercentage(4),
    // right: RFPercentage(2),
    zIndex: 999,
  },
  projectFound: {
    width: RFPercentage(50),
    marginVertical: RFPercentage(3),
    borderRadius: 10,
  },
  imageBackground: {
    height: '100%',
    borderRadius: 10,
  },
});

const style = StyleSheet.create({
  projectFound: {
    width: widthPercentageToDP(90),
    // width: '90%',
    marginVertical: RFPercentage(1),
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4.41,
    elevation: 4,
  },
  imageBackground: {
    height: '100%',
    borderRadius: 10,
  },
});
