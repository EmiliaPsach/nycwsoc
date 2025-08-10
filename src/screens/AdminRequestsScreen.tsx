import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { TeamCreationRequest, User, League } from '../types';
import ProfilePicture from '../components/ProfilePicture';
import {
  globalStyles,
  cardStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  statusStyles,
  colors,
  spacing,
  typography,
  screenConfig
} from '../styles';

const AdminRequestsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [teamRequests, setTeamRequests] = useState<TeamCreationRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dataStore = new DataStore();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [requests, allUsers, allLeagues] = await Promise.all([
        dataStore.getTeamCreationRequestsForAdmin(),
        dataStore.getAllUsers(),
        dataStore.getLeagues(),
      ]);
      
      setTeamRequests(requests);
      setUsers(allUsers);
      setLeagues(allLeagues);
    } catch (error) {
      console.error('Error loading admin requests data:', error);
      Alert.alert('Error', 'Failed to load requests data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getUserById = (userId: string): User | undefined => {
    return users.find(u => u.id === userId);
  };

  const getLeagueById = (leagueId: string): League | undefined => {
    return leagues.find(l => l.id === leagueId);
  };

  const approveTeamRequest = async (request: TeamCreationRequest) => {
    const requester = getUserById(request.userId);
    Alert.alert(
      'Approve Team Creation',
      `Approve "${request.teamName}" by ${requester?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await dataStore.approveTeamCreationRequest(request.id, user!.id);
              loadData();
              Alert.alert('Success', `Team "${request.teamName}" has been approved and created!`);
            } catch (error) {
              console.error('Error approving team request:', error);
              Alert.alert('Error', 'Failed to approve team request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const rejectTeamRequest = async (request: TeamCreationRequest) => {
    const requester = getUserById(request.userId);
    Alert.alert(
      'Reject Team Creation',
      `Reject "${request.teamName}" by ${requester?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataStore.rejectTeamCreationRequest(request.id, user!.id);
              loadData();
              Alert.alert('Success', 'Team creation request rejected.');
            } catch (error) {
              console.error('Error rejecting team request:', error);
              Alert.alert('Error', 'Failed to reject team request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const TeamRequestCard = ({ request }: { request: TeamCreationRequest }) => {
    const requester = getUserById(request.userId);
    const league = getLeagueById(request.leagueId);

    if (!requester || !league) return null;

    return (
      <View style={cardStyles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <ProfilePicture user={requester} size={60} />
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={[textStyles.title, { fontSize: typography.size.lg }]}>
              {request.teamName}
            </Text>
            <Text style={[textStyles.body, { color: colors.text.secondary }]}>
              Requested by {requester.name}
            </Text>
            <Text style={[textStyles.caption, { color: colors.primary }]}>
              {league.name}
            </Text>
          </View>
        </View>

        {request.teamDescription && (
          <View style={{ marginBottom: spacing.md }}>
            <Text style={[textStyles.body, { fontWeight: typography.weight.semiBold, marginBottom: spacing.xs }]}>
              Team Description:
            </Text>
            <Text style={[textStyles.body, { color: colors.text.secondary }]}>
              {request.teamDescription}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md }}>
          {requester.skillLevel && (
            <View style={[statusStyles.badge, { backgroundColor: colors.status.scheduled, marginRight: spacing.sm }]}>
              <Text style={statusStyles.badgeText}>{requester.skillLevel}</Text>
            </View>
          )}
          <View style={[statusStyles.badge, { backgroundColor: colors.status.inProgress }]}>
            <Text style={statusStyles.badgeText}>Captain</Text>
          </View>
        </View>

        <Text style={[textStyles.caption, { color: colors.text.secondary, marginBottom: spacing.md }]}>
          Requested: {new Date(request.requestedAt).toLocaleDateString()}
        </Text>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity
            style={[buttonStyles.secondary, { flex: 1, paddingVertical: spacing.sm }]}
            onPress={() => rejectTeamRequest(request)}
          >
            <Text style={[buttonStyles.secondaryText, { fontSize: typography.size.sm }]}>
              Reject
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[buttonStyles.primary, { flex: 1, paddingVertical: spacing.sm }]}
            onPress={() => approveTeamRequest(request)}
          >
            <Text style={[buttonStyles.primaryText, { fontSize: typography.size.sm }]}>
              Approve & Create
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading team requests...</Text>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
      <View style={headerStyles.header}>
        <Text style={headerStyles.headerTitle}>Team Requests ({teamRequests.length})</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={{ flex: 1, padding: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {teamRequests.length === 0 ? (
          <View style={globalStyles.emptyState}>
            <Text style={globalStyles.emptyText}>No pending team requests</Text>
            <Text style={[textStyles.caption, { marginTop: spacing.sm, textAlign: 'center' }]}>
              All team creation requests have been processed.
            </Text>
          </View>
        ) : (
          teamRequests.map(request => (
            <TeamRequestCard key={request.id} request={request} />
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default AdminRequestsScreen;