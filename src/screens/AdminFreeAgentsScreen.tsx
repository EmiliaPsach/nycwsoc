// screens/AdminFreeAgentsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { FreeAgentRegistration, User, Team, League } from '../types';
import ProfilePicture from '../components/ProfilePicture';
import {
  globalStyles,
  cardStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  modalStyles,
  statusStyles,
  colors,
  spacing,
  typography,
  screenConfig
} from '../styles';

const AdminFreeAgentsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [freeAgents, setFreeAgents] = useState<FreeAgentRegistration[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<FreeAgentRegistration | null>(null);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
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
      const [allFreeAgents, allUsers, allTeams, allLeagues] = await Promise.all([
        dataStore.getAllFreeAgentRegistrations(),
        dataStore.getAllUsers(),
        dataStore.getAllTeams(),
        dataStore.getLeagues(),
      ]);
      
      setFreeAgents(allFreeAgents.filter(fa => fa.status === 'Pending'));
      setUsers(allUsers);
      setTeams(allTeams);
      setLeagues(allLeagues);
    } catch (error) {
      console.error('Error loading free agents data:', error);
      Alert.alert('Error', 'Failed to load free agents data');
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

  const openAssignmentModal = (freeAgent: FreeAgentRegistration) => {
    // Get teams in the same league that have space
    const league = getLeagueById(freeAgent.leagueId);
    if (!league) return;

    const leagueTeams = teams.filter(team => 
      team.leagueId === freeAgent.leagueId && 
      team.isActive &&
      team.players.length < league.maxPlayersPerTeam
    );

    setSelectedAgent(freeAgent);
    setAvailableTeams(leagueTeams);
    setAssignmentModalVisible(true);
  };

  const assignToTeam = async (teamId: string) => {
    if (!selectedAgent) return;

    Alert.alert(
      'Confirm Assignment',
      `Assign ${getUserById(selectedAgent.userId)?.name} to ${teams.find(t => t.id === teamId)?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: async () => {
            try {
              await dataStore.assignFreeAgentToTeam(selectedAgent.id, teamId);
              setAssignmentModalVisible(false);
              setSelectedAgent(null);
              loadData(); // Refresh data
              Alert.alert('Success', 'Free agent assigned successfully!');
            } catch (error) {
              console.error('Error assigning free agent:', error);
              Alert.alert('Error', 'Failed to assign free agent. Please try again.');
            }
          },
        },
      ]
    );
  };

  const rejectFreeAgent = async (freeAgent: FreeAgentRegistration) => {
    Alert.alert(
      'Reject Free Agent',
      `Reject ${getUserById(freeAgent.userId)?.name}'s registration?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await dataStore.rejectFreeAgent(freeAgent.id);
              loadData(); // Refresh data
              Alert.alert('Success', 'Free agent registration rejected.');
            } catch (error) {
              console.error('Error rejecting free agent:', error);
              Alert.alert('Error', 'Failed to reject free agent. Please try again.');
            }
          },
        },
      ]
    );
  };

  const FreeAgentCard = ({ freeAgent }: { freeAgent: FreeAgentRegistration }) => {
    const agentUser = getUserById(freeAgent.userId);
    const league = getLeagueById(freeAgent.leagueId);

    if (!agentUser || !league) return null;

    return (
      <View style={cardStyles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <ProfilePicture user={agentUser} size={60} />
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={[textStyles.title, { fontSize: typography.size.lg }]}>
              {agentUser.name}
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
              {agentUser.email}
            </Text>
            <Text style={[textStyles.body, { color: colors.primary, marginTop: spacing.xs }]}>
              {league.name}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md }}>
          {agentUser.skillLevel && (
            <View style={[statusStyles.badge, { backgroundColor: colors.status.scheduled, marginRight: spacing.sm }]}>
              <Text style={statusStyles.badgeText}>{agentUser.skillLevel}</Text>
            </View>
          )}
          {agentUser.jerseySize && (
            <View style={[statusStyles.badge, { backgroundColor: colors.status.inProgress }]}>
              <Text style={statusStyles.badgeText}>Size {agentUser.jerseySize}</Text>
            </View>
          )}
        </View>

        <Text style={[textStyles.caption, { color: colors.text.secondary, marginBottom: spacing.md }]}>
          Requested: {new Date(freeAgent.createdAt).toLocaleDateString()}
        </Text>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity
            style={[buttonStyles.secondary, { flex: 1, paddingVertical: spacing.sm }]}
            onPress={() => rejectFreeAgent(freeAgent)}
          >
            <Text style={[buttonStyles.secondaryText, { fontSize: typography.size.sm }]}>
              Reject
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[buttonStyles.primary, { flex: 1, paddingVertical: spacing.sm }]}
            onPress={() => openAssignmentModal(freeAgent)}
          >
            <Text style={[buttonStyles.primaryText, { fontSize: typography.size.sm }]}>
              Assign to Team
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const AssignmentModal = () => (
    <Modal
      visible={assignmentModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{ flex: 1, backgroundColor: colors.background.main }}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={() => setAssignmentModalVisible(false)}>
            <Text style={[textStyles.body, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={modalStyles.title}>Assign to Team</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={{ flex: 1, padding: spacing.xl }}>
          {selectedAgent && (
            <>
              <Text style={[textStyles.body, { marginBottom: spacing.lg, textAlign: 'center' }]}>
                Choose a team for {getUserById(selectedAgent.userId)?.name}:
              </Text>

              {availableTeams.length === 0 ? (
                <View style={globalStyles.emptyState}>
                  <Text style={globalStyles.emptyText}>
                    No available teams with space in this league
                  </Text>
                </View>
              ) : (
                availableTeams.map(team => (
                  <TouchableOpacity
                    key={team.id}
                    style={cardStyles.card}
                    onPress={() => assignToTeam(team.id)}
                  >
                    <Text style={[textStyles.title, { fontSize: typography.size.md, marginBottom: spacing.sm }]}>
                      {team.name}
                    </Text>
                    {team.description && (
                      <Text style={[textStyles.caption, { marginBottom: spacing.sm }]}>
                        {team.description}
                      </Text>
                    )}
                    <Text style={[textStyles.small, { color: colors.text.secondary }]}>
                      {team.players.length}/{getLeagueById(team.leagueId)?.maxPlayersPerTeam || 0} players
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading free agents...</Text>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
      <View style={headerStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[textStyles.body, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={headerStyles.headerTitle}>Free Agents ({freeAgents.length})</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={{ flex: 1, padding: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {freeAgents.length === 0 ? (
          <View style={globalStyles.emptyState}>
            <Text style={globalStyles.emptyText}>No pending free agents</Text>
            <Text style={[textStyles.caption, { marginTop: spacing.sm, textAlign: 'center' }]}>
              All free agents have been assigned or rejected.
            </Text>
          </View>
        ) : (
          freeAgents.map(freeAgent => (
            <FreeAgentCard key={freeAgent.id} freeAgent={freeAgent} />
          ))
        )}
      </ScrollView>

      <AssignmentModal />
    </View>
  );
};

export default AdminFreeAgentsScreen;