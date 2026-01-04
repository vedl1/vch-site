import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TabNavigator } from './src/navigation/TabNavigator';
import { DateProvider } from './src/context/DateContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DateProvider>
          <NavigationContainer>
            <TabNavigator />
          </NavigationContainer>
        </DateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
