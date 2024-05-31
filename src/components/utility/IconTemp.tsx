import React from 'react'
import { StyleProps } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

interface Props{
  name: string;
  size: number;
  color?: string;
  style?: StyleProps;
}

export const IconTemp = ({name, size, color = 'black', style}: Props) => {
  return (
    <Icon style={style} name={name} size={size} color={color} />
  )
}
