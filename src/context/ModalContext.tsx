import React, {createContext, useContext, useState} from 'react';

const ModalContext = createContext({
  modalVisible: false,
  setModalVisible: (visible: boolean) => {},
  changeVisibility: () => {},
});

export const useModal = () => {
  return useContext(ModalContext);
};

export const ModalProvider = ({children}: any) => {
  const [modalVisible, setModalVisible] = useState(false);
  const changeVisibility = () => {
    setModalVisible(!modalVisible);
  };

  return (
    <ModalContext.Provider value={{modalVisible, setModalVisible, changeVisibility}}>
      {children}
    </ModalContext.Provider>
  );
};
