import {Dimensions, StyleSheet} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';

const window = Dimensions.get('window');

export const FontSize = {
  fontSize: window.width > 500 ? 50 : 30,
  fontSizeTextExtraMin: RFPercentage(1.3),
  fontSizeTextMin: RFPercentage(1.5),
  fontSizeText: RFPercentage(2),
  fontSizeTextSubTitle: RFPercentage(2.7),
  fontSizeTextTitle: RFPercentage(3.5),
  
  // TODOS LOS FONT SIZE TENDRO DE LA APP TIENEN QUE SER APLICADOS CON /fontScale usando const {fontScale} = useWindowDimensions();
  // Esto se usa para que escale el tamaño de letras con las diferentes pantallas
  // fontSizeText10: 10,
  fontSizeText10: RFPercentage(1.3),
  fontSizeText13: 13,
  // fontSizeText13: RFPercentage(1.7),
  // fontSizeText14: 14,
  fontSizeText14: RFPercentage(1.8),
  fontSizeText15: RFPercentage(2),
  fontSizeText17: RFPercentage(2.3),
  fontSizeText18: 18,
  fontSizeText20: 20,
  // fontSizeText20: RFPercentage(2.7),
};

export const FontFamily = {
  NotoSansDisplayLight: 'NotoSansDisplay-Light',
  NotoSansDisplayRegular: 'NotoSansDisplay-Regular',
  NotoSansDisplayMedium: 'NotoSansDisplay-Medium',
  NotoSansDisplaySemiBold: 'NotoSansDisplay-SemiBold',
}

export const FontWeight = {
  ligth: '300',
  regular: '400',
  medium: '500',
  semiBold: '600'
};

export const fonts = StyleSheet.create({
  title: {
    // fontSize: RFPercentage(10),
    alignSelf: 'center',
    fontSize: FontSize.fontSizeTextTitle,
    fontWeight: 'bold',
    color: '#2F3061',
    marginTop: '6%',
    marginBottom: '10%',
  },
  boddy: {
    fontSize: RFPercentage(5),
  },

  typographyHeadlines: {
    // fontFamily: 'Roboto',
    fontSize: 96,
  },
  typographyHeadlines2: {
    // fontFamily: 'Roboto',
    fontSize: 60,
  },
  typographyHeadlines3: {
    // fontFamily: 'Roboto',
    fontSize: 48,
  },
  typographyHeadlines4: {
    // fontFamily: 'Roboto',
    fontSize: 34,
  },
  typographyHeadlines5: {
    // fontFamily: 'Roboto',
    fontSize: 24,
  },
  typographyHeadlines6: {
    // fontFamily: 'Roboto',
    fontSize: 20,
  },
  typographyBody1: {
    // fontFamily: 'Roboto',
    fontSize: 16,
  },
  typographyBody2: {
    // fontFamily: 'Roboto',
    fontSize: 14,
  },
  typographySubtitle1: {
    // fontFamily: 'Roboto',
    fontSize: 16,
  },
  typographySubtitle2: {
    // fontFamily: 'Roboto',
    fontSize: 14,
  },
  typographyButton: {
    // fontFamily: 'Roboto',
    fontSize: 14,
  },
  typographyOverline: {
    // fontFamily: 'Roboto',
    fontSize: 10,
  },
  typographyCaption: {
    // fontFamily: 'Roboto',
    fontSize: 12,
  },
});
