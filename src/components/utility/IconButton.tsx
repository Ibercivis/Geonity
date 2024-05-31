import React from 'react';
import {IconButton} from 'react-native-paper';
import {StyleProps} from 'react-native-reanimated';

interface Props {
  name: string;
  size: number;
  color?: string;
  style?: StyleProps;
  onPress: () => void;
}

export const IconButtonTemp = ({
  name,
  size,
  color = 'black',
  style,
  onPress,
}: Props) => {
  return (
    <IconButton animated style={style} icon={name} iconColor={color} size={size} onPress={onPress} mode={'contained'}/>
  );
};
