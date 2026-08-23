import React from 'react';
import { MainView } from './components/MainView';

export const App: React.FC = () => {
  return <MainView initialMode="LIVE" initialUseSimulation={false} />;
};

export default App;
