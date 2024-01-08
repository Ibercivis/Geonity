import React from 'react';
//#region SVG
import Animales from '../../assets/icons/category/Animales.svg';
import Biodiversidad from '../../assets/icons/category/Biodiversidad.svg';
import Biologia from '../../assets/icons/category/Biología.svg';
import CienciasSociales from '../../assets/icons/category/Ciencias Sociales.svg';
import ClimaMeteorologia from '../../assets/icons/category/Clima y Metereología.svg';
import Ecologia from '../../assets/icons/category/Ecología y Medio Ambiente.svg';
import Educacion from '../../assets/icons/category/Educación.svg';
import OceanoAguaMarTierra from '../../assets/icons/category/Océano, Agua, Mar y Tierra.svg';
import SaludMedicina from '../../assets/icons/category/Salud y Medicina.svg';
//#endregion
import {Colors} from '../../theme/colors';
import {RFPercentage} from 'react-native-responsive-fontsize';

interface Props {
  id: number;
  size: number;
  color?: string;
}

export const SvgIcons = ({id, size, color = '#000'}: Props) => {
  switch (id) {
    case 1:
      return (
        <Ecologia width={size} height={size} fill={color} stroke={color} />
      );
    case 2:
      return (
        <Biodiversidad width={size} height={size} fill={color} stroke={color} />
      );
    case 3:
      return (
        <Educacion width={size} height={size} fill={color} stroke={color} />
      );
    case 4:
      return (
        <Biologia width={size} height={size} fill={color} stroke={color} />
      );
    case 5:
      return (
        <CienciasSociales
          width={size}
          height={size}
          fill={color}
          // stroke={color}
        />
      );
    case 6:
      return (
        <ClimaMeteorologia
          width={size}
          height={size}
          fill={color}
          // stroke={color}
        />
      );
    case 7:
      return (
        <Animales
          width={size}
          height={size}
          fill={color}
          // stroke={color}
        />
      );
    case 8:
      return (
        <SaludMedicina
          width={size}
          height={size}
          fill={color}
          // stroke={color}
        />
      );
    case 9:
      return <OceanoAguaMarTierra width={size} height={size} fill={color} />;

    default:
      return <Animales width={size} height={size} fill={color} />;
  }
};
