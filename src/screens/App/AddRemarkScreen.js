// src/screens/App/AddRemarkScreen.js
// Screen for MeitY Reviewers, STQC Auditors, and Scientist F to add remarks.

import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/FontAwesome';

function AddRemarkScreen({ route, navigation }) {
  const { auditRequestId } = route.params;
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { authState } = useContext(AuthContext);
  const user = authState.user;

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Remark cannot be empty.');
      return;
    }

    // Basic role check (though backend will also enforce)
    if (!['MeitY_Reviewer', 'STQC_Auditor', 'Scientist_F'].includes(user.role)) {
      Alert.alert('Permission Denied', 'You are not authorized to add remarks.');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/audit-management/requests/${auditRequestId}/remarks/add/`, {
        comment: comment,
      });
      Alert.alert('Success', 'Remark added successfully!');
      navigation.goBack(); // Go back to the detail screen
    } catch (error) {
      console.error('Error adding remark:', error.response?.data || error.message);
      let errorMessage = 'Failed to add remark. Please try again.';
      if (error.response?.data?.comment) {
        errorMessage = `Remark: ${error.response.data.comment.join(', ')}`;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (typeof error.response?.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert('Failed to Add Remark', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Icon name="comment-medical" size={60} color="#007bff" style={styles.icon} />
        <Text style={styles.title}>Add Remark to Audit Request #{auditRequestId}</Text>
        <Text style={styles.subtitle}>Share your insights or updates regarding this request.</Text>

        <View style={styles.inputGroup}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter your remark here..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={6}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="plus-circle" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Add Remark</Text>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 15,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 150,
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

export default AddRemarkScreen;
