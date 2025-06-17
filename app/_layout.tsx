import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ChoresProvider } from '../contexts/ChoresContext';
import { NavigationProvider, useNavigation } from '../contexts/NavigationContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ChoreDetailScreen from '../screens/ChoreDetailScreen';
import { colors } from '../constants/colors';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: colors.background 
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen 
        onToggleMode={() => setIsRegisterMode(!isRegisterMode)}
        isRegisterMode={isRegisterMode}
      />
    );
  }

  return (
    <ChoresProvider>
      <NavigationProvider>
        <AppNavigator />
      </NavigationProvider>
    </ChoresProvider>
  );
}

function AppNavigator() {
  const { currentScreen, currentChoreId } = useNavigation();

  switch (currentScreen) {
    case 'home':
      return <HomeScreen />;
    case 'chore-detail':
      return <ChoreDetailScreen choreId={currentChoreId!} />;
    default:
      return <HomeScreen />;
  }
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}