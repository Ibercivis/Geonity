import React from 'react'
import { Colors } from '../../theme/colors';
import { View } from 'react-native';

interface Props {
    name: string;
    size: number;
    color?: string;
  }

export const GeometryForms = ({name, size, color = Colors.primaryDark}: Props) => {
    switch(name){
        case 'circle':
            return(
                <View style={{
                    width: size,
                    height: size,
                    borderRadius: 100 / 2,
                    backgroundColor: color,
                  }} />
            );
        case 'circle-fill':
            return(
                <View style={{
                    width: size,
                    height: size,
                    borderRadius: 100 / 2,
                    backgroundColor: color,
                  }} />
            );

    
        default:
            return(<View style={{
                width: size,
                height: size,
                borderRadius: 100 / 2,
                backgroundColor: color,
              }} />)
    }
}
