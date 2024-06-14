import React, {useState} from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Linking,
  Dimensions,
  Image,
} from 'react-native';
import {
  Button,
  Checkbox,
  Divider,
  List,
  Portal,
  Provider,
} from 'react-native-paper';
import Animales from '../../assets/icons/category/Animales.svg';
import CheckCircle from '../../assets/icons/general/check-circle-fill.svg';
import Xcircle from '../../assets/icons/general/x-circle.svg';
import Info from '../../assets/icons/general/info-circle.svg';
import Lock from '../../assets/icons/general/lock-fill.svg';
import Card from '../../assets/icons/general/card-fill.svg';
import World from '../../assets/icons/general/world-fill.svg';
import Incognito from '../../assets/icons/general/incognito.svg';
import {useModal} from '../../context/ModalContext';
import {FontSize, FontWeight, FontFamily} from '../../theme/fonts';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Colors} from '../../theme/colors';
import {InputText} from './InputText';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import translate from '../../theme/es.json';
import {useLanguage} from '../../hooks/useLanguage';
import PagerView from 'react-native-pager-view';
import Dots from 'react-native-dots-pagination';
import Svg, {Circle, Path} from 'react-native-svg';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {Platform} from 'react-native';

interface Props {
  label?: string;
  subLabel?: string;
  subLabel2?: string;
  multipleLabels?: string[];
  onPress?: () => void;
  onPress2?: () => void;
  visible: boolean;
  helper?: boolean;
  hideModal: () => void;
  selected?: string;
  setSelected?: (value: any) => void;
  setPass?: (value: any) => void;
  icon?: string;
  size?: number;
  color?: string;
  isChecked?: boolean;
  onPressDontShowAgain?: () => void;
}

const {fontLanguage, deviceLanguage} = useLanguage();

export const GenderSelectorModal = ({
  onPress,
  visible,
  hideModal,
  selected,
  setSelected,
}: Props) => {
  // const [selectedGender, setSelectedGender] = useState('');

  const genders = [
    'Masculino',
    'Femenino',
    'No binario',
    'Prefiero no decirlo',
  ];

  //TODO hacer que cuando se selecciona de este modal, se pase a la pantalla y  tal

  return (
    <Provider>
      <Portal>
        <Modal visible={visible} onRequestClose={hideModal} transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <List.Section>
                <List.Subheader>Selecciona tu género</List.Subheader>
                {genders.map((gender, index) => (
                  <List.Item
                    key={index}
                    title={gender}
                    onPress={() => setSelected!(gender)}
                    left={() => (
                      <List.Icon
                        icon={
                          selected === gender
                            ? 'check'
                            : 'checkbox-blank-outline'
                        }
                      />
                    )}
                  />
                ))}
              </List.Section>
              <Divider />
              <Button
                mode="outlined"
                onPress={onPress}
                style={styles.acceptButton}
                labelStyle={styles.buttonLabel}>
                Aceptar
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </Provider>
  );
};

