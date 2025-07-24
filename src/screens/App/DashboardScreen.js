// src/screens/App/DashboardScreen.js
// Displays a user-specific dashboard with navigation options.

import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Icon from 'react-native-vector-icons/FontAwesome';

function DashboardScreen({ navigation }) {
  const { authState, logout } = useContext(AuthContext);
  const user = authState.user;

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User data not available. Please log in again.</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'CSP': return 'Cloud Service Provider';
      case 'MeitY_Reviewer': return 'MeitY Reviewer';
      case 'STQC_Auditor': return 'STQC Auditor';
      case 'Scientist_F': return 'Scientist F';
      default: return role;
    }
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Icon name="tachometer" size={60} color="#007bff" style={styles.headerIcon} />
        <Text style={styles.welcomeText}>Welcome, {user.username}!</Text>
        <Text style={styles.roleText}>Role: {getRoleDisplayName(user.role)}</Text>
        {user.organization && <Text style={styles.orgText}>Organization: {user.organization}</Text>}
      </View>

      <View style={styles.cardContainer}>
        {user.role === 'CSP' && (
          <>
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('CreateAuditRequest')}
            >
              <Icon name="plus-circle" size={40} color="#28a745" />
              <Text style={styles.cardTitle}>New Audit Request</Text>
              <Text style={styles.cardDescription}>Submit a new audit request for your cloud service.</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('AuditRequestList')}
            >
              <Icon name="list-alt" size={40} color="#007bff" />
              <Text style={styles.cardTitle}>My Audit Requests</Text>
              <Text style={styles.cardDescription}>View and manage your submitted audit requests.</Text>
            </TouchableOpacity>
          </>
        )}

        {(user.role === 'MeitY_Reviewer' || user.role === 'STQC_Auditor' || user.role === 'Scientist_F') && (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('AuditRequestList')}
          >
            <Icon name="clipboard-list" size={40} color="#ffc107" />
            <Text style={styles.cardTitle}>Manage Audit Requests</Text>
            <Text style={styles.cardDescription}>Access and process audit requests relevant to your role.</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Icon name="sign-out" size={20} color="#fff" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f4f7f6',
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  headerCard: {
    backgroundColor: '#e6f7ff',
    padding: 25,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  headerIcon: {
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 18,
    color: '#0056b3',
    fontWeight: '600',
    marginBottom: 5,
  },
  orgText: {
    fontSize: 16,
    color: '#555',
  },
  cardContainer: {
    width: '100%',
    flexDirection: 'column', // Stack cards vertically
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400, // Max width for cards
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default DashboardScreen;
