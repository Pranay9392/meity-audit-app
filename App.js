// App.js
// Main entry point for the React Native MeitY Audit App.
// Sets up navigation and provides authentication context.

import React, { useState, useEffect, useContext, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwt_decode from 'jwt-decode'; // To decode JWT tokens
import { AuthProvider, AuthContext } from './src/context/AuthContext'; // AuthContext
import { API_BASE_URL } from './src/services/api'; // Import API_BASE_URL for display

// Import Auth Screens
import LoginScreen from './src/screens/Auth/LoginScreen';
import RegisterScreen from './src/screens/Auth/RegisterScreen';

// Import App Screens
import DashboardScreen from './src/screens/App/DashboardScreen';
import AuditRequestListScreen from './src/screens/App/AuditRequestListScreen';
import AuditRequestDetailScreen from './src/screens/App/AuditRequestDetailScreen';
import CreateAuditRequestScreen from './src/screens/App/CreateAuditRequestScreen';
import AddRemarkScreen from './src/screens/App/AddRemarkScreen';
import DocumentUploadScreen from './src/screens/App/DocumentUploadScreen';
import UpdateStatusScreen from './src/screens/App/UpdateStatusScreen';

// Create Stack Navigators
const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

// Auth Stack Navigator
function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// App Stack Navigator
function AppStackNavigator() {
  return (
    <AppStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#007bff' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <AppStack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Miety Cloud Empanelmet' }} />
      <AppStack.Screen name="AuditRequestList" component={AuditRequestListScreen} options={{ title: 'Cloud Empanelment Requests' }} />
      <AppStack.Screen name="AuditRequestDetail" component={AuditRequestDetailScreen} options={{ title: 'Request Details' }} />
      <AppStack.Screen name="CreateAuditRequest" component={CreateAuditRequestScreen} options={{ title: 'New Empanelment Request' }} />
      <AppStack.Screen name="AddRemark" component={AddRemarkScreen} options={{ title: 'Add Remark' }} />
      <AppStack.Screen name="DocumentUpload" component={DocumentUploadScreen} options={{ title: 'Upload Document' }} />
      <AppStack.Screen name="UpdateStatus" component={UpdateStatusScreen} options={{ title: 'Update Status' }} />
    </AppStack.Navigator>
  );
}

// Root App Component
export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

// Root Navigator component that decides which stack to show based on authentication status
function RootNavigator() {
  const { authState, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading application...</Text>
        <Text style={styles.apiInfoText}>Connecting to: {API_BASE_URL}</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {authState.isAuthenticated ? <AppStackNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7f6',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: '#333',
  },
  apiInfoText: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
});
