import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './src/screens/LoginScreen';
import POSScreen from './src/screens/POSScreen';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <>
      <StatusBar style="auto" />
      {isLoggedIn ? (
        <POSScreen onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <LoginScreen onLogin={() => setIsLoggedIn(true)} />
      )}
    </>
  );
}
