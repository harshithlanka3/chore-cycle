import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ChoresProvider } from '../contexts/ChoresContext';
import AuthScreen from '../screens/AuthScreen';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../constants/colors';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <ChoresProvider>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Chore Cycle',
            headerTitleAlign: 'center',
          }} 
        />
      </Stack>
    </ChoresProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppContent />
    </AuthProvider>
  );
}