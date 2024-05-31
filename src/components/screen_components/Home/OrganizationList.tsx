import React, {useEffect, useState} from 'react';
import {FlatList, ScrollView, View} from 'react-native';

import {Card} from '../../utility/Card';

import citmapApi from '../../../api/citmapApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Organization} from '../../../interfaces/interfaces';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {HeaderComponent} from '../../HeaderComponent';
import {StackParams} from '../../../navigation/HomeNavigator';
import {StackScreenProps} from '@react-navigation/stack';
import { useLanguage } from '../../../hooks/useLanguage';

interface Props extends StackScreenProps<StackParams, 'OrganizationList'> {}

export const OrganizationList = (props: Props) => {
  const [organization, setOrganization] = useState<Organization[]>([]); // partir la lista en 2
  const {fontLanguage} = useLanguage(); // determina el idioma de los dialogos

  
  useEffect(() => {
    organizationListApi();
  }, []);

  /**
   * obtiene las organizaciones
   */
  const organizationListApi = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const resp = await citmapApi.get<Organization[]>('/organization/', {
        headers: {
          Authorization: token,
        },
      });
      setOrganization(resp.data);
    } catch {}
  };

  return (
    <View style={{flex: 1, padding: RFPercentage(2)}}>
      <HeaderComponent
        title={fontLanguage.organization[0].title_list}
        onPressLeft={() => props.navigation.goBack()}
        onPressRight={() => console.log('jaja')}
        rightIcon={false}
      />
      <FlatList
        style={{flex: 1}}
        contentContainerStyle={{alignItems: 'center'}}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        data={organization}
        renderItem={({item, index}) => {
          return (
            <Card
              key={index}
              type="organizationFound"
              categoryImage={index}
              cover={item.logo ? item.logo : ''}
              title={item.principalName}
              description={item.description}
              onPress={() =>
                props.navigation.navigate('OrganizationPage', {id: item.id})
              }
            />
          );
        }}
      />
    </View>
  );
};
