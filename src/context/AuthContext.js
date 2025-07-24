// src/context/AuthContext.js
// Manages user authentication state (tokens, user info) across the app.

import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwt_decode from 'jwt-decode';
import axios from 'axios'; // For API calls
import { API_BASE_URL } from '../services/api'; // Import API_BASE_URL

// Create Auth Context
export const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: null,
    isAuthenticated: false,
    user: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Attempt to load token and user data from AsyncStorage on app start
    const loadAuthData = async () => {
      console.log('AuthContext: Starting loadAuthData...');
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
          console.log('AuthContext: Found userToken in AsyncStorage.');
          const decodedToken = jwt_decode(token);
          // Check if token is expired
          if (decodedToken.exp * 1000 < Date.now()) {
            console.log('AuthContext: Stored token EXPIRED, clearing storage.');
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('refreshToken'); // Clear refresh token too
            setAuthState({ token: null, isAuthenticated: false, user: null });
          } else {
            console.log('AuthContext: Stored token is VALID. Fetching user details...');
            // Token is valid, fetch user details using the token
            const userResponse = await axios.get(`${API_BASE_URL}users/me/`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setAuthState({
              token,
              isAuthenticated: true,
              user: userResponse.data,
            });
            console.log('AuthContext: User authenticated:', userResponse.data.username, 'Role:', userResponse.data.role);
          }
        } else {
          console.log('AuthContext: No userToken found in AsyncStorage. User not authenticated.');
        }
      } catch (error) {
        console.error('AuthContext: Error in loadAuthData:', error.response?.status, error.response?.data || error.message);
        setAuthState({ token: null, isAuthenticated: false, user: null });
      } finally {
        setIsLoading(false);
        console.log('AuthContext: Finished loadAuthData. IsLoading set to false.');
      }
    };

    loadAuthData();
  }, []);

  // Function to handle user login
  const login = async (username, password) => {
    console.log('AuthContext: Attempting login for user:', username);
    try {
      const response = await axios.post(`${API_BASE_URL}token/`, {
        username,
        password,
      });
      const { access, refresh } = response.data; // Assuming your API returns access and refresh tokens
      console.log('AuthContext: Login API call successful. Received tokens.');

      await AsyncStorage.setItem('userToken', access);
      await AsyncStorage.setItem('refreshToken', refresh); // Store refresh token
      console.log('AuthContext: Tokens stored in AsyncStorage.');

      // Fetch user details immediately after successful token acquisition
      const userResponse = await axios.get(`${API_BASE_URL}users/me/`, {
        headers: { Authorization: `Bearer ${access}` }, // Use the newly obtained access token
      });

      setAuthState({
        token: access,
        isAuthenticated: true,
        user: userResponse.data,
      });
      console.log('AuthContext: User state updated after login:', userResponse.data.username, 'Role:', userResponse.data.role);
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Login FAILED:', error.response?.status, error.response?.data || error.message);
      return { success: false, error: error.response?.data?.detail || 'Login failed. Please check your credentials.' };
    }
  };

  // Function to handle user registration
  const register = async (userData) => {
    console.log('AuthContext: Attempting registration for user:', userData.username);
    try {
      const response = await axios.post(`${API_BASE_URL}users/register/`, userData);
      console.log('AuthContext: Registration API call successful.');
      // After successful registration, automatically log in the user
      const loginResult = await login(userData.username, userData.password);
      return loginResult; // Return the result of the login attempt
    } catch (error) {
      console.error('AuthContext: Registration FAILED:', error.response?.status, error.response?.data || error.message);
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response?.data) {
        if (error.response.data.username) {
          errorMessage = `Username: ${error.response.data.username.join(', ')}`;
        } else if (error.response.data.email) {
          errorMessage = `Email: ${error.response.data.email.join(', ')}`;
        } else if (error.response.data.password) {
          errorMessage = `Password: ${error.response.data.password.join(', ')}`;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else {
          errorMessage = JSON.stringify(error.response.data);
        }
      }
      return { success: false, error: errorMessage };
    }
  };

  // Function to handle user logout
  const logout = async () => {
    console.log('AuthContext: Attempting logout...');
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('refreshToken');
      setAuthState({ token: null, isAuthenticated: false, user: null });
      console.log('AuthContext: User logged out and tokens cleared.');
    } catch (error) {
      console.error('AuthContext: Logout FAILED:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ authState, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