export const VisibilityOrganizationModal = ({
  onPress,
  visible,
  hideModal,
  selected = '',
  setSelected,
  label,
}: Props) => {
  const visibility = ['Solo tú', 'Solo tú y proyectos', 'Público'];
  //TODO esto cambiarlo por un objeto que tenga clave valor

  return (
    <Provider>
      <Portal>
        <Modal visible={visible} onRequestClose={hideModal} transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View
                style={{
                  flexDirection: 'row',
                  width: '100%',
                  // height: '20%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <View style={{marginRight: '9%'}}>
                  <Incognito
                    width={RFPercentage(5)}
                    height={RFPercentage(5)}
                    fill={Colors.semanticInfoPressedLight}
                  />
                </View>

                <View style={{width: '60%'}}>
                  <Text
                    style={{
                      color: Colors.semanticInfoLight,
                      textAlign: 'left',
                      fontSize: FontSize.fontSizeText17,
                    }}>
                    {label}
                  </Text>
                </View>
              </View>
              <List.Section
                style={{
                  flexDirection: 'column',
                  width: '95%',
                  // height: 'auto',
                  marginTop: '10%',
                  marginHorizontal: '5%',
                }}>
                <List.Item
                  key={0}
                  titleStyle={{
                    fontFamily: FontFamily.NotoSansDisplayRegular,
                    fontSize: FontSize.fontSizeText14,
                    color: 'black',
                    top: '2%',
                  }}
                  style={{height: RFPercentage(6), justifyContent: 'center'}}
                  title={visibility[0]}
                  onPress={() => setSelected!(visibility[0])}
                  left={() => (
                    <Lock
                      width={RFPercentage(2.3)}
                      height={RFPercentage(5)}
                      fill={Colors.backgroundPrimaryDark}
                    />
                  )}
                  right={() =>
                    selected?.toLocaleLowerCase() ===
                    visibility[0].toLocaleLowerCase() ? (
                      <CheckCircle
                        width={RFPercentage(2)}
                        height={RFPercentage(5)}
                        fill={Colors.semanticSuccessLight}
                      />
                    ) : (
                      <></>
                    )
                  }
                />
                <List.Item
                  key={1}
                  titleStyle={{
                    fontFamily: FontFamily.NotoSansDisplayRegular,
                    fontSize: FontSize.fontSizeText14,
                    color: 'black',
                    top: '2%',
                  }}
                  style={{height: RFPercentage(6), justifyContent: 'center'}}
                  title={visibility[1]}
                  onPress={() => setSelected!(visibility[1])}
                  left={() => (
                    <>
                      <Card
                        width={RFPercentage(2.3)}
                        height={RFPercentage(5)}
                        fill={Colors.backgroundPrimaryDark}
                      />
                    </>
                  )}
                  right={() =>
                    selected?.toLocaleLowerCase() ===
                    visibility[1].toLocaleLowerCase() ? (
                      <CheckCircle
                        width={RFPercentage(2)}
                        height={RFPercentage(5)}
                        fill={Colors.semanticSuccessLight}
                      />
                    ) : (
                      <></>
                    )
                  }
                />
                <List.Item
                  key={2}
                  titleStyle={{
                    fontFamily: FontFamily.NotoSansDisplayRegular,
                    fontSize: FontSize.fontSizeText14,
                    color: 'black',
                    top: '2%',
                  }}
                  style={{height: RFPercentage(6), justifyContent: 'center'}}
                  title={visibility[2]}
                  onPress={() => setSelected!(visibility[2])}
                  left={() => (
                    <World
                      width={RFPercentage(2.3)}
                      height={RFPercentage(5)}
                      fill={Colors.backgroundPrimaryDark}
                    />
                  )}
                  right={() =>
                    selected?.toLocaleLowerCase() ===
                    visibility[2].toLocaleLowerCase() ? (
                      <CheckCircle
                        width={RFPercentage(2)}
                        height={RFPercentage(5)}
                        fill={Colors.semanticSuccessLight}
                      />
                    ) : (
                      <></>
                    )
                  }
                />
              </List.Section>
              {/* <Divider /> */}
              <TouchableOpacity
                activeOpacity={0.9}
                style={{
                  backgroundColor: 'transparent',
                  marginTop: '15%',
                  marginBottom: '4%',
                  borderWidth: 1,
                  borderRadius: 10,
                  paddingHorizontal: RFPercentage(3),
                  paddingVertical: RFPercentage(1),
                  width: '45%',
                  alignItems: 'center',
                  alignSelf: 'center',
                }}
                onPress={() => hideModal()}>
                <Text
                  style={{
                    color: 'black',
                    fontSize: FontSize.fontSizeText13,
                    justifyContent: 'center',
                    fontFamily: FontFamily.NotoSansDisplayRegular,
                  }}>
                  Aceptar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Portal>
    </Provider>
  );
};
export const VisibilityBirthday = ({
  onPress,
  visible,
  hideModal,
  selected = '',
  setSelected,
  label,
}: Props) => {
  const visibility = ['Solo tú', 'Solo tú y proyectos'];
  //TODO esto cambiarlo por un objeto que tenga clave valor

  return (
    <Provider>
      <Portal>
        <Modal visible={visible} onRequestClose={hideModal} transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View
                style={{
                  flexDirection: 'row',
                  width: '100%',
                  // height: '20%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <View style={{marginRight: '9%'}}>
                  <Incognito
                    width={RFPercentage(5)}
                    height={RFPercentage(5)}
                    fill={Colors.semanticInfoPressedLight}
                  />
                </View>

                <View style={{width: '70%'}}>
                  <Text
                    style={{
                      color: Colors.semanticInfoLight,
                      textAlign: 'left',
                      fontSize: FontSize.fontSizeText17,
                    }}>
                    {label}
                  </Text>
                </View>
              </View>
              <List.Section
                style={{
                  flexDirection: 'column',
                  width: '95%',
                  // height: 'auto',
                  marginTop: '10%',
                  marginHorizontal: '5%',
                }}>
                <List.Item
                  key={0}
                  titleStyle={{
                    fontFamily: FontFamily.NotoSansDisplayRegular,
                    fontSize: FontSize.fontSizeText14,
                    color: 'black',
                    top: '2%',
                  }}
                  style={{height: RFPercentage(6), justifyContent: 'center'}}
                  title={visibility[0]}
                  onPress={() => setSelected!(visibility[0])}
                  left={() => (
                    <Lock
                      width={RFPercentage(2.3)}
                      height={RFPercentage(5)}
                      fill={Colors.backgroundPrimaryDark}
                    />
                  )}
                  right={() =>
                    selected?.toLocaleLowerCase() ===
                    visibility[0].toLocaleLowerCase() ? (
                      <CheckCircle
                        width={RFPercentage(2)}
                        height={RFPercentage(5)}
                        fill={Colors.semanticSuccessLight}
                      />
                    ) : (
                      <></>
                    )
                  }
                />
                <List.Item
                  key={1}
                  titleStyle={{
                    fontFamily: FontFamily.NotoSansDisplayRegular,
                    fontSize: FontSize.fontSizeText14,
                    color: 'black',
                    top: '2%',
                  }}
                  style={{height: RFPercentage(6), justifyContent: 'center'}}
                  title={visibility[1]}
                  onPress={() => setSelected!(visibility[1])}
                  left={() => (
                    <>
                      <Card
                        width={RFPercentage(2.3)}
                        height={RFPercentage(5)}
                        fill={Colors.backgroundPrimaryDark}
                      />
                    </>
                  )}
                  right={() =>
                    selected?.toLocaleLowerCase() ===
                    visibility[1].toLocaleLowerCase() ? (
                      <CheckCircle
                        width={RFPercentage(2)}
                        height={RFPercentage(5)}
                        fill={Colors.semanticSuccessLight}
                      />
                    ) : (
                      <></>
                    )
                  }
                />
              </List.Section>
              {/* <Divider /> */}
              <TouchableOpacity
                activeOpacity={0.9}
                style={{
                  backgroundColor: 'transparent',
                  marginTop: '15%',
                  marginBottom: '4%',
                  borderWidth: 1,
                  borderRadius: 10,
                  paddingHorizontal: RFPercentage(3),
                  paddingVertical: RFPercentage(1),
                  width: '45%',
                  alignItems: 'center',
                  alignSelf: 'center',
                }}
                onPress={() => hideModal()}>
                <Text
                  style={{
                    color: 'black',
                    fontSize: FontSize.fontSizeText13,
                    justifyContent: 'center',
                    fontFamily: FontFamily.NotoSansDisplayRegular,
                  }}>
                  Aceptar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Portal>
    </Provider>
  );
};

export const SaveModal = ({
  onPress,
  visible,
  hideModal,
  selected,
  setSelected,
  label,
  icon,
  size,
  color,
}: Props) => {
  const visibility = ['Solo tú', 'Solo tú y proyectos', 'Público'];
  //TODO esto cambiarlo por un objeto que tenga clave valor

  return (
    <Provider>
      <Portal>
        <Modal visible={visible} onRequestClose={hideModal} transparent>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text>{label}</Text>
              <Animales width={size} height={size} fill={color} />
            </View>
          </View>
        </Modal>
      </Portal>
    </Provider>
  );
};

export const SaveProyectModal = ({
  onPress,
  visible,
  hideModal,
  label,
  subLabel,
  icon,
  size,
  color,
  helper = true,
}: Props) => {
  // const { modalVisible, setModalVisible, changeVisibility } = useModal();
  //TODO pasar esto a una screen y llamarla desde el navigator para hacer como si fuera un modal global en la app
  return (
    <Provider>
      <Portal>
        <Modal visible={visible} transparent>
          <TouchableWithoutFeedback onPress={hideModal}>
            <View style={{...styles.modalContainer}}>
              <View
                style={{
                  ...styles.modalContent,
                  alignItems: 'center',
                  height: '35%',
                  width: '65%',
                  justifyContent: 'center',
                  paddingHorizontal: '7%',
                }}>
                {helper === true ? (
                  <>
                    <Text
                      style={{
                        fontSize: FontSize.fontSizeText20,
                        color: 'black',
                        marginVertical: '4%',
                        fontWeight: '600',
                      }}>
                      {label}
                    </Text>
                    <Text
                      style={{
                        fontSize: FontSize.fontSizeText14,
                        color: 'black',
                        textAlign: 'center',
                        marginTop: '5%',
                      }}>
                      {subLabel}
                    </Text>
                    <View style={{marginTop: RFPercentage(1)}}>
                      <CheckCircle width={size} height={size} fill={color} />
                    </View>
                  </>
                ) : (
                  <>
                    <View style={{marginTop: RFPercentage(4)}}>
                      <Xcircle
                        width={RFPercentage(8)}
                        height={RFPercentage(8)}
                        fill={color}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: FontSize.fontSizeText18,
                        color: 'black',
                        marginVertical: '8%',
                        fontWeight: '600',
                        textAlign: 'center',
                        fontFamily: FontFamily.NotoSansDisplayRegular,
                        marginBottom: RFPercentage(4),
                      }}>
                      {label}
                    </Text>
                  </>
                )}

                {/* <TouchableOpacity
                  activeOpacity={0.9}
                  style={{backgroundColor: 'transparent', marginTop: 10}}
                  onPress={() => hideModal()}>
                  <Text>Cerrar</Text>
                </TouchableOpacity> */}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </Portal>
    </Provider>
  );
};

export const InfoModal = ({
  onPress,
  visible,
  hideModal,
  label,
  subLabel,
  subLabel2,
  icon,
  size,
  color,
  helper = true,
}: Props) => {
  return (
    <Provider>
      <Portal>
        <Modal visible={visible} transparent>
          <TouchableWithoutFeedback onPress={hideModal}>
            <View style={{...styles.modalContainer}}>
              <View
                style={{
                  ...styles.modalContent,
                  alignItems: 'center',
                  height: 'auto',
                  width: '75%',
                  // justifyContent: 'center',
                  // paddingHorizontal: '11%',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    width: '100%',
                    height: heightPercentageToDP(10),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <View style={{marginRight: '9%'}}>
                    <Info width={size} height={size} fill={color} />
                  </View>
                  <View style={{width: '60%'}}>
                    <Text
                      style={{
                        color: Colors.semanticInfoLight,
                        textAlign: 'left',
                        fontSize: FontSize.fontSizeText17,
                      }}>
                      {label}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: 'column',
                    width: '95%',
                    height: 'auto',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}>
                  <Text style={{marginTop: '10%'}}>
                    {subLabel}
                    {'\n\n'}
                    {subLabel2}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={{
                      backgroundColor: 'transparent',
                      marginTop: '15%',
                      borderWidth: 1,
                      borderRadius: 10,
                      paddingHorizontal: RFPercentage(3),
                      paddingVertical: RFPercentage(1),
                    }}
                    onPress={() => hideModal()}>
                    <Text
                      style={{
                        color: 'black',
                        fontSize: FontSize.fontSizeText13,
                        justifyContent: 'center',
                        fontFamily: FontFamily.NotoSansDisplayRegular,
                      }}>
                      {fontLanguage.modals[0].accept_button_text}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </Portal>
    </Provider>
  );
};

export const InfoModalMap = ({
  onPress,
  visible,
  hideModal,
  label,
  subLabel,
  subLabel2,
  icon,
  size,
  color,
  helper = true,
  isChecked = false,
  onPressDontShowAgain,
}: Props) => {
  return (
    <Provider>
      <Portal>
        <Modal visible={visible} transparent>
          <TouchableWithoutFeedback onPress={hideModal}>
            <View style={{...styles.modalContainer}}>
              <View
                style={{
                  ...styles.modalContent,
                  alignItems: 'center',
                  width: '75%',
                  // width: widthPercentageToDP(75),
                  height: 'auto',
                  // justifyContent: 'center',
                  // paddingHorizontal: '11%',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    width: '100%',
                    height: '20%',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <View style={{marginRight: '9%'}}>
                    <Info width={size} height={size} fill={color} />
                  </View>
                  <View style={{width: '60%'}}>
                    <Text
                      style={{
                        color: Colors.semanticInfoLight,
                        textAlign: 'left',
                        fontSize: FontSize.fontSizeText17,
                      }}>
                      {label}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: 'column',
                    width: '95%',
                    height: 'auto',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}>
                  <Text style={{marginTop: '5%', alignSelf: 'flex-start'}}>
                    {fontLanguage.modals[0].map.text_1}
                  </Text>
                  <Text style={{marginTop: '5%'}}>
                    1.{' '}
                    <Text style={{fontWeight: 'bold'}}>
                      {fontLanguage.modals[0].map.text_2}{' '}
                    </Text>
                    {fontLanguage.modals[0].map.text_3}
                    {'\n\n'}
                    2.{' '}
                    <Text style={{fontWeight: 'bold'}}>
                      {fontLanguage.modals[0].map.text_4}{' '}
                    </Text>
                    {fontLanguage.modals[0].map.text_5}
                  </Text>
                  <TouchableOpacity
                    onPress={onPressDontShowAgain}
                    style={{
                      width: '80%',
                      height: 'auto',
                      alignItems: 'center',
                      flexDirection: 'row',
                      marginTop: '15%',
                      // justifyContent: 'space-between',
                    }}>
                    <Checkbox
                      uncheckedColor={'#838383'}
                      color={Colors.primaryLigth}
                      status={isChecked ? 'checked' : 'unchecked'}
                      onPress={onPressDontShowAgain}
                    />
                    <Text style={{color: 'black'}}>
                      {fontLanguage.modals[0].map.text_6}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.9}
                  style={{
                    backgroundColor: 'transparent',
                    marginTop: '15%',
                    borderWidth: 1,
                    borderRadius: 10,
                    paddingHorizontal: RFPercentage(3),
                    paddingVertical: RFPercentage(1),
                  }}
                  onPress={() => hideModal()}>
                  <Text
                    style={{
                      color: 'black',
                      fontSize: FontSize.fontSizeText13,
                      justifyContent: 'center',
                      fontFamily: FontFamily.NotoSansDisplayRegular,
                    }}>
                    {fontLanguage.modals[0].accept_button_text}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </Portal>
    </Provider>
  );
};

export const InfoModalGuest = ({
  onPress,
  visible,
  hideModal,
  label,
  subLabel,
  subLabel2,
  icon,
  size,
  color,
  helper = true,
}: Props) => {
  return (
    <Provider>
      <Portal>
        <Modal visible={visible} transparent>
          <TouchableWithoutFeedback onPress={hideModal}>
            <View style={{...styles.modalContainer}}>
              <View
                style={{
                  ...styles.modalContent,
                  alignItems: 'center',
                  height: 'auto',
                  width: '75%',
                  // justifyContent: 'center',
                  // paddingHorizontal: '11%',
                }}>
                <View
                  style={{
                    // flexDirection: 'row',
                    width: '100%',
                    height: heightPercentageToDP(10),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <View style={{width: '80%'}}>
                    <Text
                      style={{
                        color: Colors.semanticInfoLight,
                        textAlign: 'center',
                        fontSize: FontSize.fontSizeText17,
                        justifyContent: 'center',
                      }}>
                      {label}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: 'column',
                    width: '95%',
                    // height: 'auto',
                    alignItems: 'center',
                    // justifyContent: 'flex-start',
                  }}>
                  <View style={{width: '80%'}}>
                    <Text
                      style={{
                        marginTop: '1%',
                        marginBottom: '15%',
                        color: 'black',
                        fontSize: FontSize.fontSizeText14,
                      }}>
                      {subLabel}
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={{
                      backgroundColor: Colors.primaryLigth,
                      marginTop: '5%',
                      // borderWidth: 1,
                      borderRadius: 12,
                      paddingHorizontal: RFPercentage(3),
                      paddingVertical: RFPercentage(1),
                    }}
                    onPress={onPress}>
                    <Text
                      style={{
                        color: 'white',
                        fontSize: FontSize.fontSizeText13,
                        justifyContent: 'center',
                        fontFamily: FontFamily.NotoSansDisplayRegular,
                      }}>
                      {fontLanguage.modals[0].log_in}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </Portal>
    </Provider>
  );
};

export const PassModal = ({
  onPress,
  visible,
  hideModal,
  label,
  setPass,
  size,
  color,
  helper = true,
}: Props) => {
  const [password, setPassword] = useState('');

  return (
    <Provider>
      <Portal>
        <Modal visible={visible} transparent>
          <TouchableWithoutFeedback onPress={hideModal}>
            <View style={{...styles.modalContainer}}>
              <View
                style={{
                  ...styles.modalContent,
                  alignItems: 'center',
                  height: RFPercentage(34),
                  width: '85%',
                  // justifyContent: 'center',
                  // paddingHorizontal: '11%',
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    width: '100%',
                    height: '20%',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <View style={{marginRight: '9%'}}>
                    <Info width={size} height={size} fill={'black'} />
                  </View>
                  <View style={{width: '60%'}}>
                    <Text
                      style={{
                        color: Colors.semanticInfoLight,
                        textAlign: 'left',
                        fontSize: FontSize.fontSizeText17,
                      }}>
                      {label}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: 'column',
                    width: '95%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    marginTop: '10%',
                  }}>
                  <View
                    style={{
                      width: '100%',
                      marginVertical: RFPercentage(1),
                    }}>
                    <Text style={{color: 'black'}}>
                      {fontLanguage.modals[0].password_text}{' '}
                    </Text>
                    <InputText
                      // isInputText={() => setIsInputText(!isInputText)}
                      isValid={helper}
                      label={fontLanguage.modals[0].password_text_label}
                      inputType={true}
                      multiline={false}
                      numOfLines={1}
                      isSecureText={true}
                      onChangeText={value => setPassword(value)}
                    />
                  </View>
                  <View
                    style={{
                      width: '100%',
                      marginVertical: RFPercentage(1),
                      flexDirection: 'row',
                      alignItems:'center',
                      justifyContent: 'space-evenly'
                    }}>
                    <TouchableOpacity
                      activeOpacity={0.5}
                      style={{
                        backgroundColor: 'white',
                        marginTop: '4%',
                        borderWidth: 1,
                        borderRadius: 10,
                        paddingHorizontal: RFPercentage(3),
                        paddingVertical: RFPercentage(1),
                      }}
                      onPress={() => {
                        setPass!(password);
                      }}>
                      <Text
                        style={{
                          color: 'black',
                          fontSize: FontSize.fontSizeText13,
                          justifyContent: 'center',
                          fontFamily: FontFamily.NotoSansDisplayRegular,
                        }}>
                        {fontLanguage.modals[0].accept_button_text}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.5}
                      style={{
                        backgroundColor: 'white',
                        marginTop: '4%',
                        borderWidth: 1,
                        borderRadius: 10,
                        paddingHorizontal: RFPercentage(3),
                        paddingVertical: RFPercentage(1),
                      }}
                      onPress={() => {
                        hideModal()
                      }}>
                      <Text
                        style={{
                          color: 'black',
                          fontSize: FontSize.fontSizeText13,
                          justifyContent: 'center',
                          fontFamily: FontFamily.NotoSansDisplayRegular,
                        }}>
                        {fontLanguage.modals[0].cancel_button_text}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </Portal>
    </Provider>
  );
};

export const DeleteModal = ({
  onPress,
  visible,
  hideModal,
  label,
  subLabel,
  icon,
  size,
  color,
  helper = true,
}: Props) => {
  // const { modalVisible, setModalVisible, changeVisibility } = useModal();
  //TODO pasar esto a una screen y llamarla desde el navigator para hacer como si fuera un modal global en la app
  return (
    <Provider>
      <Portal>
        <Modal visible={visible} transparent>
          <TouchableWithoutFeedback onPress={hideModal}>
            <View style={{...styles.modalContainer}}>
              <View
                style={{
                  ...styles.modalContent,
                  alignItems: 'center',
                  height: '35%',
                  width: '60%',
                  justifyContent: 'center',
                  paddingHorizontal: '11%',
                }}>
                <Text
                  style={{
                    fontSize: FontSize.fontSizeText18,
                    color: Colors.textColorPrimary,
                    marginBottom: '10%',
                    // fontWeight: '600',
                    textAlign: 'center',
                    fontFamily: FontFamily.NotoSansDisplaySemiBold,
                  }}>
                  {label}
                </Text>
                <Text
                  style={{
                    fontSize: FontSize.fontSizeText14,
                    color: Colors.textColorPrimary,
                    marginBottom: '12%',
                    fontWeight: '600',
                    textAlign: 'center',
                    fontFamily: FontFamily.NotoSansDisplayRegular,
                  }}>
                  {subLabel}
                </Text>

                {/* <View style={{marginTop: RFPercentage(2)}}>
                  <Xcircle
                    width={RFPercentage(8)}
                    height={RFPercentage(8)}
                    fill={color}
                  />
                </View> */}
                <View
                  style={{
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    marginTop: '5%',
                    width: '100%',
                  }}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={{...styles.button}}
                    onPress={onPress}>
                    <Text
                      style={{
                        ...styles.textButton,
                        color: Colors.semanticDangerLight,
                      }}>
                      {fontLanguage.modals[0].delete_button_text}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={{...styles.button}}
                    onPress={() => hideModal()}>
                    <Text style={styles.textButton}>
                      {fontLanguage.modals[0].cancel_button_text}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </Portal>
    </Provider>
  );
};

export const PoliciesModal = ({
  onPress,
  onPress2,
  visible,
  hideModal,
  label,
  subLabel,
  icon,
  size,
  color,
  helper = true,
}: Props) => {
  const handleLinkPress = () => {
    const url = 'https://ibercivis.es/politica-de-privacidad/'; // Reemplaza con tu URL real
    Linking.openURL(url);
  };
  return (
    <Provider>
      <Portal>
        <Modal visible={visible} transparent>
          <TouchableWithoutFeedback>
            <View style={{...styles.modalContainer}}>
              <View
                style={{
                  ...styles.modalContent,
                  // alignItems: 'center',
                  // height: '80%',
                  width: '90%',
                  justifyContent: 'center',
                  paddingHorizontal: '7%',
                }}>
                <Text
                  style={{
                    textAlign: 'left',
                    fontSize: FontSize.fontSizeText18,
                    color: Colors.textColorPrimary,
                    fontFamily: FontFamily.NotoSansDisplaySemiBold,
                  }}>
                  {fontLanguage.modals[0].policies.title}
                </Text>

                <ScrollView
                  style={{
                    marginTop: '5%',
                    marginBottom: '1%',
                    // backgroundColor: 'green',
                    // height: 'auto',
                  }}
                  showsVerticalScrollIndicator={false}>
                  <Text
                    style={{
                      fontSize: FontSize.fontSizeText15,
                      color: Colors.textColorPrimary,
                      fontFamily: FontFamily.NotoSansDisplayRegular,
                      marginBottom: '1%',
                      marginTop: '2%',
                      // fontWeight: '600',
                      textAlign: 'left',
                    }}>
                    {fontLanguage.modals[0].policies.text_1}
                  </Text>
                  <Text
                    style={{
                      fontSize: FontSize.fontSizeText15,
                      color: Colors.textColorPrimary,
                      fontFamily: FontFamily.NotoSansDisplayRegular,
                      marginBottom: '1%',
                      marginTop: '1%',
                      // fontWeight: '600',
                      textAlign: 'left',
                    }}>
                    {fontLanguage.modals[0].policies.text_2}
                  </Text>
                  <Text
                    style={{
                      fontSize: FontSize.fontSizeText15,
                      color: Colors.textColorPrimary,
                      fontFamily: FontFamily.NotoSansDisplayRegular,
                      marginBottom: '1%',
                      marginTop: '1%',
                      // fontWeight: '600',
                      textAlign: 'left',
                    }}>
                    {fontLanguage.modals[0].policies.text_3}
                  </Text>
                  <View>
                    <Text
                      style={{
                        fontSize: FontSize.fontSizeText15,
                        color: Colors.textColorPrimary,
                        fontFamily: FontFamily.NotoSansDisplayRegular,
                        marginBottom: '1%',
                        marginTop: '1%',
                        // fontWeight: '600',
                        textAlign: 'left',
                      }}>
                      {fontLanguage.modals[0].policies.text_4}
                      <Text
                        onPress={handleLinkPress}
                        style={{
                          textDecorationLine: 'underline',
                          color: Colors.semanticInfoLight,
                        }}>
                        {'https://ibercivis.es/politica-de-privacidad/'}
                      </Text>
                      .
                    </Text>
                    {/* <TouchableOpacity onPress={handleLinkPress}>
                      <Text
                        style={{
                          fontSize: FontSize.fontSizeText15,
                          color: Colors.semanticInfoLight,
                          fontFamily: FontFamily.NotoSansDisplayRegular,
                          marginBottom: '1%',
                          marginTop: '1%',
                          // fontWeight: '600',
                          textAlign: 'left',
                          textDecorationLine: 'underline',
                        }}>
                        {'https://ibercivis.es/politica-de-privacidad/'}
                      </Text>
                    </TouchableOpacity> */}
                  </View>
                </ScrollView>

                <View
                  style={{
                    // width: RFPercentage(42),
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: '7%',
                    // backgroundColor: 'red',
                    // justifyContent: 'space-between',
                  }}>
                  {/* <Checkbox
                    uncheckedColor={'#838383'}
                    color={Colors.primaryLigth}
                    status={helper ? 'checked' : 'unchecked'}
                    onPress={onPress2}
                  /> */}
                  <Text
                    style={{
                      color: Colors.semanticInfoLight,
                      fontSize: FontSize.fontSizeText14,
                      fontFamily: FontFamily.NotoSansDisplayLight,
                    }}>
                    {fontLanguage.modals[0].policies.accept_text}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginTop: '10%',
                    // width: '100%',
                  }}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={{
                      ...styles.button,
                      minWidth: widthPercentageToDP(10),
                      width: widthPercentageToDP(25),
                      marginHorizontal: '4%',
                    }}
                    onPress={() => hideModal()}>
                    <Text style={styles.textButton}>
                      {fontLanguage.modals[0].cancel_button_text}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={{
                      ...styles.button,
                      minWidth: widthPercentageToDP(10),
                      width: widthPercentageToDP(25),
                      marginHorizontal: '4%',
                      backgroundColor: Colors.primaryLigth,
                    }}
                    onPress={onPress}>
                    <Text
                      style={{
                        ...styles.textButton,
                        color: 'white',
                      }}>
                      {fontLanguage.modals[0].accept_button_text}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </Portal>
    </Provider>
  );
};

