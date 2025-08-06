// src/screens/App/AuditRequestDetailScreen.js
// Displays details of an audit request and allows actions based on user role.

import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Corrected import for Picker
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as DocumentPicker from 'expo-document-picker';


// For file picking, you will need to install and use a library like react-native-document-picker.
// For example:
// import DocumentPicker from 'react-native-document-picker';
//
// In this code, a placeholder function is used. You should replace it with your actual implementation.

function AuditRequestDetailScreen({ route, navigation }) {
  const { auditRequestId } = route.params;
  const { authState } = useContext(AuthContext);
  const user = authState.user;

  const [auditRequest, setAuditRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for Scientist F's status update form
  const [newStatus, setNewStatus] = useState('');
  const [certificateFile, setCertificateFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAuditRequestDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/audit-management/requests/${auditRequestId}/`);
      setAuditRequest(response.data);
      // You can add a console log here to inspect the status
      console.log('Fetched Audit Request Status:', response.data.status);
    } catch (err) {
      console.error('Error fetching audit request details:', err.response?.data || err.message);
      setError('Failed to load audit request details.');
      Alert.alert('Error', 'Failed to load audit request details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAuditRequestDetails();
      return () => {
        // Cleanup if needed
      };
    }, [auditRequestId])
  );

  const handleDeleteDocument = async (documentId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await api.delete(`/audit-management/documents/${documentId}/delete/`);
              Alert.alert('Success', 'Document deleted successfully.');
              fetchAuditRequestDetails(); // Refresh details after deletion
            } catch (err) {
              console.error('Error deleting document:', err.response?.data || err.message);
              Alert.alert('Error', 'Failed to delete document. You might not have permission or it no longer exists.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Placeholder for file picker function
 


  const handleCertificatePick = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true
    });

    if (result.type === 'success') {
      setCertificateFile(result);
      console.log('Selected file:', result);
    } else {
      console.log('File picking cancelled');
    }
  } catch (error) {
    console.error('Error picking document:', error);
  }
};


  const handleStatusUpdate = async () => {
    if (!newStatus) {
      Alert.alert('Validation Error', 'Please select a new status.');
      return;
    }

    if (newStatus === 'Approved_by_ScientistF' && !certificateFile) {
      Alert.alert('Validation Error', 'A certificate file is required to approve the request.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('status', newStatus);

    if (certificateFile) {
      formData.append('certificate_of_empanelment', {
        uri: certificateFile.uri,
        name: certificateFile.name,
        type: certificateFile.type,
      });
    }

    try {
      const response = await api.patch(
        `/audit-management/requests/${auditRequestId}/status-update/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      Alert.alert('Success', 'Status updated successfully!');
      setAuditRequest(response.data); // Update local state with new data
      setNewStatus('');
      setCertificateFile(null);
    } catch (err) {
      console.error('Error updating status:', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading request details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAuditRequestDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!auditRequest) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>No audit request found.</Text>
      </View>
    );
  }

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Submitted_by_CSP': return styles.statusSubmitted;
      case 'Forwarded_to_STQC': return styles.statusForwarded;
      case 'Audit_Completed_by_STQC': return styles.statusCompleted;
      case 'Approved_by_ScientistF': return styles.statusApproved;
      case 'Rejected_by_ScientistF': return styles.statusRejected;
      default: return styles.statusDefault;
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Audit Request ID : {auditRequest.id}</Text>
          <Text style={styles.headerSubtitle}>CSP: {auditRequest.service_provider_name}</Text>
          <Text style={[styles.statusBadge, getStatusBadgeStyle(auditRequest.status)]}>
            {auditRequest.status_display}
          </Text>
        </View>

        {/* --- CSP Certificate Download Section --- */}
        {/* This section only appears for CSPs on an approved request */}
        {user.role === 'CSP' && auditRequest.status === 'Approved_by_ScientistF' && auditRequest.certificate_of_empanelment && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}><Icon name="trophy" size={18} /> Certificate of Empanelment</Text>
            <Text style={styles.infoValue}>Your audit has been successfully approved. You can now download your certificate.</Text>
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => Linking.openURL(auditRequest.certificate_of_empanelment)}
            >
              <Icon name="download" size={20} color="#fff" />
              <Text style={styles.downloadButtonText}>Download Certificate</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* -------------------------------------- */}

        {/* Request Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}><Icon name="info-circle" size={18} /> Request Information</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Submitted By:</Text>
            <Text style={styles.infoValue}>{auditRequest.csp.username} ({auditRequest.csp.organization})</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Data Center Location:</Text>
            <Text style={styles.infoValue}>{auditRequest.data_center_location}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Request Date:</Text>
            <Text style={styles.infoValue}>{new Date(auditRequest.request_date).toLocaleString()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Last Updated:</Text>
            <Text style={styles.infoValue}>{new Date(auditRequest.last_updated).toLocaleString()}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Description:</Text>
            <Text style={styles.infoValue}>{auditRequest.description || 'No description provided.'}</Text>
          </View>
        </View>

        {/* Documents Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}><Icon name="file" size={18} /> Documents</Text>
          {auditRequest.documents.length > 0 ? (
            auditRequest.documents.map((doc) => (
              <View key={doc.id} style={styles.listItem}>
                <Text style={styles.listItemTitle}>{doc.document_type}: {doc.description || 'No description'}</Text>
                <Text style={styles.listItemSubtitle}>Uploaded by {doc.uploaded_by.username} on {new Date(doc.upload_date).toLocaleString()}</Text>
                <View style={styles.documentActions}>
                  <TouchableOpacity
                    style={styles.viewDocumentButton}
                    onPress={() => Linking.openURL(doc.file_url)}
                  >
                    <Icon name="eye" size={16} color="#fff" />
                    <Text style={styles.viewDocumentButtonText}>View Document</Text>
                  </TouchableOpacity>
                  {user.id === doc.uploaded_by.id && ( // Only uploader can delete
                    <TouchableOpacity
                      style={styles.deleteDocumentButton}
                      onPress={() => handleDeleteDocument(doc.id)}
                    >
                      <Icon name="trash-alt" size={16} color="#fff" />
                      <Text style={styles.deleteDocumentButtonText}>Delete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>No documents associated with this request yet.</Text>
          )}

          {/* Document Upload Form Button (Conditional) */}
          {/* This button appears for CSPs on their own request or STQC auditors on forwarded requests */}
          {(user.role === 'CSP' && user.id === auditRequest.csp.id) ||
            (user.role === 'STQC_Auditor' && auditRequest.status === 'Forwarded_to_STQC') ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('DocumentUpload', { auditRequestId: auditRequest.id })}
            >
              <Icon name="upload" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Upload New Document</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Remarks Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}><Icon name="comments" size={18} /> Remarks</Text>
          {auditRequest.remarks.length > 0 ? (
            auditRequest.remarks.map((remark) => (
              <View key={remark.id} style={styles.listItem}>
                <Text style={styles.remarkComment}>{remark.comment}</Text>
                <Text style={styles.remarkMeta}>By {remark.author.username} ({remark.author.role}) on {new Date(remark.timestamp).toLocaleString()}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>No remarks added for this request yet.</Text>
          )}

          {/* Add Remark Form Button (Conditional) */}
          {/* This button appears for all users who can review/audit, regardless of the request status */}
          {(user.role === 'MeitY_Reviewer' || user.role === 'STQC_Auditor' || user.role === 'Scientist_F') ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AddRemark', { auditRequestId: auditRequest.id })}
            >
              <Icon name="plus" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Add a Remark</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* --- Test Section to Debug Conditional Logic --- */}
        {/* This section displays the exact values used in the conditional check. */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Conditional Logic Debugger</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>User Role:</Text>
            <Text style={styles.infoValue}>{user.role}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Audit Status:</Text>
            <Text style={styles.infoValue}>{auditRequest.status}</Text>
          </View>
          <Text style={{ textAlign: 'center', marginVertical: 10, fontWeight: 'bold' }}>
            Result: {user.role === 'ScientistF' && auditRequest.status === 'Audit_Completed_by_STQC' ? 'TRUE' : 'FALSE'}
          </Text>
        </View>

        {/* --- Scientist F Status Update and Certificate Reward Section --- */}
        {/* This section only appears when the role is ScientistF AND the status is 'Audit_Completed_by_STQC' */}
        {user.role === 'Scientist_F' && auditRequest.status === 'Audit_Completed_by_STQC' && (
          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}><Icon name="certificate" size={18} /> Reward Certificate</Text>
            <View style={styles.statusUpdateContainer}>
              <Text style={styles.infoLabel}>Select Action:</Text>
              <Picker
                selectedValue={newStatus}
                onValueChange={(itemValue) => {
                  setNewStatus(itemValue);
                  if (itemValue !== 'Approved_by_ScientistF') {
                    setCertificateFile(null);
                  }
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select a status..." value="" />
                <Picker.Item label="Approve Request" value="Approved_by_ScientistF" />
                <Picker.Item label="Reject Request" value="Rejected_by_ScientistF" />
              </Picker>
            </View>

            {newStatus === 'Approved_by_ScientistF' && (
              <View style={styles.fileInputContainer}>
                <Text style={styles.infoLabel}>Upload Certificate of Empanelment:</Text>
                <TouchableOpacity
                  style={styles.filePickerButton}
                  onPress={handleCertificatePick}
                >
                  <Icon name="upload" size={16} color="#fff" />
                  <Text style={styles.filePickerButtonText}>
                    {certificateFile ? certificateFile.name : 'Select Certificate PDF'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.actionButton, isSubmitting && styles.disabledButton]}
              onPress={handleStatusUpdate}
              disabled={isSubmitting || !newStatus}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="check-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Submit Action</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        {/* ------------------------------------------------------------- */}

        {/* Generic Status Update Button for other roles/statuses */}
        {/* This is for MeitY Reviewer or STQC Auditor to change status */}
        {(user.role === 'MeitY_Reviewer' && auditRequest.status === 'Submitted_by_CSP') ||
          (user.role === 'STQC_Auditor' && auditRequest.status === 'Forwarded_to_STQC') ? (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('UpdateStatus', { auditRequestId: auditRequest.id, currentStatus: auditRequest.status })}
          >
            <Icon name="sync-alt" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Update Status</Text>
          </TouchableOpacity>
        ) : null}

        {/* Workflow message for other statuses */}
        {!(
          (user.role === 'MeitY_Reviewer' && auditRequest.status === 'Submitted_by_CSP') ||
          (user.role === 'STQC_Auditor' && auditRequest.status === 'Forwarded_to_STQC') ||
          (user.role === 'ScientistF' && auditRequest.status === 'Audit_Completed_by_STQC')
        ) && (
          <View style={[styles.workflowMessage, styles.workflowInfo]}>
            <Icon name="info-circle" size={20} color="#0a6b7e" />
            <Text style={styles.workflowMessageText}>
              No action is currently available for your role on this request at its current status: {auditRequest.status_display}{user.role}.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f4f7f6',
  },
  container: {
    padding: 15,
  },
  headerCard: {
    backgroundColor: '#e6f7ff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0056b3',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 10,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  statusSubmitted: { backgroundColor: '#ffc107', color: '#343a40' },
  statusForwarded: { backgroundColor: '#17a2b8' },
  statusCompleted: { backgroundColor: '#6f42c1' },
  statusApproved: { backgroundColor: '#28a745' },
  statusRejected: { backgroundColor: '#dc3545' },
  statusDefault: { backgroundColor: '#6c757d' },

  infoSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#333',
    width: 120, // Fixed width for labels
  },
  infoValue: {
    flex: 1,
    color: '#555',
  },
  noItemsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  listItem: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  listItemTitle: {
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 5,
  },
  listItemSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  remarkComment: {
    fontSize: 14,
    color: '#495057',
    fontStyle: 'italic',
    marginBottom: 5,
  },
  remarkMeta: {
    fontSize: 11,
    color: '#888',
    textAlign: 'right',
  },
  documentActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  viewDocumentButton: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  viewDocumentButtonText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 5,
  },
  deleteDocumentButton: {
    flexDirection: 'row',
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  deleteDocumentButtonText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 5,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  workflowMessage: {
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  workflowInfo: {
    backgroundColor: '#e0f2f7',
    borderColor: '#b3e0ed',
    color: '#0a6b7e',
  },
  workflowMessageText: {
    flex: 1,
    color: '#0a6b7e',
    fontSize: 14,
    fontWeight: 'bold',
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
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  statusUpdateContainer: {
    marginTop: 15,
  },
  picker: {
    height: 50,
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 5,
  },
  fileInputContainer: {
    marginTop: 15,
  },
  filePickerButton: {
    flexDirection: 'row',
    backgroundColor: '#17a2b8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  filePickerButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    shadowColor: '#ccc',
  },
});

export default AuditRequestDetailScreen;
