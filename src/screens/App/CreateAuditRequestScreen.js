// src/screens/App/CreateAuditRequestScreen.js
// Screen for CSPs to create a new audit request.

import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/FontAwesome';

function CreateAuditRequestScreen({ navigation }) {
  const [serviceProviderName, setServiceProviderName] = useState('');
  const [dataCenterLocation, setDataCenterLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { authState } = useContext(AuthContext);

  const handleSubmit = async () => {
    if (!serviceProviderName || !dataCenterLocation) {
      Alert.alert('Error', 'Please fill in Service Provider Name and Data Center Location.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/audit-management/requests/', {
        service_provider_name: serviceProviderName,
        data_center_location: dataCenterLocation,
        description: description,
        // status will be set by the backend to 'Submitted_by_CSP'
        // csp will be set by the backend based on authenticated user
      });
      Alert.alert('Success', 'Audit request submitted successfully!');
      navigation.goBack(); // Go back to the list or dashboard
    } catch (error) {
      console.error('Error creating audit request:', error.response?.data || error.message);
      let errorMessage = 'Failed to submit audit request. Please try again.';
      if (error.response?.data) {
        // Attempt to parse specific error messages from Django DRF
        const errors = error.response.data;
        if (errors.service_provider_name) {
          errorMessage = `Service Provider Name: ${errors.service_provider_name.join(', ')}`;
        } else if (errors.data_center_location) {
          errorMessage = `Data Center Location: ${errors.data_center_location.join(', ')}`;
        } else if (errors.detail) {
          errorMessage = errors.detail;
        } else {
          errorMessage = JSON.stringify(errors);
        }
      }
      Alert.alert('Submission Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Icon name="file-invoice" size={60} color="#007bff" style={styles.icon} />
        <Text style={styles.title}>Submit New Audit Request</Text>
        <Text style={styles.subtitle}>Please fill out the details for your cloud service audit.</Text>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Cloud Service Provider Name"
            value={serviceProviderName}
            onChangeText={setServiceProviderName}
          />
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="Data Center Location (e.g., Mumbai)"
            value={dataCenterLocation}
            onChangeText={setDataCenterLocation}
          />
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description of Services/Scope of Audit (Optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="paper-plane" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Submit Request</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7f6',
    paddingVertical: 20,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 15,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingVertical: 10,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  buttonIcon: {
    marginRight: 10,
  },
});

export default CreateAuditRequestScreen;