const {width, height} = Dimensions.get('window');

export const GuideModal = ({
  onPress,
  onPress2,
  visible,
  hideModal,
  multipleLabels,
  icon,
  size,
  color,
  helper = true,
}: Props) => {
  //sacar cada pantalla a un switch para que funcionen los dots
  //el skip estará el mismo en todos
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const onPageSelected = (event: any) => {
    setCurrentIndex(event.nativeEvent.position);
  };
  return (
    <Provider>
      <Portal>
        <Modal visible={visible} transparent>
          <SafeAreaView style={stylesGuide.modalContainer}>
            <PagerView
              style={stylesGuide.pagerView}
              initialPage={0}
              onPageSelected={onPageSelected}>
              <View key="1" style={stylesGuide.slide}>
                <View style={stylesGuide.background}>
                  <Svg height={height} width={width + 10}>
                    <Path
                      d={`M0 ${height / 54} Q${width / 7} ${height / 15}, ${
                        width / 2.2
                      } ${height / 8} T${width} ${
                        height / 5.2
                      } L${width} 0 L0 0 Z`}
                      fill={Colors.semanticInfoLight}
                    />
                  </Svg>
                </View>
                <Image
                  source={require('../../assets/guide/ONBOARDING_GENERAL_01.png')}
                  style={{
                    width: '100%',
                    height: '40%',
                  }}
                  resizeMode="contain"
                />
                <Text style={stylesGuide.slideTextTitle}>
                  {fontLanguage.modals[0].guide_home.title}
                </Text>
                <Text style={stylesGuide.slideText}>
                  {fontLanguage.modals[0].guide_home.subtitle}
                </Text>
              </View>
              <View key="2" style={stylesGuide.slide}>
                <View style={stylesGuide.background}>
                  <Svg height={height} width={width + 10}>
                    <Path
                      d={`M0 ${height / 5.2} Q${width / 4} ${height / 4.9}, ${
                        width / 2
                      } ${height / 4.9} T${width} ${
                        height / 5.2
                      } L${width} 0 L0 0 Z`}
                      fill={Colors.semanticInfoLight}
                    />
                  </Svg>
                </View>
                <Image
                  source={deviceLanguage === 'es_ES' ? require('../../assets/guide/ONBOARDING_GENERAL_02.png') : require('../../assets/guide/Onboarding_General_01_en.png')}
                  style={{
                    width: '80%',
                    height: '55%',
                    // backgroundColor: 'red',
                    // bottom: '10%',
                    left: '4%',
                  }}
                  resizeMode="contain"
                />
                <Text style={stylesGuide.slideTextTitle}>
                  {fontLanguage.modals[0].guide_home.title2}
                </Text>
                <Text style={stylesGuide.slideText}>
                  {fontLanguage.modals[0].guide_home.subtitle2}
                </Text>
              </View>
              <View key="3" style={stylesGuide.slide}>
                <View style={stylesGuide.background}>
                  <Svg height={height} width={width + 10}>
                    <Path
                      d={`M0 ${height / 5.2} Q${width / 4} ${height / 5.5}, ${
                        width / 2
                      } ${height / 7} T${width} ${
                        height / 22
                      } L${width} 0 L0 0 Z`}
                      fill={Colors.semanticInfoLight}
                    />
                  </Svg>
                </View>
                <Image
                  source={deviceLanguage === 'es_ES' ? require('../../assets/guide/ONBOARDING_GENERAL_03.png') : require('../../assets/guide/Onboarding_General_02_en.png')}
                  style={{
                    width: '80%',
                    height: '55%',
                    left: '2%',
                  }}
                  resizeMode="contain"
                />
                <Text style={stylesGuide.slideTextTitle}>
                  {fontLanguage.modals[0].guide_home.title3}
                </Text>
                <Text style={stylesGuide.slideText}>
                  {fontLanguage.modals[0].guide_home.subtitle3}
                </Text>
              </View>
              <View key="4" style={stylesGuide.slide}>
                <View style={stylesGuide.background}>
                  <Svg height={height} width={width + 10}>
                    <Path
                      d={`M0 ${height / 22} Q${width / 7.5} ${height / 70}, ${
                        width / 2.5
                      } ${height / 400} T${width} ${
                        height / 45
                      } L${width} 0 L0 0 Z`}
                      fill={Colors.semanticInfoLight}
                    />
                  </Svg>
                </View>
                <Image
                  source={deviceLanguage === 'es_ES' ? require('../../assets/guide/ONBOARDING_GENERAL_04.png') : require('../../assets/guide/Onboarding_General_03_en.png')}
                  style={{
                    width: '80%',
                    height: '65%',
                    left: '2%',
                  }}
                  resizeMode="contain"
                />
                <Text style={stylesGuide.slideTextTitle}>
                  {fontLanguage.modals[0].guide_home.title4}
                </Text>
                <Text style={stylesGuide.slideText}>
                  {fontLanguage.modals[0].guide_home.subtitle4}
                </Text>
              </View>
            </PagerView>
            <View
              style={{position: 'absolute', bottom: '5%', alignSelf: 'center'}}>
              <Dots
                length={4}
                active={currentIndex}
                activeColor="blue"
                passiveColor="grey"
                alignDotsOnXAxis={true}
                marginHorizontal={RFPercentage(0.9)}
              />
            </View>

            <TouchableOpacity
              onPress={hideModal}
              style={{
                ...stylesGuide.closeButton,
                top:
                  Platform.OS === 'ios'
                    ? insets.top + heightPercentageToDP(2)
                    : heightPercentageToDP(3),
              }}>
              <Text style={stylesGuide.closeButtonText}>Skip</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Modal>
      </Portal>
    </Provider>
  );
};

