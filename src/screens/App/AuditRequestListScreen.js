// src/screens/App/AuditRequestListScreen.js
// Displays a list of audit requests, filtered by user role.
// Includes separate sections for MeitY Reviewer's pending and reviewed requests.

import React, { useState, useContext, useCallback, useRef } from 'react'; // Added useRef
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api'; // Ensure this is correctly imported
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/FontAwesome';

function AuditRequestListScreen({ navigation }) {
  const { authState } = useContext(AuthContext);
  const user = authState.user;
  const [pendingRequests, setPendingRequests] = useState([]);
  const [reviewedRequests, setReviewedRequests] = useState([]);
  const [allRequests, setAllRequests] = useState([]); // For non-MeitY roles
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Use a ref to track if a fetch is already in progress or has just completed
  // This helps prevent duplicate fetches, especially in React's Strict Mode.
  const isFetchingRef = useRef(false);

  const fetchAuditRequests = async () => {
    // Prevent re-fetching if a fetch is already in progress
    if (isFetchingRef.current) {
      console.log('AuditRequestListScreen: Fetch already in progress or recently completed. Skipping.');
      return;
    }
    // Ensure user object is available before attempting to fetch data
    if (!user) {
      console.log('AuditRequestListScreen: User not available. Cannot fetch audit requests.');
      setLoading(false); // Ensure loading is off if no user to prevent infinite spinner
      return;
    }

    isFetchingRef.current = true; // Set flag to true to indicate a fetch is starting
    console.log('AuditRequestListScreen: Initiating fetch for user:', user?.username, 'role:', user?.role);
    setLoading(true); // Show loading indicator
    try {
      const response = await api.get('/audit-management/requests/');
      
      // --- START: Added/Modified Debugging Logs for Response Data ---
      console.log('AuditRequestListScreen: Raw API response data:', response.data);
      let requests = [];
      if (Array.isArray(response.data)) {
        requests = response.data;
      } else if (response.data && Array.isArray(response.data.results)) { // Common DRF pagination structure
        requests = response.data.results;
        console.log('AuditRequestListScreen: Found data in response.data.results.');
      } else {
        console.warn('AuditRequestListScreen: API response data is not an array or expected DRF format:', response.data);
      }
      console.log('AuditRequestListScreen: Processed requests count:', requests.length);
      // --- END: Added/Modified Debugging Logs for Response Data ---

      // Filter requests based on user role
      if (user.role === 'MeitY_Reviewer') {
        const pending = requests.filter(req => req.status === 'Submitted_by_CSP');
        const reviewed = requests.filter(req =>
          req.status === 'Forwarded_to_STQC' ||
          req.status === 'Audit_Completed_by_STQC' ||
          req.status === 'Approved_by_ScientistF' ||
          req.status === 'Rejected_by_ScientistF'
        );
        setPendingRequests(pending);
        setReviewedRequests(reviewed);
      } else {
        setAllRequests(requests);
      }
    } catch (error) {
      console.error('AuditRequestListScreen: Error fetching audit requests:', error.response?.status, error.response?.data || error.message);
      // More specific error handling for 401 Unauthorized
      if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'Your session has expired or is invalid. Please log in again.');
        // The API interceptor should handle token refresh, but if it fails,
        // this alert informs the user and they might need to manually re-login.
      } else {
        Alert.alert('Error', 'Failed to load audit requests. Please try again.');
      }
    } finally {
      setLoading(false); // Hide loading indicator
      isFetchingRef.current = false; // Reset flag after fetch completes (success or failure)
      setRefreshing(false); // Stop refresh indicator
      console.log('AuditRequestListScreen: Fetch operation completed.');
    }
  };

  // useFocusEffect is ideal for data fetching that should happen when the screen
  // comes into focus (e.g., navigating back to this screen).
  useFocusEffect(
    useCallback(() => {
      console.log('AuditRequestListScreen: useFocusEffect triggered.');
      // Only attempt to fetch if user is defined (i.e., authenticated state is known)
      // and a fetch isn't already in progress.
      if (user && !isFetchingRef.current) {
        fetchAuditRequests();
      } else if (!user) {
        console.log('AuditRequestListScreen: User not available on focus, not fetching.');
        setLoading(false);
      }

      return () => {
        // Cleanup function for when the component blurs or unmounts.
        // Reset the fetching flag to allow a fresh fetch next time the screen focuses.
        console.log('AuditRequestListScreen: useFocusEffect cleanup (screen blurred/unmounted).');
        isFetchingRef.current = false;
      };
    }, [user]) // Dependency on 'user' ensures this effect re-runs if the user object changes (e.g., after login)
  );

  // Callback for Pull-to-Refresh functionality
  const onRefresh = useCallback(() => {
    setRefreshing(true); // Activate the refreshing indicator
    fetchAuditRequests(); // Trigger a fresh fetch
  }, [user]); // Depend on user to ensure correct role-based fetch

  // Conditional rendering for loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading audit requests...</Text>
      </View>
    );
  }

  // Determine which list to display based on user role
  const displayList = user?.role === 'MeitY_Reviewer' ? pendingRequests : allRequests;
  const showReviewedSection = user?.role === 'MeitY_Reviewer';

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <>
            {showReviewedSection && (
              <Text style={styles.sectionTitle}>
                <Icon name="hourglass-half" size={20} color="#007bff" /> Pending Reviews
              </Text>
            )}
            {/* Message for no requests in the main list or if not a MeitY Reviewer */}
            {displayList.length === 0 && !showReviewedSection && (
              <Text style={styles.noRequestsText}>No audit requests found for your role or criteria.</Text>
            )}
            {/* Message for MeitY Reviewer if no pending requests */}
            {showReviewedSection && pendingRequests.length === 0 && (
              <Text style={styles.noRequestsText}>No audit requests currently pending your review.</Text>
            )}
          </>
        }
        data={displayList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => renderRequestItem({ item, navigation })} // Pass navigation to renderItem
        ListFooterComponent={
          // Only show reviewed section for MeitY Reviewer
          showReviewedSection ? (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                <Icon name="history" size={20} color="#28a745" /> Reviewed Requests
              </Text>
              {reviewedRequests.length === 0 ? (
                <Text style={styles.noRequestsText}>No requests have been reviewed by you yet, or are currently being processed by STQC/Scientist F.</Text>
              ) : (
                <FlatList
                  data={reviewedRequests}
                  keyExtractor={(item) => `reviewed-${item.id}`}
                  renderItem={({ item }) => renderRequestItem({ item, navigation })} // Pass navigation
                  scrollEnabled={false} // Prevent nested scrolling issues
                />
              )}
            </>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007bff']} />
        }
      />
    </View>
  );
}

