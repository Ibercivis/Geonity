import { Alert } from 'react-native';

export const CustomAlert = () => {
    const showAlert = (title: string, body:string, cancelText: string, okText: string, onPress: () => void) => {
        Alert.alert(
          title,
          body,
          [
            {
              text: cancelText,
              onPress: () => console.log('Cancel Pressed'),
              style: 'cancel',
            },
            {text: okText, onPress: onPress},
          ],
          {
            cancelable: true
          },
          
        );
      };

      const showAlertOneButton = (title: string, body:string, okText: string, onPress: () => void, onDismiss?: () => void) => {
        Alert.alert(
          title,
          body,
          [
            {text: okText, onPress: onPress},
          ],
          {
            cancelable: true,
            onDismiss: onDismiss
          },
        );
      };

      return {
        showAlert,
        showAlertOneButton
      }
}
