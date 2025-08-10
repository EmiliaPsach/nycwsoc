// screens/AdminLeagueDetailScreen.tsx
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
import { League, Team, Game } from '../types';
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

interface Props {
  route: {
    params: {
      leagueId: string;
    };
  };
  navigation: any;
}

const AdminLeagueDetailScreen = ({ route, navigation }: any) => {
  const { leagueId } = route.params;
  const { user } = useAuth();
  const [league, setLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dataStore = new DataStore();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [leagueId])
  );

  const loadData = async () => {
    try {
      const [leagueData, leagueTeams, leagueGames] = await Promise.all([
        dataStore.getLeague(leagueId),
        dataStore.getTeamsByLeague(leagueId),
        dataStore.getGamesByLeague(leagueId)
      ]);
      
      setLeague(leagueData);
      setTeams(leagueTeams);
      setGames(leagueGames);
    } catch (error) {
      console.error('Error loading league data:', error);
      Alert.alert('Error', 'Failed to load league data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleScheduleGames = () => {
    if (teams.length < 2) {
      Alert.alert('Cannot Schedule', 'Need at least 2 teams to create a schedule');
      return;
    }

    if (games.length > 0) {
      Alert.alert(
        'Games Already Scheduled',
        'This league already has scheduled games. Do you want to reschedule all games?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reschedule', style: 'destructive', onPress: confirmReschedule }
        ]
      );
    } else {
      navigation.navigate('AdminScheduleGames', { leagueId });
    }
  };

  const confirmReschedule = async () => {
    try {
      await dataStore.deleteGamesByLeague(leagueId);
      navigation.navigate('AdminScheduleGames', { leagueId });
    } catch (error) {
      console.error('Error clearing existing games:', error);
      Alert.alert('Error', 'Failed to clear existing games');
    }
  };

  const handleEditLeague = () => {
    navigation.navigate('AdminEditLeague', { leagueId });
  };

  const getSchedulingInfo = () => {
    if (!league) return null;

    const fieldsAvailable = league.availableFields || 1;
    const gameStartTimes = league.gameStartTimes || [league.time];
    const gamesPerWeek = fieldsAvailable * gameStartTimes.length;
    const maxTeamsPerWeek = gamesPerWeek * 2;
    const willHaveByeWeeks = teams.length > maxTeamsPerWeek;

    return {
      fieldsAvailable,
      gameStartTimes,
      gamesPerWeek,
      maxTeamsPerWeek,
      willHaveByeWeeks
    };
  };

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading league...</Text>
      </View>
    );
  }

  if (!league) {
    return (
      <View style={globalStyles.emptyState}>
        <Text style={globalStyles.emptyText}>League not found</Text>
      </View>
    );
  }

  const schedulingInfo = getSchedulingInfo();

  return (
    <View style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
      <View style={headerStyles.header}>
        <Text style={headerStyles.headerTitle}>League Details</Text>
        <TouchableOpacity onPress={handleEditLeague}>
          <Text style={[buttonStyles.secondaryText, { color: colors.primary }]}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1, padding: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* League Info */}
        <View style={cardStyles.card}>
          <Text style={textStyles.title}>{league.name}</Text>
          <Text style={[textStyles.body, { color: colors.text.secondary, marginTop: spacing.sm }]}>
            {league.location} • {league.dayOfWeek}s at {league.time}
          </Text>
          <Text style={[textStyles.body, { color: colors.text.secondary }]}>
            {league.skillLevel} • {league.season}
          </Text>
          
          {league.description && (
            <Text style={[textStyles.body, { marginTop: spacing.md }]}>
              {league.description}
            </Text>
          )}
        </View>

        {/* Teams Summary */}
        <View style={[cardStyles.card, { marginTop: spacing.lg }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text style={textStyles.subtitle}>Teams</Text>
            <Text style={[textStyles.body, { color: colors.text.secondary }]}>
              {teams.length} / {league.maxTeams}
            </Text>
          </View>
          
          {teams.length === 0 ? (
            <Text style={[textStyles.body, { color: colors.text.secondary, fontStyle: 'italic' }]}>
              No teams registered yet
            </Text>
          ) : (
            teams.slice(0, 3).map(team => (
              <View key={team.id} style={{ paddingVertical: spacing.sm }}>
                <Text style={textStyles.body}>{team.name}</Text>
                <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                  {team.players.length} players
                </Text>
              </View>
            ))
          )}
          
          {teams.length > 3 && (
            <Text style={[textStyles.caption, { color: colors.primary, marginTop: spacing.sm }]}>
              +{teams.length - 3} more teams
            </Text>
          )}
        </View>

        {/* Schedule Summary */}
        <View style={[cardStyles.card, { marginTop: spacing.lg }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text style={textStyles.subtitle}>Schedule</Text>
            <Text style={[textStyles.body, { color: colors.text.secondary }]}>
              {games.length} games
            </Text>
          </View>
          
          {schedulingInfo && (
            <View style={{ marginBottom: spacing.md }}>
              <Text style={textStyles.body}>
                • {schedulingInfo.fieldsAvailable} field{schedulingInfo.fieldsAvailable > 1 ? 's' : ''} available
              </Text>
              <Text style={textStyles.body}>
                • {schedulingInfo.gameStartTimes.length} time slot{schedulingInfo.gameStartTimes.length > 1 ? 's' : ''}: {schedulingInfo.gameStartTimes.join(', ')}
              </Text>
              <Text style={textStyles.body}>
                • Up to {schedulingInfo.gamesPerWeek} games per week
              </Text>
              {schedulingInfo.willHaveByeWeeks && (
                <Text style={[textStyles.body, { color: colors.warning }]}>
                  • Some teams will have bye weeks
                </Text>
              )}
            </View>
          )}
          
          {games.length === 0 ? (
            <Text style={[textStyles.body, { color: colors.text.secondary, fontStyle: 'italic' }]}>
              No games scheduled yet
            </Text>
          ) : (
            <View>
              <Text style={[textStyles.body, { marginBottom: spacing.sm }]}>
                Season runs {league.seasonWeeks || 12} weeks
              </Text>
              <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                {games.filter(g => g.status === 'Scheduled').length} scheduled, {games.filter(g => g.status === 'Completed').length} completed
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          <TouchableOpacity
            style={[buttonStyles.primary, { backgroundColor: games.length > 0 ? colors.warning : colors.primary }]}
            onPress={handleScheduleGames}
          >
            <Text style={buttonStyles.primaryText}>
              {games.length > 0 ? 'Reschedule All Games' : 'Schedule Games'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={buttonStyles.secondary}
            onPress={() => navigation.navigate('AdminSchedules', { leagueId })}
          >
            <Text style={buttonStyles.secondaryText}>View All Games</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={buttonStyles.secondary}
            onPress={() => navigation.navigate('AdminSchedules', { leagueId })}
          >
            <Text style={buttonStyles.secondaryText}>View League Games</Text>
          </TouchableOpacity>
        </View>

        {/* League Settings Summary */}
        <View style={[cardStyles.card, { marginTop: spacing.xl }]}>
          <Text style={[textStyles.subtitle, { marginBottom: spacing.md }]}>League Settings</Text>
          
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[textStyles.body, { color: colors.text.secondary }]}>Max Teams</Text>
              <Text style={textStyles.body}>{league.maxTeams}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[textStyles.body, { color: colors.text.secondary }]}>Max Players/Team</Text>
              <Text style={textStyles.body}>{league.maxPlayersPerTeam}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[textStyles.body, { color: colors.text.secondary }]}>Regular Price</Text>
              <Text style={textStyles.body}>${league.regularPrice}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[textStyles.body, { color: colors.text.secondary }]}>Early Bird Price</Text>
              <Text style={textStyles.body}>${league.earlyPrice}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[textStyles.body, { color: colors.text.secondary }]}>Available Fields</Text>
              <Text style={textStyles.body}>{league.availableFields || 1}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[textStyles.body, { color: colors.text.secondary }]}>Season Length</Text>
              <Text style={textStyles.body}>{league.seasonWeeks || 12} weeks</Text>
            </View>
          </View>
        </View>

        {/* Important Dates */}
        <View style={[cardStyles.card, { marginTop: spacing.lg, marginBottom: spacing.xxl }]}>
          <Text style={[textStyles.subtitle, { marginBottom: spacing.md }]}>Important Dates</Text>
          
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[textStyles.body, { color: colors.text.secondary }]}>Early Bird Deadline</Text>
              <Text style={textStyles.body}>
                {new Date(league.earlyBirdDeadline).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[textStyles.body, { color: colors.text.secondary }]}>Registration Deadline</Text>
              <Text style={textStyles.body}>
                {new Date(league.registrationDeadline).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[textStyles.body, { color: colors.text.secondary }]}>Season Start</Text>
              <Text style={textStyles.body}>
                {new Date(league.startDate).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[textStyles.body, { color: colors.text.secondary }]}>Season End</Text>
              <Text style={textStyles.body}>
                {new Date(league.endDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default AdminLeagueDetailScreen;