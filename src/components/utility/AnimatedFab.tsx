import React from 'react';
import {
  StyleSheet,
  Platform,
  SafeAreaView,
} from 'react-native';
import {AnimatedFAB} from 'react-native-paper';
import {StyleProps} from 'react-native-reanimated';
import { Size } from '../../theme/size';

interface Props {
  animatedValue?: string;
  visible?: boolean;
  extended?: boolean;
  label: string;
  animateFrom?: any;
  style?: StyleProps;
  iconMode?: string;
  onPress?: () => void;
}

export const AnimatedFab = ({
  animatedValue,
  visible,
  extended,
  label,
  animateFrom,
  style,
  iconMode,
  onPress
}: Props) => {
  const [isExtended, setIsExtended] = React.useState(true);

  const isIOS = Platform.OS === 'ios';

  const onScroll = (nativeEvent: any) => {
    const currentScrollPosition =
      Math.floor(nativeEvent?.contentOffset?.y) ?? 0;

    setIsExtended(currentScrollPosition <= 0);
  };

  const fabStyle = {[animateFrom]: 16};

  return (
    <SafeAreaView style={styles.container}>
      {/* <ScrollView onScroll={onScroll}>
        {[...new Array(100).keys()].map((_, i) => (
          <Text>{i}</Text>
        ))}
      </ScrollView> */}
      <AnimatedFAB
        icon={'plus'}
        label={label}
        extended={!isExtended}
        onPress={onPress}
        visible={visible}
        animateFrom={'right'}
        iconMode={'dynamic'}
        style={[styles.fabStyle, style, fabStyle]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    // flexGrow: 1,
  },
  fabStyle: {
    bottom: Size.window.width * 0.05,
    right: Size.window.width * 0.05,
    position: 'absolute',
  },
});
