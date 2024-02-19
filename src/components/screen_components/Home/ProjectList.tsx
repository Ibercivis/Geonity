import React, {useEffect, useState} from 'react';
import {
  FlatList,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import People from '../../../assets/icons/general/people.svg';
import Heart from '../../../assets/icons/general/heart.svg';
import HeartFill from '../../../assets/icons/general/heart-fill.svg';

import citmapApi, {imageUrl} from '../../../api/citmapApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Project, ShowProject} from '../../../interfaces/interfaces';
import {useForm} from '../../../hooks/useForm';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {HeaderComponent} from '../../HeaderComponent';
import {StackParams} from '../../../navigation/HomeNavigator';
import {StackScreenProps} from '@react-navigation/stack';
import {HasTag, Topic} from '../../../interfaces/appInterfaces';
import {FontFamily, FontSize} from '../../../theme/fonts';
import {widthPercentageToDP} from 'react-native-responsive-screen';
import {useLanguage} from '../../../hooks/useLanguage';

interface Props extends StackScreenProps<StackParams, 'ProjectList'> {}

export const ProjectList = (props: Props) => {
  const [projectList, setProjectList] = useState<ShowProject[]>([]); // partir la lista en 2
  const {fontLanguage} = useLanguage();
  const [topic, setTopic] = useState<Topic[]>([]);

  useEffect(() => {
    getHastagApi();
  }, []);

  useEffect(() => {
    projectListApi();
  }, [topic]);

  const projectListApi = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await citmapApi.get<ShowProject[]>('/project/', {
        headers: {
          Authorization: token,
        },
      });
      setProjectList(resp.data);
    } catch {}
  };

  const getHastagApi = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await citmapApi.get<Topic[]>('/project/topics/', {
        headers: {
          Authorization: token,
        },
      });
      setTopic(resp.data);
    } catch {}
  };

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
      projectListApi();
    } catch (err) {}
  };

  return (
    <View style={{flex: 1, padding: RFPercentage(2)}}>
      <HeaderComponent
        title={
          props.route.params?.title
            ? props.route.params.title
            : fontLanguage.project[0].title_list
        }
        onPressLeft={() => props.navigation.goBack()}
        onPressRight={() => console.log('data')}
        rightIcon={false}
      />
      <FlatList
        style={{flex: 1}}
        contentContainerStyle={{alignItems: 'center'}}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        data={projectList}
        renderItem={({item, index}) => {
          // if(item.cover && item.cover[0]) console.log(imageUrl +item.cover[0].image)
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.5}
              style={style.projectFound}
              onPress={() =>
                props.navigation.navigate('ProjectPage', {id: item.id})
              }>
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
                    {item.topic.map((x, index) => {
                      const matching = topic.find(topic => topic.id === x);
                      if (matching) {
                        return (
                          <Text
                            key={index}
                            style={{
                              // backgroundColor: 'white',
                              alignSelf: 'flex-start',
                              color: 'blue',
                              marginBottom: '2%',
                              lineHeight: 15,
                            }}>
                            #{matching.topic}
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
                      <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => toggleLike(item.id)}
                        style={{
                          flexDirection: 'row',
                          backgroundColor: 'transparent',
                          marginLeft: RFPercentage(2),
                        }}>
                        {item.is_liked_by_user ? (
                          <HeartFill width={16} height={16} color={'#ff0000'} />
                        ) : (
                          <Heart width={16} height={16} color={'#000000'} />
                        )}
                      </TouchableOpacity>
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
    </View>
  );
};

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
