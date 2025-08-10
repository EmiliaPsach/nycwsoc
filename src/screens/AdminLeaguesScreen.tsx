// screens/AdminLeaguesScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { League, Team } from '../types';
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

const AdminLeaguesScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [leagueTeams, setLeagueTeams] = useState<Team[]>([]);
  const [teamsModalVisible, setTeamsModalVisible] = useState(false);
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
      const [allLeagues, allTeams] = await Promise.all([
        dataStore.getLeagues(),
        dataStore.getAllTeams(),
      ]);
      
      setLeagues(allLeagues);
      setTeams(allTeams);
    } catch (error) {
      console.error('Error loading leagues data:', error);
      Alert.alert('Error', 'Failed to load leagues data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const viewLeagueTeams = (league: League) => {
    const teamsInLeague = teams.filter(team => team.leagueId === league.id && team.isActive);
    setSelectedLeague(league);
    setLeagueTeams(teamsInLeague);
    setTeamsModalVisible(true);
  };

  const getLeagueStats = (league: League) => {
    const leagueTeams = teams.filter(team => team.leagueId === league.id && team.isActive);
    const totalPlayers = leagueTeams.reduce((sum, team) => sum + team.players.length, 0);
    return {
      teams: leagueTeams.length,
      players: totalPlayers,
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getLeagueStatus = (league: League) => {
    const now = new Date();
    const registrationDeadline = new Date(league.registrationDeadline);
    const startDate = new Date(league.startDate);
    const endDate = new Date(league.endDate);

    if (!league.isActive) return { status: 'Inactive', color: colors.status.cancelled };
    if (now < registrationDeadline) return { status: 'Registration Open', color: colors.status.scheduled };
    if (now < startDate) return { status: 'Pre-Season', color: colors.status.inProgress };
    if (now <= endDate) return { status: 'Active', color: colors.status.completed };
    return { status: 'Completed', color: colors.text.secondary };
  };

  const LeagueCard = ({ league }: { league: League }) => {
    const stats = getLeagueStats(league);
    const { status, color } = getLeagueStatus(league);

    return (
      <View style={cardStyles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text style={[textStyles.title, { fontSize: typography.size.lg, marginBottom: spacing.xs }]}>
              {league.name}
            </Text>
            <Text style={[textStyles.body, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
              {league.skillLevel} • {league.dayOfWeek}s at {league.time}
            </Text>
          </View>
          <View style={[statusStyles.badge, { backgroundColor: color }]}>
            <Text style={statusStyles.badgeText}>{status}</Text>
          </View>
        </View>

        {league.description && (
          <Text style={[textStyles.caption, { marginBottom: spacing.md, color: colors.text.secondary }]}>
            {league.description}
          </Text>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <View>
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>📍 {league.location}</Text>
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>💰 ${league.regularPrice} (${league.earlyPrice} early)</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[textStyles.body, { fontWeight: typography.weight.semiBold, color: colors.primary }]}>
              {stats.teams} teams
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
              {stats.players} players
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <Text style={[textStyles.small, { color: colors.text.secondary }]}>
            Registration until: {formatDate(league.registrationDeadline)}
          </Text>
          <Text style={[textStyles.small, { color: colors.text.secondary }]}>
            Season: {formatDate(league.startDate)} - {formatDate(league.endDate)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TouchableOpacity
            style={[buttonStyles.secondary, { flex: 1, paddingVertical: spacing.sm }]}
            onPress={() => viewLeagueTeams(league)}
            disabled={stats.teams === 0}
          >
            <Text style={[buttonStyles.secondaryText, { fontSize: typography.size.sm }]}>
              {stats.teams === 0 ? 'No Teams' : `View ${stats.teams} Teams`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[buttonStyles.primary, { flex: 1, paddingVertical: spacing.sm }]}
            onPress={() => navigation.navigate('AdminCreateTeam')}
          >
            <Text style={[buttonStyles.primaryText, { fontSize: typography.size.sm }]}>
              Add Team
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const TeamsModal = () => (
    <Modal
      visible={teamsModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{ flex: 1, backgroundColor: colors.background.main }}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={() => setTeamsModalVisible(false)}>
            <Text style={[textStyles.body, { color: colors.primary }]}>Close</Text>
          </TouchableOpacity>
          <Text style={modalStyles.title}>
            {selectedLeague?.name} Teams
          </Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={{ flex: 1, padding: spacing.xl }}>
          {leagueTeams.length === 0 ? (
            <View style={globalStyles.emptyState}>
              <Text style={globalStyles.emptyText}>No teams in this league yet</Text>
              <TouchableOpacity
                style={[buttonStyles.primary, { marginTop: spacing.md }]}
                onPress={() => {
                  setTeamsModalVisible(false);
                  navigation.navigate('AdminCreateTeam');
                }}
              >
                <Text style={buttonStyles.primaryText}>Create First Team</Text>
              </TouchableOpacity>
            </View>
          ) : (
            leagueTeams.map(team => (
              <TouchableOpacity
                key={team.id}
                style={cardStyles.card}
                onPress={() => {
                  setTeamsModalVisible(false);
                  navigation.navigate('TeamDetail', { teamId: team.id });
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                  <Text style={[textStyles.title, { fontSize: typography.size.md }]}>
                    {team.name}
                  </Text>
                  <Text style={[textStyles.body, { color: colors.primary, fontWeight: typography.weight.semiBold }]}>
                    {team.players.length} players
                  </Text>
                </View>
                {team.description && (
                  <Text style={[textStyles.caption, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
                    {team.description}
                  </Text>
                )}
                <Text style={[textStyles.small, { color: colors.text.secondary }]}>
                  Created: {new Date(team.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading leagues...</Text>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
      <View style={headerStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[textStyles.body, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={headerStyles.headerTitle}>All Leagues ({leagues.length})</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdminCreateLeague')}>
          <Text style={[textStyles.body, { color: colors.primary, fontWeight: typography.weight.semiBold }]}>+ Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1, padding: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {leagues.length === 0 ? (
          <View style={globalStyles.emptyState}>
            <Text style={globalStyles.emptyText}>No leagues found</Text>
            <TouchableOpacity
              style={[buttonStyles.primary, { marginTop: spacing.md }]}
              onPress={() => navigation.navigate('AdminCreateLeague')}
            >
              <Text style={buttonStyles.primaryText}>Create First League</Text>
            </TouchableOpacity>
          </View>
        ) : (
          leagues.map(league => (
            <LeagueCard key={league.id} league={league} />
          ))
        )}
      </ScrollView>

      <TeamsModal />
    </View>
  );
};

export default AdminLeaguesScreen;