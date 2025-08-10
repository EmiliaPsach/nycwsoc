// screens/TeamRequestsScreen.tsx
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
import { TeamJoinRequest, User, Team } from '../types';
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

const TeamRequestsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TeamJoinRequest[]>([]);
  const [requestUsers, setRequestUsers] = useState<{[key: string]: User}>({});
  const [requestTeams, setRequestTeams] = useState<{[key: string]: Team}>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dataStore = new DataStore();

  const loadRequests = async () => {
    if (!user) return;

    try {
      const pendingRequests = await dataStore.getTeamJoinRequestsForCaptain(user.id);
      setRequests(pendingRequests);

      // Load user and team data for each request
      const users: {[key: string]: User} = {};
      const teams: {[key: string]: Team} = {};

      for (const request of pendingRequests) {
        if (!users[request.userId]) {
          const userData = await dataStore.getUser(request.userId);
          if (userData) users[request.userId] = userData;
        }

        if (!teams[request.teamId]) {
          const teamData = await dataStore.getTeam(request.teamId);
          if (teamData) teams[request.teamId] = teamData;
        }
      }

      setRequestUsers(users);
      setRequestTeams(teams);
    } catch (error) {
      console.error('Error loading team requests:', error);
      Alert.alert('Error', 'Failed to load team requests');
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

  const handleApproveRequest = async (request: TeamJoinRequest) => {
    if (!user) return;

    Alert.alert(
      'Approve Request',
      `Are you sure you want to approve ${requestUsers[request.userId]?.name || 'this player'} to join ${requestTeams[request.teamId]?.name || 'your team'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            try {
              await dataStore.approveTeamJoinRequest(request.id, user.id);
              Alert.alert('Success', 'Player has been approved and added to your team!');
              loadRequests();
            } catch (error) {
              console.error('Error approving request:', error);
              Alert.alert('Error', 'Failed to approve request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleRejectRequest = async (request: TeamJoinRequest) => {
    if (!user) return;

    Alert.alert(
      'Reject Request',
      `Are you sure you want to reject ${requestUsers[request.userId]?.name || 'this player'}'s request to join ${requestTeams[request.teamId]?.name || 'your team'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataStore.rejectTeamJoinRequest(request.id, user.id);
              Alert.alert('Request Rejected', 'The join request has been rejected.');
              loadRequests();
            } catch (error) {
              console.error('Error rejecting request:', error);
              Alert.alert('Error', 'Failed to reject request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const RequestCard = ({ request }: { request: TeamJoinRequest }) => {
    const requestUser = requestUsers[request.userId];
    const team = requestTeams[request.teamId];

    if (!requestUser || !team) return null;

    return (
      <View style={cardStyles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <ProfilePicture user={requestUser} size={50} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={[textStyles.body, { fontWeight: typography.weight.semiBold }]}>
              {requestUser.name}
            </Text>
            <Text style={[textStyles.caption, { marginTop: 2 }]}>
              wants to join {team.name}
            </Text>
            {requestUser.skillLevel && (
              <Text style={[textStyles.small, { marginTop: 2, color: colors.primary }]}>
                Skill Level: {requestUser.skillLevel}
              </Text>
            )}
          </View>
        </View>

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
            <Text style={buttonStyles.primaryText}>Approve</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
      <View style={headerStyles.header}>
        <Text style={headerStyles.headerTitle}>Team Join Requests</Text>
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
            <Text style={{ fontSize: 64, marginBottom: spacing.lg }}>👥</Text>
            <Text style={[textStyles.title, { marginBottom: spacing.sm, fontSize: typography.size.xl }]}>
              No Pending Requests
            </Text>
            <Text style={[globalStyles.emptyText, { lineHeight: typography.size.md * 1.5 }]}>
              When players request to join your teams, you'll see their requests here for approval.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[textStyles.body, { marginBottom: spacing.lg, color: colors.text.secondary }]}>
              You have {requests.length} pending request{requests.length !== 1 ? 's' : ''} to review.
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

export default TeamRequestsScreen;