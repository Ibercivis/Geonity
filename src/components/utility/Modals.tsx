import React, {useState} from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import {Button, Divider, List, Portal, Provider} from 'react-native-paper';
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

interface Props {
  label?: string;
  subLabel?: string;
  subLabel2?: string;
  onPress?: () => void;
  visible: boolean;
  helper?: boolean;
  hideModal: () => void;
  selected?: string;
  setSelected?: (value: any) => void;
  setPass?: (value: any) => void;
  icon?: string;
  size?: number;
  color?: string;
}

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
                  width: '60%',
                  justifyContent: 'center',
                  paddingHorizontal: '11%',
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
                    <View style={{marginTop: RFPercentage(4)}}>
                      <CheckCircle width={size} height={size} fill={color} />
                    </View>
                  </>
                ) : (
                  <>
                    <Text
                      style={{
                        fontSize: FontSize.fontSizeText18,
                        color: 'black',
                        marginVertical: '4%',
                        fontWeight: '600',
                        textAlign: 'center',
                        fontFamily: FontFamily.NotoSansDisplayRegular,
                      }}>
                      {label}
                    </Text>

                    <View style={{marginTop: RFPercentage(4)}}>
                      <Xcircle
                        width={RFPercentage(8)}
                        height={RFPercentage(8)}
                        fill={color}
                      />
                    </View>
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
                  height: '46%',
                  width: '75%',
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
                      Aceptar
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
                  height: '50%',
                  width: '75%',
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
                    Tienes dos opciones:
                  </Text>
                  <Text style={{marginTop: '5%'}}>
                    1.{' '}
                    <Text style={{fontWeight: 'bold'}}>
                      Mantener presionada{' '}
                    </Text>
                    la pantalla en el punto exacto del mapa donde se quiera
                    colocar el marcador
                    {'\n\n'}
                    2.{' '}
                    <Text style={{fontWeight: 'bold'}}>
                      Presiona el botón "+"{' '}
                    </Text>
                    se añadirá automáticamente un marcador vinculado a tu
                    posición actual. (El botón está situado en la parte inferior
                    derecha del mapa).
                  </Text>
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
                    Aceptar
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
                    <Text style={{color: 'black'}}>Password </Text>
                    <InputText
                      // isInputText={() => setIsInputText(!isInputText)}
                      isValid={helper}
                      label={'Escriba la contraseña'}
                      inputType={true}
                      multiline={false}
                      numOfLines={1}
                      isSecureText={true}
                      onChangeText={value => setPassword(value)}
                    />
                  </View>
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
                      Aceptar
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
                    width:'100%'
                  }}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={{...styles.button,}}
                    onPress={onPress}>
                    <Text style={{...styles.textButton, color: Colors.semanticDangerLight}}>Borrar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={{...styles.button,}}
                    onPress={() => hideModal()}>
                    <Text style={styles.textButton}>Cancelar</Text>
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
    borderRadius:10,
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
  textButton:{
    textAlign:'center',
    textAlignVertical:'center',
    alignSelf: 'center'
  }
});
