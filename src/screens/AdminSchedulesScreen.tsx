// screens/AdminSchedulesScreen.tsx
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
import { Game, Team, League } from '../types';
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

const AdminSchedulesScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
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
      const [allGames, allTeams, allLeagues] = await Promise.all([
        dataStore.getAllGames(),
        dataStore.getAllTeams(),
        dataStore.getLeagues(),
      ]);
      
      setGames(allGames);
      setTeams(allTeams);
      setLeagues(allLeagues);
    } catch (error) {
      console.error('Error loading admin schedules data:', error);
      Alert.alert('Error', 'Failed to load schedules data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  const getLeagueName = (leagueId: string) => {
    const league = leagues.find(l => l.id === leagueId);
    return league?.name || 'Unknown League';
  };

  const getFilteredGames = () => {
    const now = new Date();
    switch (selectedFilter) {
      case 'upcoming':
        return games.filter(game => {
          const gameDate = new Date(game.date);
          return gameDate >= now && game.status !== 'Completed';
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'completed':
        return games.filter(game => game.status === 'Completed')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      default:
        return games.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return colors.status.scheduled;
      case 'In Progress': return colors.status.inProgress;
      case 'Completed': return colors.status.completed;
      case 'Cancelled': return colors.status.cancelled;
      default: return colors.text.secondary;
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const gameDate = new Date(date);
    const now = new Date();
    const diffTime = gameDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let dateText = gameDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    
    if (diffDays === 0) dateText = `Today`;
    else if (diffDays === 1) dateText = `Tomorrow`;
    else if (diffDays === -1) dateText = `Yesterday`;
    else if (diffDays < 0) dateText = `${Math.abs(diffDays)} days ago`;
    else if (diffDays <= 7) dateText = `In ${diffDays} days`;
    
    return `${dateText} at ${time}`;
  };

  const FilterButton = ({ filter, title }: { filter: typeof selectedFilter; title: string }) => (
    <TouchableOpacity
      style={[
        buttonStyles.secondary,
        { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm },
        selectedFilter === filter && { backgroundColor: colors.primary }
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        buttonStyles.secondaryText,
        { fontSize: typography.size.sm },
        selectedFilter === filter && { color: colors.text.inverse }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const GameCard = ({ game }: { game: Game }) => (
    <TouchableOpacity 
      style={cardStyles.card}
      onPress={() => navigation.navigate('GameDetail', { gameId: game.id })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
        <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
          {getLeagueName(game.leagueId)} • Week {game.week}
        </Text>
        <View style={[statusStyles.badge, { backgroundColor: getStatusColor(game.status) }]}>
          <Text style={statusStyles.badgeText}>{game.status}</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
        <Text style={[textStyles.title, { fontSize: typography.size.md, flex: 1, textAlign: 'center' }]}>
          {getTeamName(game.homeTeam)}
        </Text>
        <Text style={[textStyles.body, { marginHorizontal: spacing.md, color: colors.text.secondary }]}>
          vs
        </Text>
        <Text style={[textStyles.title, { fontSize: typography.size.md, flex: 1, textAlign: 'center' }]}>
          {getTeamName(game.awayTeam)}
        </Text>
      </View>

      {game.homeScore !== undefined && game.awayScore !== undefined ? (
        <Text style={[textStyles.title, { textAlign: 'center', marginBottom: spacing.sm, color: colors.primary }]}>
          Final Score: {game.homeScore} - {game.awayScore}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={[textStyles.body, { color: colors.primary, fontWeight: typography.weight.semiBold }]}>
            {formatDateTime(game.date, game.time)}
          </Text>
          <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
            {game.location}
          </Text>
        </View>
        <Text style={[textStyles.caption, { color: colors.primary }]}>
          View Details →
        </Text>
      </View>
    </TouchableOpacity>
  );

  const filteredGames = getFilteredGames();

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading schedules...</Text>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
      <View style={headerStyles.header}>
        <Text style={headerStyles.headerTitle}>All Schedules</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.md }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton filter="upcoming" title="Upcoming" />
          <FilterButton filter="completed" title="Completed" />
          <FilterButton filter="all" title="All Games" />
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1, padding: spacing.xl, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={[textStyles.caption, { marginBottom: spacing.lg, color: colors.text.secondary }]}>
          Showing {filteredGames.length} games
        </Text>

        {filteredGames.length === 0 ? (
          <View style={globalStyles.emptyState}>
            <Text style={globalStyles.emptyText}>
              No {selectedFilter === 'all' ? '' : selectedFilter + ' '}games found
            </Text>
          </View>
        ) : (
          filteredGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default AdminSchedulesScreen;