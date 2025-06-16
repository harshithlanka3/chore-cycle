import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChoresProvider } from '../contexts/ChoresContext';

export default function RootLayout() {
  return (
    <ChoresProvider>
      <StatusBar style="auto" />
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