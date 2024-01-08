import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { formatISO, addHours } from 'date-fns';

export const useDateTime = () => {
  const [currentISODateTime, setCurrentISODateTime] = useState('');

  useEffect(() => {
    const getCurrentDateTime = () => {
      const currentDateTime = new Date();
      
      // Puedes ajustar la zona horaria si es necesario
      const dateTimeInUTC = addHours(currentDateTime, -currentDateTime.getTimezoneOffset() / 60);
      
      // Formatea la fecha y hora actual en formato ISO 8601
      const iso8601DateTime = formatISO(dateTimeInUTC, { representation: 'complete' });

      setCurrentISODateTime(iso8601DateTime);
    };

    getCurrentDateTime();
  }, []);

  const getFormattedDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Añade ceros a la izquierda si es necesario
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const formattedDateTime = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    
    return formattedDateTime;
  }

  return {currentISODateTime, getFormattedDateTime}
};