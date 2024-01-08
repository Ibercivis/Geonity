import React, {useState} from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Image,
  StyleSheet,
  ImageStyle,
  StyleProp,
  Dimensions,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {ImageBackground} from 'react-native';

interface Props {
  uri: string;
  text: string;
  style?: StyleProp<ImageStyle>;
  onPress: () => void;
}
const window = Dimensions.get('window');
const height = window.height > 720 ? 80 : 50;
const width = window.width > 500 ? 180 : 120;
// '../assets/backgrounds/login-background.jpg'
export const ImageButton = ({uri, style, text, onPress}: Props) => {
  const [urii, setUrii] = useState(`../assets/backgrounds/${uri}`);
  // console.log(urii);
  return (
    <TouchableOpacity style={[styles.touchable, style]} onPress={onPress}>
      <ImageBackground
        borderRadius={30}
        // source={require(urii)}
        source={require('../assets/backgrounds/login-background.jpg')}
        style={[styles.imageBackground]}>
        <Text style={styles.text}>{text}</Text>
      </ImageBackground>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  view: {
    borderRadius: 100,
  },
  imageBackground: {
    // alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: 'red',
    borderRadius: 100,
    paddingVertical: 10,
    height: window.height > 720 ? 70 : 40,
  },
  touchable: {
    marginTop: 10,
  },
  text: {
    fontSize: window.height > 720 ? 24 : 16,
    fontWeight: 'bold',
    textAlign: 'center',
    justifyContent: 'center',
    color: 'white',
  },
});