// Helper function to render individual audit request items
const renderRequestItem = ({ item, navigation }) => ( // Added navigation to props for consistency
  <TouchableOpacity
    style={styles.card}
    onPress={() => navigation.navigate('AuditRequestDetail', { auditRequestId: item.id })}
  >
    <View style={styles.cardHeader}>
      <Text style={styles.requestId}>Request ID: #{item.id}</Text>
      <Text style={[styles.statusBadge, styles[`status-${item.status}`]]}>
        {item.status_display}
      </Text>
    </View>
    <Text style={styles.cardText}>
      <Text style={styles.boldText}>CSP:</Text> {item.service_provider_name}
    </Text>
    <Text style={styles.cardText}>
      <Text style={styles.boldText}>Location:</Text> {item.data_center_location}
    </Text>
    <Text style={styles.cardText}>
      <Text style={styles.boldText}>Submitted:</Text> {new Date(item.request_date).toLocaleString()}
    </Text>
    <Text style={styles.cardText}>
      <Text style={styles.boldText}>Last Updated:</Text> {new Date(item.last_updated).toLocaleString()}
    </Text>
  </TouchableOpacity>
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f6',
    padding: 10,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingVertical: 10,
    backgroundColor: '#e6f7ff',
    textAlign: 'center',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  requestId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  'status-Submitted_by_CSP': { backgroundColor: '#ffc107', color: '#343a40' },
  'status-Forwarded_to_STQC': { backgroundColor: '#17a2b8' },
  'status-Audit_Completed_by_STQC': { backgroundColor: '#6f42c1' },
  'status-Approved_by_ScientistF': { backgroundColor: '#28a745' },
  'status-Rejected_by_ScientistF': { backgroundColor: '#dc3545' },
  cardText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  boldText: {
    fontWeight: 'bold',
  },
  noRequestsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    padding: 20,
    backgroundColor: '#e0f2f7',
    borderRadius: 10,
    marginHorizontal: 10,
  },
});

export default AuditRequestListScreen;
