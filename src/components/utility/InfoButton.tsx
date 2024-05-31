import React from 'react'
import { TouchableOpacity, View } from 'react-native'
import { Size } from '../../theme/size';
import { globalStyles } from '../../theme/theme'
import { IconTemp } from './IconTemp'

interface Props {
    onPress: () => void;
  }

export const InfoButton = ({onPress}: Props) => {
  return (
    <View style={globalStyles.viewButtonInfo}>
        <TouchableOpacity
          activeOpacity={0.5}
          onPress={onPress}>
          <View
            style={{
              justifyContent: 'center',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <IconTemp name="information-variant" size={Size.iconSizeLarge} />
          </View>
        </TouchableOpacity>
      </View>
  )
}