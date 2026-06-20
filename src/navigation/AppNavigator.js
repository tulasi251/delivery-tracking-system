import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useStore } from '../store/useStore';
import { LoginScreen } from '../screens/LoginScreen';
import { DriverDashboard } from '../screens/DriverDashboard';
import { ManagerDashboard } from '../screens/ManagerDashboard';
import { TrackingScreen } from '../screens/TrackingScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { user, isLoading, restoreSession } = useStore();

  // Try to restore user session from AsyncStorage on bootup
  useEffect(() => {
    restoreSession();
  }, []);

  // Display a modern loader while session check is running
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user === null ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : user.role === 'driver' ? (
        <>
          <Stack.Screen name="DriverHome" component={DriverDashboard} />
          <Stack.Screen name="Tracking" component={TrackingScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="ManagerHome" component={ManagerDashboard} />
          <Stack.Screen name="Tracking" component={TrackingScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1B4B', // Matches Login color palette
  },
});
