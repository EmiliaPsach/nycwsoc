// screens/AdminTeamsScreen.tsx
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
import { Team, User, League } from '../types';
import ProfilePicture from '../components/ProfilePicture';
import {
  globalStyles,
  cardStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  modalStyles,
  colors,
  spacing,
  typography,
  screenConfig
} from '../styles';

const AdminTeamsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<User[]>([]);
  const [playersModalVisible, setPlayersModalVisible] = useState(false);
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
      const [allTeams, allLeagues] = await Promise.all([
        dataStore.getAllTeams(),
        dataStore.getLeagues(),
      ]);
      
      setTeams(allTeams.filter(t => t.isActive));
      setLeagues(allLeagues);
    } catch (error) {
      console.error('Error loading admin teams data:', error);
      Alert.alert('Error', 'Failed to load teams data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const viewTeamPlayers = async (team: Team) => {
    try {
      const players = await dataStore.getPlayersInTeam(team.id);
      setSelectedTeam(team);
      setTeamPlayers(players);
      setPlayersModalVisible(true);
    } catch (error) {
      console.error('Error loading team players:', error);
      Alert.alert('Error', 'Failed to load team players');
    }
  };

  const getLeagueName = (leagueId: string) => {
    const league = leagues.find(l => l.id === leagueId);
    return league?.name || 'Unknown League';
  };

  const TeamCard = ({ team }: { team: Team }) => (
    <View style={cardStyles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={[textStyles.title, { fontSize: typography.size.lg, marginBottom: spacing.xs }]}>
            {team.name}
          </Text>
          <Text style={[textStyles.body, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
            {getLeagueName(team.leagueId)}
          </Text>
          {team.description && (
            <Text style={[textStyles.caption, { marginBottom: spacing.sm }]}>
              {team.description}
            </Text>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[textStyles.body, { color: colors.text.secondary }]}>
          {team.players.length} players
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity
            style={[buttonStyles.secondary, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}
            onPress={() => viewTeamPlayers(team)}
          >
            <Text style={[buttonStyles.secondaryText, { fontSize: typography.size.sm }]}>
              View Players
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[buttonStyles.primary, { paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}
            onPress={() => navigation.navigate('TeamDetail', { teamId: team.id })}
          >
            <Text style={[buttonStyles.primaryText, { fontSize: typography.size.sm }]}>
              Manage
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const PlayersModal = () => (
    <Modal
      visible={playersModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{ flex: 1, backgroundColor: colors.background.main }}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={() => setPlayersModalVisible(false)}>
            <Text style={[textStyles.body, { color: colors.primary }]}>Close</Text>
          </TouchableOpacity>
          <Text style={modalStyles.title}>
            {selectedTeam?.name} Players
          </Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={{ flex: 1, padding: spacing.xl }}>
          {teamPlayers.length === 0 ? (
            <Text style={[textStyles.body, { textAlign: 'center', marginTop: spacing.xxl }]}>
              No players in this team
            </Text>
          ) : (
            teamPlayers.map((player) => (
              <View key={player.id} style={cardStyles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ProfilePicture user={player} size={50} />
                  <View style={{ marginLeft: spacing.md, flex: 1 }}>
                    <Text style={[textStyles.title, { fontSize: typography.size.md }]}>
                      {player.name}
                    </Text>
                    <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                      {player.email}
                    </Text>
                    {player.skillLevel && (
                      <Text style={[textStyles.small, { color: colors.primary }]}>
                        {player.skillLevel}
                      </Text>
                    )}
                    {player.id === selectedTeam?.captain && (
                      <Text style={[textStyles.small, { color: colors.status.completed, fontWeight: typography.weight.semiBold }]}>
                        👨‍✈️ Captain
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading teams...</Text>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
      <View style={headerStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[textStyles.body, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={headerStyles.headerTitle}>All Teams ({teams.length})</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={{ flex: 1, padding: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {teams.length === 0 ? (
          <View style={globalStyles.emptyState}>
            <Text style={globalStyles.emptyText}>No teams found</Text>
          </View>
        ) : (
          teams.map(team => (
            <TeamCard key={team.id} team={team} />
          ))
        )}
      </ScrollView>

      <PlayersModal />
    </View>
  );
};

export default AdminTeamsScreen;