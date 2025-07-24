// src/screens/App/UpdateStatusScreen.js
// Screen for MeitY Reviewers, STQC Auditors, and Scientist F to update audit request status.

import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // For dropdown
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/FontAwesome';

function UpdateStatusScreen({ route, navigation }) {
  const { auditRequestId, currentStatus } = route.params;
  const { authState } = useContext(AuthContext);
  const user = authState.user;

  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [statusOptions, setStatusOptions] = useState([]);

  // Define all possible status choices with their display names
  const allStatusChoices = {
    'Submitted_by_CSP': 'Submitted by CSP',
    'Forwarded_to_STQC': 'Forwarded to STQC for Audit',
    'Audit_Completed_by_STQC': 'Audit Completed by STQC',
    'Approved_by_ScientistF': 'Approved by Scientist F',
    'Rejected_by_ScientistF': 'Rejected by Scientist F',
  };

  useEffect(() => {
    // Determine available status options based on user role and current status
    let available = [];
    if (user.role === 'MeitY_Reviewer' && currentStatus === 'Submitted_by_CSP') {
      available = [{ label: 'Forward to STQC for Audit', value: 'Forwarded_to_STQC' }];
    } else if (user.role === 'STQC_Auditor' && currentStatus === 'Forwarded_to_STQC') {
      available = [{ label: 'Audit Completed by STQC', value: 'Audit_Completed_by_STQC' }];
    } else if (user.role === 'Scientist_F' && currentStatus === 'Audit_Completed_by_STQC') {
      available = [
        { label: 'Approve Audit', value: 'Approved_by_ScientistF' },
        { label: 'Reject Audit', value: 'Rejected_by_ScientistF' },
      ];
    }
    setStatusOptions(available);
    // Set default selected status if there's only one option, or keep current
    if (available.length > 0 && available[0].value !== currentStatus) {
        setSelectedStatus(available[0].value);
    } else {
        setSelectedStatus(currentStatus);
    }
  }, [user.role, currentStatus]);

  const handleSubmit = async () => {
    if (!selectedStatus || selectedStatus === currentStatus) {
      Alert.alert('Error', 'Please select a new status to update.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.patch(`/audit-management/requests/${auditRequestId}/status-update/`, {
        status: selectedStatus,
      });
      Alert.alert('Success', 'Audit request status updated successfully!');
      navigation.goBack(); // Go back to the detail screen, which will refresh
    } catch (error) {
      console.error('Error updating status:', error.response?.data || error.message);
      let errorMessage = 'Failed to update status. Please try again.';
      if (error.response?.data?.status) {
        errorMessage = `Status: ${error.response.data.status.join(', ')}`;
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (typeof error.response?.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.message) {
        errorMessage = error.message;
      }
      Alert.alert('Status Update Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Updating status...</Text>
      </View>
    );
  }

  // If no valid status options are available for the current user/status
  if (statusOptions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.workflowMessage, styles.workflowWarn]}>
          <Icon name="exclamation-triangle" size={20} color="#9d6500" />
          <Text style={styles.workflowMessageText}>
            No status update action is currently available for your role on this request at its current status: {allStatusChoices[currentStatus] || currentStatus}.
          </Text>
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Icon name="sync-alt" size={60} color="#007bff" style={styles.icon} />
        <Text style={styles.title}>Update Status for Audit Request #{auditRequestId}</Text>
        <Text style={styles.subtitle}>Current Status: <Text style={styles.currentStatusText}>{allStatusChoices[currentStatus] || currentStatus}</Text></Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select New Status:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedStatus}
              onValueChange={(itemValue) => setSelectedStatus(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {statusOptions.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="arrow-circle-right" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Update Status</Text>
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
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  currentStatusText: {
    fontWeight: 'bold',
    color: '#007bff',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
  pickerContainer: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden', // Ensures the border radius applies to the picker itself
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  pickerItem: {
    fontSize: 16,
    color: '#333',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7f6',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  workflowMessage: {
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#fff',
  },
  workflowWarn: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffe0b2',
    color: '#9d6500',
  },
  workflowMessageText: {
    flex: 1,
    color: '#9d6500',
    fontSize: 14,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UpdateStatusScreen;