export const ProyectGuideModal = ({
  onPress,
  onPress2,
  visible,
  hideModal,
  multipleLabels,
  icon,
  size,
  color,
  helper = true,
}: Props) => {
  //sacar cada pantalla a un switch para que funcionen los dots
  //el skip estará el mismo en todos
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const onPageSelected = (event: any) => {
    setCurrentIndex(event.nativeEvent.position);
  };
  return (
    <Provider>
      <Portal>
        <Modal visible={visible} transparent>
          <View style={stylesGuide.modalContainer}>
            <PagerView
              style={stylesGuide.pagerView}
              initialPage={0}
              onPageSelected={onPageSelected}>
              <View key="1" style={stylesGuide.slide}>
                <View style={stylesGuide.background}>
                  <Svg height={height} width={width + 10}>
                    <Path
                      d={`M0 ${height / 54} Q${width / 7} ${height / 15}, ${
                        width / 2.2
                      } ${height / 8} T${width} ${
                        height / 5.2
                      } L${width} 0 L0 0 Z`}
                      fill={Colors.semanticInfoLight}
                    />
                  </Svg>
                </View>
                <Image
                  source={deviceLanguage === 'es_ES' ? require('../../assets/guide/Onboarding_Proyecto_01.png'):require('../../assets/guide/Onboarding_Proyecto_01_en.png')}
                  style={{
                    width: '100%',
                    height: '50%',
                  }}
                  resizeMode="contain"
                />
                <Text style={stylesGuide.slideTextTitle}>
                  {fontLanguage.modals[0].guide_proyect.title}
                </Text>
                <Text
                  style={{
                    width: '90%',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}>
                  <Text style={{color: Colors.primaryDark, fontWeight: 'bold'}}>
                    01{' '}
                    <Text style={stylesGuide.slideText}>
                      {fontLanguage.modals[0].guide_proyect.subtitle_01}
                    </Text>
                  </Text>
                  <Text style={{color: Colors.primaryDark, fontWeight: 'bold'}}>
                    02{' '}
                    <Text style={stylesGuide.slideText}>
                      {fontLanguage.modals[0].guide_proyect.subtitle_02}
                    </Text>
                  </Text>
                  <Text style={{color: Colors.primaryDark, fontWeight: 'bold'}}>
                    03
                    <Text style={stylesGuide.slideText}>
                      {fontLanguage.modals[0].guide_proyect.subtitle_03}
                    </Text>
                  </Text>
                </Text>
              </View>
              <View key="2" style={stylesGuide.slide}>
                <View style={stylesGuide.background}>
                  <Svg height={height} width={width + 10}>
                    <Path
                      d={`M0 ${height / 5.2} Q${width / 4} ${height / 4.9}, ${
                        width / 2
                      } ${height / 4.9} T${width} ${
                        height / 5.2
                      } L${width} 0 L0 0 Z`}
                      fill={Colors.semanticInfoLight}
                    />
                  </Svg>
                </View>
                <Image
                  source={deviceLanguage === 'es_ES' ? require('../../assets/guide/Onboarding_Proyecto_02.png') : require('../../assets/guide/Onboarding_Proyecto_02_en.png')}
                  style={{
                    width: '80%',
                    height: '55%',
                    left: '4%',
                  }}
                  resizeMode="contain"
                />
                <Text style={stylesGuide.slideTextTitle}>
                  {fontLanguage.modals[0].guide_proyect.title2}
                </Text>

                <Text
                  style={{
                    width: '90%',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}>
                  <Text style={{color: Colors.primaryDark, fontWeight: 'bold'}}>
                    01
                    <Text style={stylesGuide.slideText}>
                      {fontLanguage.modals[0].guide_proyect.subtitle2_01}
                    </Text>
                  </Text>
                  <Text style={{color: Colors.primaryDark, fontWeight: 'bold'}}>
                    02
                    <Text style={stylesGuide.slideText}>
                      {fontLanguage.modals[0].guide_proyect.subtitle2_02}
                    </Text>
                  </Text>
                </Text>
              </View>
              <View key="3" style={stylesGuide.slide}>
                <View style={stylesGuide.background}>
                  <Svg height={height} width={width + 10}>
                    <Path
                      d={`M0 ${height / 5.2} Q${width / 4} ${height / 5.5}, ${
                        width / 2
                      } ${height / 7} T${width} ${
                        height / 22
                      } L${width} 0 L0 0 Z`}
                      fill={Colors.semanticInfoLight}
                    />
                  </Svg>
                </View>
                <Image
                  source={deviceLanguage === 'es_ES' ? require('../../assets/guide/Onboarding_Proyecto_03.png') : require('../../assets/guide/Onboarding_Proyecto_03_en.png')}
                  style={{
                    width: '80%',
                    height: '50%',
                    // left: '2%',
                  }}
                  resizeMode="contain"
                />
                <Text style={stylesGuide.slideTextTitle}>
                  {fontLanguage.modals[0].guide_proyect.title3}
                </Text>
                <Text style={stylesGuide.slideText}>
                  {fontLanguage.modals[0].guide_proyect.subtitle3}
                </Text>
              </View>
              <View key="4" style={stylesGuide.slide}>
                <View style={stylesGuide.background}>
                  <Svg height={height} width={width + 10}>
                    <Path
                      d={`M0 ${height / 22} Q${width / 7.5} ${height / 70}, ${
                        width / 2.5
                      } ${height / 400} T${width} ${
                        height / 45
                      } L${width} 0 L0 0 Z`}
                      fill={Colors.semanticInfoLight}
                    />
                  </Svg>
                </View>
                <Image
                  source={deviceLanguage === 'es_ES' ? require('../../assets/guide/Onboarding_Proyecto_04.png') : require('../../assets/guide/Onboarding_Proyecto_04_en.png')}
                  style={{
                    width: '80%',
                    height: '65%',
                    left: '2%',
                  }}
                  resizeMode="contain"
                />
                <Text style={stylesGuide.slideTextTitle}>
                  {fontLanguage.modals[0].guide_proyect.title4}
                </Text>
                <Text
                  style={{
                    width: '90%',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}>
                  <Text style={{color: Colors.primaryDark, fontWeight: 'bold'}}>
                    01
                    <Text style={stylesGuide.slideText}>
                      {fontLanguage.modals[0].guide_proyect.subtitle4_01}
                    </Text>
                  </Text>

                  <Text style={{color: Colors.primaryDark, fontWeight: 'bold'}}>
                    02
                    <Text style={stylesGuide.slideText}>
                      {fontLanguage.modals[0].guide_proyect.subtitle4_02}
                    </Text>
                  </Text>

                  <Text style={{color: Colors.primaryDark, fontWeight: 'bold'}}>
                    03
                    <Text style={stylesGuide.slideText}>
                      {fontLanguage.modals[0].guide_proyect.subtitle4_03}
                    </Text>
                  </Text>
                </Text>
              </View>
            </PagerView>
            <View
              style={{position: 'absolute', bottom: '5%', alignSelf: 'center'}}>
              <Dots
                length={4}
                active={currentIndex}
                activeColor="blue"
                passiveColor="grey"
                alignDotsOnXAxis={true}
                marginHorizontal={RFPercentage(0.9)}
              />
            </View>

            <TouchableOpacity
              onPress={hideModal}
              style={{
                ...stylesGuide.closeButton,
                top:
                  Platform.OS === 'ios'
                    ? insets.top + heightPercentageToDP(2)
                    : heightPercentageToDP(3),
              }}>
              <Text style={stylesGuide.closeButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>
    </Provider>
  );
};

export const OrganizationGuideModal = ({
  onPress,
  onPress2,
  visible,
  hideModal,
  multipleLabels,
  icon,
  size,
  color,
  helper = true,
}: Props) => {
  //sacar cada pantalla a un switch para que funcionen los dots
  //el skip estará el mismo en todos
  const [currentIndex, setCurrentIndex] = useState(0);
  const insets = useSafeAreaInsets();
  const onPageSelected = (event: any) => {
    setCurrentIndex(event.nativeEvent.position);
  };
  return (
    <Provider>
      <Portal>
        <Modal visible={visible} transparent>
          <View style={stylesGuide.modalContainer}>
            <PagerView
              style={stylesGuide.pagerView}
              initialPage={0}
              onPageSelected={onPageSelected}>
              <View key="1" style={stylesGuide.slide}>
                <View style={stylesGuide.background}>
                  <Svg height={height} width={width + 10}>
                    <Path
                      d={`M0 ${height / 54} Q${width / 7} ${height / 15}, ${
                        width / 2.2
                      } ${height / 8} T${width} ${
                        height / 5.2
                      } L${width} 0 L0 0 Z`}
                      fill={Colors.semanticInfoLight}
                    />
                  </Svg>
                </View>
                <Image
                  source={deviceLanguage === 'es_ES' ? require('../../assets/guide/Onboarding_Organización_01.png') : require('../../assets/guide/Onboarding_Organización_01_en.png')}
                  style={{
                    width: '100%',
                    height: '50%',
                  }}
                  resizeMode="contain"
                />
                <Text style={stylesGuide.slideTextTitle}>
                  {fontLanguage.modals[0].guide_proyect.title}
                </Text>
                <Text
                  style={{
                    width: '90%',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}>
                  <Text style={stylesGuide.slideText}>
                    {fontLanguage.modals[0].guide_organization.subtitle}
                  </Text>
                  <Text style={{color: Colors.primaryDark, fontWeight: 'bold'}}>
                    01
                  </Text>
                  <Text style={stylesGuide.slideText}>
                    {fontLanguage.modals[0].guide_organization.subtitle_01}
                  </Text>
                  <Text style={{color: Colors.primaryDark, fontWeight: 'bold'}}>
                    02
                  </Text>
                  <Text style={stylesGuide.slideText}>
                    {fontLanguage.modals[0].guide_organization.subtitle_02}
                  </Text>
                </Text>
              </View>
              <View key="2" style={stylesGuide.slide}>
                <View style={stylesGuide.background}>
                  <Svg height={height} width={width + 10}>
                    <Path
                      d={`M0 ${height / 5.2} Q${width / 4} ${height / 4.9}, ${
                        width / 2
                      } ${height / 4.9} T${width} ${
                        height / 5.2
                      } L${width} 0 L0 0 Z`}
                      fill={Colors.semanticInfoLight}
                    />
                  </Svg>
                </View>
                <Image
                  source={deviceLanguage === 'es_ES' ? require('../../assets/guide/Onboarding_Organización_02.png') : require('../../assets/guide/Onboarding_Organización_02_en.png')}
                  style={{
                    width: '80%',
                    height: '55%',
                    // backgroundColor: 'red',
                    // bottom: '10%',
                    // left: '4%',
                  }}
                  resizeMode="contain"
                />
                <Text style={stylesGuide.slideTextTitle}>
                  {fontLanguage.modals[0].guide_organization.title2}
                </Text>
                <Text style={stylesGuide.slideText}>
                  {fontLanguage.modals[0].guide_organization.subtitle2}
                </Text>
              </View>
              <View key="3" style={stylesGuide.slide}>
                <View style={stylesGuide.background}>
                  <Svg height={height} width={width + 10}>
                    <Path
                      d={`M0 ${height / 5.2} Q${width / 4} ${height / 5.5}, ${
                        width / 2
                      } ${height / 7} T${width} ${
                        height / 22
                      } L${width} 0 L0 0 Z`}
                      fill={Colors.semanticInfoLight}
                    />
                  </Svg>
                </View>
                <Image
                  source={deviceLanguage === 'es_ES' ? require('../../assets/guide/Onboarding_Organización_03.png') : require('../../assets/guide/Onboarding_Organización_03_en.png')}
                  style={{
                    width: '80%',
                    height: '55%',
                    left: '2%',
                  }}
                  resizeMode="contain"
                />
                <Text style={stylesGuide.slideTextTitle}>
                  {fontLanguage.modals[0].guide_organization.title3}
                </Text>
                <Text style={stylesGuide.slideText}>
                  {fontLanguage.modals[0].guide_organization.subtitle3}
                </Text>
              </View>
            </PagerView>
            <View
              style={{position: 'absolute', bottom: '5%', alignSelf: 'center'}}>
              <Dots
                length={3}
                active={currentIndex}
                activeColor="blue"
                passiveColor="grey"
                alignDotsOnXAxis={true}
                marginHorizontal={RFPercentage(0.9)}
              />
            </View>

            <TouchableOpacity
              onPress={hideModal}
              style={{
                ...stylesGuide.closeButton,
                top:
                  Platform.OS === 'ios'
                    ? insets.top + heightPercentageToDP(2)
                    : heightPercentageToDP(3),
              }}>
              <Text style={stylesGuide.closeButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  openButton: {
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '70%',
  },
  acceptButton: {
    marginTop: '18%',
    borderRadius: 10,
    width: '50%',
    alignSelf: 'center',
  },
  buttonLabel: {
    fontWeight: 'bold',
  },
  button: {
    minWidth: RFPercentage(8),
    marginBottom: RFPercentage(2),
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
    elevation: 2,
  },
  textButton: {
    textAlign: 'center',
    textAlignVertical: 'center',
    alignSelf: 'center',
  },
});

const stylesGuide = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  modalContainer: {
    flex: 1,
    // width: '100%',
    // height: '100%',
    backgroundColor: 'white',
    justifyContent: 'center',
    // alignItems: 'center',
  },
  pagerView: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '95%',
    // padding:'5%'
  },
  slideText: {
    fontSize: FontSize.fontSizeText14,
    textAlign: 'center',
    padding: '5%',
    color: 'black',
    fontWeight: 'normal',
    // backgroundColor: 'green',
  },
  slideTextTitle: {
    fontSize: FontSize.fontSizeText20,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: '5%',
    color: 'black',
    // backgroundColor: 'yellow',
  },
  closeButton: {
    paddingHorizontal: widthPercentageToDP(1.5),
    paddingVertical: widthPercentageToDP(0.5),
    backgroundColor: 'white',
    borderRadius: 5,
    position: 'absolute',
    // bottom: 20,
    top: heightPercentageToDP(3),
    right: widthPercentageToDP(5),
  },
  closeButtonText: {
    color: 'black',
    fontSize: FontSize.fontSizeText15,
  },
});
