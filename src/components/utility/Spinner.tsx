import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import { Colors } from '../../theme/colors';
import { RFPercentage } from 'react-native-responsive-fontsize';

interface Props{
  visible: boolean
}

export const Spinner = ({ visible } : Props) => {
  return (
    <Modal isVisible={visible} backdropOpacity={0.5}>
      <View style={styles.modalContainer}>
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size={RFPercentage(8)} color={Colors.contentSecondaryLigth} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerContainer: {
    backgroundColor: 'transparent',
    padding: 20,
    borderRadius: 10,
  },
});