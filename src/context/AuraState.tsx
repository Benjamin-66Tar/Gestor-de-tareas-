import React, { createContext, useState, useContext } from 'react';
import { ElementoTipo } from '../domain/types';

interface AuraContextProps {
  tabActiva: ElementoTipo;
  setTabActiva: (tab: ElementoTipo) => void;
}

const AuraContext = createContext<AuraContextProps | undefined>(undefined);

export const AuraProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabActiva, setTabActiva] = useState<ElementoTipo>('CALENDARIO');

  return (
    <AuraContext.Provider value={{ tabActiva, setTabActiva }}>
      {children}
    </AuraContext.Provider>
  );
};

export const useAuraState = () => {
  const context = useContext(AuraContext);
  if (!context) throw new Error('useAuraState debe usarse dentro de un AuraProvider');
  return context;
};
