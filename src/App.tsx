import React, { useState } from 'react';
import { StartupScreen } from './components/StartupScreen';
import { MainView } from './components/MainView';
import { AppMode } from './types/effects';

export const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('STARTUP');
  const [useSimulation, setUseSimulation] = useState<boolean>(false);

  if (appMode === 'STARTUP') {
    return (
      <StartupScreen
        onStartLive={(sim) => {
          setUseSimulation(sim);
          setAppMode('LIVE');
        }}
        onStartDemo={(sim) => {
          setUseSimulation(sim);
          setAppMode('DEMO');
        }}
      />
    );
  }

  return (
    <MainView
      initialMode={appMode}
      initialUseSimulation={useSimulation}
    />
  );
};

export default App;
