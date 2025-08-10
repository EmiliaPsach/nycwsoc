// screens/AdminRequestsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { TeamCreationRequest, User, League } from '../types';
import ProfilePicture from '../components/ProfilePicture';
import {
  globalStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  cardStyles,
  colors,
  spacing,
  typography,
  screenConfig
} from '../styles';

const AdminRequestsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TeamCreationRequest[]>([]);
  const [requestUsers, setRequestUsers] = useState<{[key: string]: User}>({});
  const [leagues, setLeagues] = useState<{[key: string]: League}>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dataStore = new DataStore();

  const loadRequests = async () => {
    if (!user) return;

    try {
      const pendingRequests = await dataStore.getTeamCreationRequestsForAdmin();
      setRequests(pendingRequests);

      // Load user and league data for each request
      const users: {[key: string]: User} = {};
      const leagueData: {[key: string]: League} = {};

      for (const request of pendingRequests) {
        if (!users[request.userId]) {
          const userData = await dataStore.getUser(request.userId);
          if (userData) users[request.userId] = userData;
        }

        if (!leagueData[request.leagueId]) {
          const league = await dataStore.getLeague(request.leagueId);
          if (league) leagueData[request.leagueId] = league;
        }
      }

      setRequestUsers(users);
      setLeagues(leagueData);
    } catch (error) {
      console.error('Error loading team creation requests:', error);
      Alert.alert('Error', 'Failed to load team creation requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleApproveRequest = async (request: TeamCreationRequest) => {
    if (!user) return;

    Alert.alert(
      'Approve Team Creation',
      `Are you sure you want to approve the creation of "${request.teamName}" by ${requestUsers[request.userId]?.name || 'this user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              await dataStore.approveTeamCreationRequest(request.id, user.id);
              Alert.alert('Success', `Team "${request.teamName}" has been created and approved!`);
              loadRequests();
            } catch (error) {
              console.error('Error approving team creation:', error);
              Alert.alert('Error', 'Failed to approve team creation. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleRejectRequest = async (request: TeamCreationRequest) => {
    if (!user) return;

    Alert.alert(
      'Reject Team Creation',
      `Are you sure you want to reject the creation of "${request.teamName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataStore.rejectTeamCreationRequest(request.id, user.id);
              Alert.alert('Request Rejected', 'The team creation request has been rejected.');
              loadRequests();
            } catch (error) {
              console.error('Error rejecting team creation:', error);
              Alert.alert('Error', 'Failed to reject request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const RequestCard = ({ request }: { request: TeamCreationRequest }) => {
    const requestUser = requestUsers[request.userId];
    const league = leagues[request.leagueId];

    if (!requestUser || !league) return null;

    return (
      <View style={cardStyles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md }}>
          <ProfilePicture user={requestUser} size={50} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[textStyles.title, { fontSize: typography.size.lg, marginBottom: spacing.xs }]}>
              {request.teamName}
            </Text>
            <Text style={[textStyles.body, { marginBottom: spacing.xs }]}>
              Requested by: {requestUser.name}
            </Text>
            <Text style={[textStyles.caption, { marginBottom: spacing.xs }]}>
              League: {league.name}
            </Text>
            {requestUser.skillLevel && (
              <Text style={[textStyles.small, { color: colors.primary }]}>
                Captain Skill Level: {requestUser.skillLevel}
              </Text>
            )}
          </View>
        </View>

        {request.teamDescription && (
          <View style={{ marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.background.main, borderRadius: 8 }}>
            <Text style={[textStyles.small, { fontWeight: typography.weight.semiBold, marginBottom: spacing.xs }]}>
              Team Description:
            </Text>
            <Text style={[textStyles.small, { color: colors.text.secondary }]}>
              {request.teamDescription}
            </Text>
          </View>
        )}

        <View style={{ marginBottom: spacing.md }}>
          <Text style={[textStyles.small, { color: colors.text.secondary }]}>
            Requested: {new Date(request.requestedAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity
            style={[buttonStyles.secondary, { flex: 1, marginRight: spacing.sm }]}
            onPress={() => handleRejectRequest(request)}
          >
            <Text style={buttonStyles.secondaryText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[buttonStyles.primary, { flex: 1, marginLeft: spacing.sm }]}
            onPress={() => handleApproveRequest(request)}
          >
            <Text style={buttonStyles.primaryText}>Approve & Create Team</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Check if user is admin
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <View style={globalStyles.errorContainer}>
        <Text style={globalStyles.errorText}>Access denied. Admin privileges required.</Text>
        <TouchableOpacity
          style={buttonStyles.primary}
          onPress={() => navigation.goBack()}
        >
          <Text style={buttonStyles.primaryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading admin requests...</Text>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
      <View style={headerStyles.header}>
        <Text style={headerStyles.headerTitle}>Team Creation Requests</Text>
        <Text style={[headerStyles.headerSubtitle, { marginTop: spacing.xs }]}>
          Admin Panel
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.xl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {requests.length === 0 ? (
          <View style={globalStyles.emptyState}>
            <Text style={{ fontSize: 64, marginBottom: spacing.lg }}>⚡</Text>
            <Text style={[textStyles.title, { marginBottom: spacing.sm, fontSize: typography.size.xl }]}>
              No Pending Team Creations
            </Text>
            <Text style={[globalStyles.emptyText, { lineHeight: typography.size.md * 1.5 }]}>
              When players request to create new teams, you'll review and approve them here.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[textStyles.body, { marginBottom: spacing.lg, color: colors.text.secondary }]}>
              You have {requests.length} pending team creation request{requests.length !== 1 ? 's' : ''} to review.
            </Text>
            
            {requests.map(request => (
              <RequestCard key={request.id} request={request} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default AdminRequestsScreen;