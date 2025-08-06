// src/screens/App/CreateAuditRequestScreen.js
// A screen for CSPs to create a new audit request.
// Now includes specific fields for multiple document uploads with user-defined names and dynamic additions.

import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import Icon from 'react-native-vector-icons/FontAwesome';

// Define the document types
const DOC_TYPES = {
  PREQUALIFICATION: 'Prequalification',
  TECHNICAL: 'Technical',
  COMPLIANCES: 'Compliances',
  STANDARD: 'Standard'
};

// Define the initial number of required documents for each type
const REQUIRED_DOCUMENTS = {
  [DOC_TYPES.PREQUALIFICATION]: 7,
  [DOC_TYPES.TECHNICAL]: 7,
  [DOC_TYPES.COMPLIANCES]: 9,
  [DOC_TYPES.STANDARD]: 8,
};

function CreateAuditRequestScreen({ navigation }) {
  const { authState } = useContext(AuthContext);
  const user = authState.user;

  const [serviceProviderName, setServiceProviderName] = useState(user?.service_provider_name || '');
  const [dataCenterLocation, setDataCenterLocation] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for documents, now an array of objects with a name and file
  const [documents, setDocuments] = useState({
    [DOC_TYPES.PREQUALIFICATION]: Array(REQUIRED_DOCUMENTS[DOC_TYPES.PREQUALIFICATION]).fill({ file: null, name: '' }),
    [DOC_TYPES.TECHNICAL]: Array(REQUIRED_DOCUMENTS[DOC_TYPES.TECHNICAL]).fill({ file: null, name: '' }),
    [DOC_TYPES.COMPLIANCES]: Array(REQUIRED_DOCUMENTS[DOC_TYPES.COMPLIANCES]).fill({ file: null, name: '' }),
    [DOC_TYPES.STANDARD]: Array(REQUIRED_DOCUMENTS[DOC_TYPES.STANDARD]).fill({ file: null, name: '' }),
  });

  // Function to handle document name change
  const handleDocumentNameChange = (docType, index, text) => {
    setDocuments(prevDocs => {
      const newDocs = { ...prevDocs };
      const updatedArray = [...newDocs[docType]];
      updatedArray[index] = { ...updatedArray[index], name: text };
      newDocs[docType] = updatedArray;
      return newDocs;
    });
  };

  // Function to handle document picking for a specific type and index
  const pickDocument = async (docType, index) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setDocuments(prevDocs => {
          const newDocs = { ...prevDocs };
          const updatedArray = [...newDocs[docType]];
          updatedArray[index] = { ...updatedArray[index], file };
          newDocs[docType] = updatedArray;
          return newDocs;
        });
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick the document. Please try again.');
    }
  };

  // Function to add a new, blank document field
  const addDocumentField = (docType) => {
    setDocuments(prevDocs => {
      const newDocs = { ...prevDocs };
      newDocs[docType] = [...newDocs[docType], { file: null, name: '' }];
      return newDocs;
    });
  };

  // Function to remove a document field
  const removeDocumentField = (docType, index) => {
    setDocuments(prevDocs => {
      const newDocs = { ...prevDocs };
      const updatedArray = newDocs[docType].filter((_, i) => i !== index);
      newDocs[docType] = updatedArray;
      return newDocs;
    });
  };

  const handleSubmit = async () => {
    // Basic form validation
    if (!dataCenterLocation || !serviceProviderName) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    // Validate that all documents have a name and a file
    let allDocumentsValid = true;
    for (const docType in documents) {
      if (documents[docType].some(doc => !doc.file || !doc.name.trim())) {
        allDocumentsValid = false;
        break;
      }
    }

    if (!allDocumentsValid) {
      Alert.alert('Validation Error', 'Please ensure all documents have a name and an uploaded file.');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      // 1. Create the initial audit request
      const requestData = {
        service_provider_name: serviceProviderName,
        data_center_location: dataCenterLocation,
        remarks: remarks,
        status: 'Submitted_by_CSP',
      };

      const requestResponse = await api.post('/audit-management/requests/', requestData);
      const auditRequestId = requestResponse.data.id;
      console.log('Audit request created with ID:', auditRequestId);

      // 2. Upload all documents
      const uploadPromises = [];
      for (const docType in documents) {
        documents[docType].forEach((doc, index) => {
          if (doc.file) {
            const formData = new FormData();
            formData.append('audit_request', auditRequestId);
            // Use the user-defined name
            formData.append('document_type', doc.name.trim());
            formData.append('file', {
              uri: doc.file.uri,
              name: doc.file.name,
              type: 'application/pdf',
            });
            uploadPromises.push(api.post('/audit-management/documents/', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            }));
          }
        });
      }

      await Promise.all(uploadPromises);
      console.log('All documents uploaded successfully.');

      Alert.alert('Success', 'Audit request and documents submitted successfully!');
      navigation.navigate('AuditRequestList');
    } catch (error) {
      console.error('Submission Error:', error.response?.status, error.response?.data || error.message);
      Alert.alert('Error', 'Failed to submit the audit request. Please try again.');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const renderDocumentPicker = (docType) => {
    return (
      <View style={styles.documentSection}>
        <Text style={styles.documentSectionTitle}>{docType} Documents ({documents[docType].length} uploaded)</Text>
        {documents[docType].map((doc, index) => (
          <View key={`${docType}-${index}`} style={styles.documentItem}>
            <TextInput
              style={styles.documentNameInput}
              value={doc.name}
              onChangeText={(text) => handleDocumentNameChange(docType, index, text)}
              placeholder={`Enter name for ${docType} document ${index + 1}`}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[styles.documentButton, doc.file && styles.documentButtonFilled]}
              onPress={() => pickDocument(docType, index)}
            >
              <Icon name={doc.file ? "check-circle" : "upload"} size={20} color={doc.file ? "#fff" : "#007bff"} />
              <Text style={[styles.documentButtonText, doc.file && styles.documentButtonTextFilled]}>
                {doc.file ? doc.file.name : 'Upload PDF'}
              </Text>
            </TouchableOpacity>
            {documents[docType].length > REQUIRED_DOCUMENTS[docType] && (
              <TouchableOpacity
                style={styles.removeDocumentButton}
                onPress={() => removeDocumentField(docType, index)}
              >
                <Icon name="minus" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity
          style={styles.addDocumentButton}
          onPress={() => addDocumentField(docType)}
        >
          <Icon name="plus" size={16} color="#fff" />
          <Text style={styles.addDocumentButtonText}>Add More Documents</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>New Audit Request</Text>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Service Provider Name</Text>
        <TextInput
          style={styles.input}
          value={serviceProviderName}
          onChangeText={setServiceProviderName}
          editable={true}
          placeholder="Service Provider Name (auto-filled)"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Data Center Location</Text>
        <TextInput
          style={styles.input}
          value={dataCenterLocation}
          onChangeText={setDataCenterLocation}
          placeholder="Enter Data Center Location"
        />
      </View>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Remarks</Text>
        <TextInput
          style={[styles.input, { height: 100 }]}
          value={remarks}
          onChangeText={setRemarks}
          placeholder="Enter any additional remarks"
          multiline
        />
      </View>

      {renderDocumentPicker(DOC_TYPES.PREQUALIFICATION)}
      {renderDocumentPicker(DOC_TYPES.TECHNICAL)}
      {renderDocumentPicker(DOC_TYPES.COMPLIANCES)}
      {renderDocumentPicker(DOC_TYPES.STANDARD)}

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Request</Text>
        )}
      </TouchableOpacity>
      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f6',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  documentSection: {
    backgroundColor: '#e6f7ff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  documentSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#b3e0ff',
    paddingBottom: 8,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  documentNameInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    fontSize: 10,
    marginRight: 10,
    height: 40,
  },
  documentButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentButtonFilled: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  documentButtonText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#007bff',
  },
  documentButtonTextFilled: {
    color: '#fff',
  },
  removeDocumentButton: {
    backgroundColor: '#dc3545',
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  addDocumentButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    borderRadius: 25,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addDocumentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#007bff',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateAuditRequestScreen;
