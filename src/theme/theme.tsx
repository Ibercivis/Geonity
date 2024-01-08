import {Dimensions, StyleSheet} from 'react-native';
import {Colors} from './colors';
import {FontSize} from './fonts';
import {Size} from './size';

const window = Dimensions.get('window');

export const globalStyles = StyleSheet.create({
  globalMargin: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  globalText: {
    color: 'black',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 100,
    backgroundColor: 'red',
  },
  drawerItems: {
    marginVertical: 30,
    marginHorizontal: 30,
    alignContent: 'flex-start',
    justifyContent: 'center',
  },
  menuButton: {
    marginVertical: Size.window.height * 0.01,
    // marginTop: 10,
  },
  menuText: {
    fontSize: FontSize.fontSizeText,
    color: Colors.primary,
    marginLeft: 10,
    textAlignVertical: 'center',
  },
  icons: {
    justifyContent: 'center',
    alignItems: 'center',
    // top: 1,
    backgroundColor: 'transparent',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    height: 600,
    marginBottom: 50,
  },
  title: {
    color: '#5C95FF',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 10,
  },
  label: {
    color: '#5C95FF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  inputField: {
    color: '#5C95FF',
    fontSize: 20,
  },
  inputFieldIOS: {
    borderBottomColor: '#5C95FF',
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  button: {
    borderWidth: 2,
    borderColor: '#5C95FF',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 100,
  },
  buttonText: {
    fontSize: 18,
    color: '#5C95FF',
  },
  newUserContainer: {
    alignItems: 'flex-end',
    marginTop: 20,
  },
  viewButtonBack: {
    left: '1%',
    top: window.height * 0.05,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    elevation: 7,
  },
  viewButtonInfo: {
    right: '1%',
    top: window.height * 0.05,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.29,
    shadowRadius: 4.65,
    elevation: 7,
  },
  viewModal: {
    borderRadius: 40,
    backgroundColor: 'white',
    width: '100%',
    height: Size.window.height * 0.7,
    top: '4%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignContent: 'center',
    borderColor: '#c9c4c4',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: '2.5%',
    // overflow: 'hidden',
    // shadowColor: 'rgba(0,0,0,0.25)',
    // shadowOffset: {
    //   width: 1,
    //   height: 1,
    // },
    // shadowOpacity: 10,
    // shadowRadius: 10,
    // elevation: 0,
  },
});
