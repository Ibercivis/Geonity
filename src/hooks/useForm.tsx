import {useState} from 'react';

//hoock usado para establecer los datos de los formularios

export const useForm = <T extends Object>(initialState: T) => {
  const [state, setState] = useState(initialState);

  // Función para manejar eventos de cambio en los campos del formulario
  const onChange = <K extends Object>(value: K, field: keyof T) => {
    // Actualizar el estado del formulario con el nuevo valor para el campo especificado
    setState({
      ...state,
      [field]: value,
    });
  };
  // Función para restablecer el estado del formulario al initialState
  const clear = () => {
    setState(initialState);
  };
  // Función para establecer el estado del formulario con un nuevo objeto
  const setObject = (newState: T) => {
    setState(newState);
  };

  return {
    ...state,
    form: state,
    setState,
    setObject,
    onChange,
    clear,
  };
};

/*
  Ejemplo de uso

   const {onChange, form} = useForm({
    name: '',
    email: '',
    phone: '',
    isSubscribed: false,
  });
  
*/
