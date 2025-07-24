// src/screens/App/DocumentUploadScreen.js
// Screen for CSPs and STQC Auditors to upload documents.

import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/FontAwesome';

function DocumentUploadScreen({ route, navigation }) {
  const { auditRequestId } = route.params;
  const [documentType, setDocumentType] = useState('CSP_Submission'); // Default type
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { authState } = useContext(AuthContext);
  const user = authState.user;

  const documentTypeOptions = [
    { label: 'CSP Submission', value: 'CSP_Submission' },
    { label: 'Audit Report', value: 'Audit_Report' },
    { label: 'Other', value: 'Other' },
  ];

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types
        copyToCacheDirectory: true, // Important for Android to get a readable URI
      });

      if (result.type === 'success') {
        setSelectedFile(result);
      } else {
        setSelectedFile(null);
      }
    } catch (err) {
      console.error('Document picker error:', err);
      Alert.alert('Error', 'Failed to pick document.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file to upload.');
      return;
    }
    if (!documentType) {
      Alert.alert('Error', 'Please select a document type.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('document_type', documentType);
      formData.append('description', description);

      // Append the file
      // For Android, result.uri might be 'content://...' which needs to be read
      // For iOS, result.uri is usually a file path
      const fileUri = selectedFile.uri;
      const fileName = selectedFile.name;
      const fileType = selectedFile.mimeType || 'application/octet-stream'; // Fallback MIME type

      // Read the file content into a base64 string or directly use URI if supported by backend
      // For Django REST Framework, it often expects a Blob or File object.
      // React Native's FormData usually handles file URIs correctly.
      formData.append('file', {
        uri: fileUri,
        name: fileName,
        type: fileType,
      });

      // Send the request
      const response = await api.post(`/audit-management/requests/${auditRequestId}/documents/upload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
        },
      });

      Alert.alert('Success', 'Document uploaded successfully!');
      navigation.goBack(); // Go back to the detail screen
    } catch (error) {
      console.error('Error uploading document:', error.response?.data || error.message);
      let errorMessage = 'Failed to upload document. Please try again.';
      if (error.response?.data) {
        const errors = error.response.data;
        if (errors.file) {
          errorMessage = `File: ${errors.file.join(', ')}`;
        } else if (errors.document_type) {
          errorMessage = `Document Type: ${errors.document_type.join(', ')}`;
        } else if (errors.detail) {
          errorMessage = errors.detail;
        } else {
          errorMessage = JSON.stringify(errors);
        }
      }
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Conditional rendering for document type selection based on user role
  const filteredDocumentTypeOptions = documentTypeOptions.filter(option => {
    if (user.role === 'CSP') {
      return option.value === 'CSP_Submission' || option.value === 'Other';
    } else if (user.role === 'STQC_Auditor') {
      return option.value === 'Audit_Report' || option.value === 'Other';
    }
    return false; // Should not happen if roles are correctly managed
  });

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Icon name="upload" size={60} color="#007bff" style={styles.icon} />
        <Text style={styles.title}>Upload Document for Audit Request #{auditRequestId}</Text>
        <Text style={styles.subtitle}>Attach relevant files to this audit request.</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Document Type:</Text>
          <View style={styles.typeButtonsContainer}>
            {filteredDocumentTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.typeButton,
                  documentType === option.value && styles.typeButtonSelected,
                ]}
                onPress={() => setDocumentType(option.value)}
              >
                <Text style={[
                  styles.typeButtonText,
                  documentType === option.value && styles.typeButtonTextSelected,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>File:</Text>
          <TouchableOpacity style={styles.filePickerButton} onPress={pickDocument}>
            <Icon name="folder-open" size={20} color="#fff" />
            <Text style={styles.filePickerButtonText}>
              {selectedFile ? selectedFile.name : 'Choose Document'}
            </Text>
          </TouchableOpacity>
          {selectedFile && (
            <Text style={styles.fileName}>Selected: {selectedFile.name}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional):</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Brief description of the document"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="file-upload" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Upload Document</Text>
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
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007bff',
    margin: 5,
  },
  typeButtonSelected: {
    backgroundColor: '#007bff',
  },
  typeButtonText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
  filePickerButton: {
    flexDirection: 'row',
    backgroundColor: '#17a2b8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#17a2b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  filePickerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  fileName: {
    marginTop: 10,
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
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
    height: 100,
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

export default DocumentUploadScreen;
