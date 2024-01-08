import { useState } from "react";

export const useTogglePasswordVisibility = () => {
    const [passwordVisibility, setPasswordVisibility] = useState(true);
    const [rightIcon, setRightIcon] = useState('eye');
  
    const handlePasswordVisibility = () => {
      if (rightIcon === 'eye') {
        setRightIcon('eye-slash');
        setPasswordVisibility(!passwordVisibility);
      } else if (rightIcon === 'eye-slash') {
        setRightIcon('eye');
        setPasswordVisibility(!passwordVisibility);
      }
    };
  
    return {
      passwordVisibility,
      rightIcon,
      handlePasswordVisibility
    };
  };