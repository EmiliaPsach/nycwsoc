// screens/AdminSchedulesScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { Game, Team, League } from '../types';
import { useCSVExport } from '../hooks/useCSVExport';
import {
  globalStyles,
  cardStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  statusStyles,
  formStyles,
  modalStyles,
  colors,
  spacing,
  typography,
  screenConfig
} from '../styles';

const AdminSchedulesScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dataStore = new DataStore();
  const { exportGames, isExporting } = useCSVExport();

  useFocusEffect(
    useCallback(() => {
      loadData();
      // Auto-filter by league or team if provided
      if (route?.params?.leagueId) {
        setSelectedLeague(route.params.leagueId);
      }
      if (route?.params?.teamId) {
        setSelectedTeam(route.params.teamId);
      }
    }, [route?.params?.leagueId, route?.params?.teamId])
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
    let filteredGames = games;
    const now = new Date();

    // Filter by status
    switch (selectedFilter) {
      case 'upcoming':
        filteredGames = filteredGames.filter(game => {
          const gameDate = new Date(game.date);
          return gameDate >= now && game.status !== 'Completed';
        });
        break;
      case 'completed':
        filteredGames = filteredGames.filter(game => game.status === 'Completed');
        break;
      default:
        // 'all' - no status filtering
        break;
    }

    // Filter by league
    if (selectedLeague) {
      filteredGames = filteredGames.filter(game => game.leagueId === selectedLeague);
    }

    // Filter by team
    if (selectedTeam) {
      filteredGames = filteredGames.filter(game => 
        game.homeTeam === selectedTeam || game.awayTeam === selectedTeam
      );
    }

    // Filter by search text (team names or league names)
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filteredGames = filteredGames.filter(game => {
        const homeTeamName = getTeamName(game.homeTeam).toLowerCase();
        const awayTeamName = getTeamName(game.awayTeam).toLowerCase();
        const leagueName = getLeagueName(game.leagueId).toLowerCase();
        
        return homeTeamName.includes(searchLower) ||
               awayTeamName.includes(searchLower) ||
               leagueName.includes(searchLower);
      });
    }

    // Sort by date
    return filteredGames.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return selectedFilter === 'completed' ? dateB - dateA : dateA - dateB;
    });
  };

  const clearFilters = () => {
    setSelectedLeague(null);
    setSelectedTeam(null);
    setSearchText('');
    setSelectedFilter('all');
  };

  const getFilteredTeams = () => {
    if (selectedLeague) {
      return teams.filter(team => team.leagueId === selectedLeague && team.isActive);
    }
    return teams.filter(team => team.isActive);
  };

  const handleExportCSV = async () => {
    const filtered = getFilteredGames();
    if (filtered.length === 0) {
      Alert.alert('No Data', 'No games available to export');
      return;
    }
    
    try {
      await exportGames(filtered, teams, leagues, { searchText });
    } catch (error) {
      console.error('Export error:', error);
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

  const LeagueModal = () => (
    <Modal visible={showLeagueModal} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: colors.background.main }}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={() => setShowLeagueModal(false)}>
            <Text style={[textStyles.body, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={modalStyles.title}>Filter by League</Text>
          <TouchableOpacity onPress={() => setShowLeagueModal(false)}>
            <Text style={[textStyles.body, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={{ flex: 1, padding: spacing.xl }}>
          <TouchableOpacity 
            style={[
              cardStyles.card, 
              { backgroundColor: !selectedLeague ? colors.primary : colors.background.card }
            ]}
            onPress={() => {
              setSelectedLeague(null);
              setSelectedTeam(null); // Clear team filter when changing league
            }}
          >
            <Text style={[
              textStyles.body, 
              { color: !selectedLeague ? colors.text.inverse : colors.text.primary }
            ]}>
              All Leagues
            </Text>
          </TouchableOpacity>

          {leagues.map(league => (
            <TouchableOpacity 
              key={league.id}
              style={[
                cardStyles.card, 
                { backgroundColor: selectedLeague === league.id ? colors.primary : colors.background.card }
              ]}
              onPress={() => {
                setSelectedLeague(league.id);
                setSelectedTeam(null); // Clear team filter when changing league
              }}
            >
              <Text style={[
                textStyles.title, 
                { 
                  fontSize: typography.size.md,
                  color: selectedLeague === league.id ? colors.text.inverse : colors.text.primary 
                }
              ]}>
                {league.name}
              </Text>
              <Text style={[
                textStyles.caption, 
                { color: selectedLeague === league.id ? colors.text.inverse : colors.text.secondary }
              ]}>
                {league.skillLevel} • {league.dayOfWeek}s • {league.location}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  const TeamModal = () => (
    <Modal visible={showTeamModal} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: colors.background.main }}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={() => setShowTeamModal(false)}>
            <Text style={[textStyles.body, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={modalStyles.title}>Filter by Team</Text>
          <TouchableOpacity onPress={() => setShowTeamModal(false)}>
            <Text style={[textStyles.body, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={{ flex: 1, padding: spacing.xl }}>
          <TouchableOpacity 
            style={[
              cardStyles.card, 
              { backgroundColor: !selectedTeam ? colors.primary : colors.background.card }
            ]}
            onPress={() => setSelectedTeam(null)}
          >
            <Text style={[
              textStyles.body, 
              { color: !selectedTeam ? colors.text.inverse : colors.text.primary }
            ]}>
              All Teams
            </Text>
          </TouchableOpacity>

          {getFilteredTeams().map(team => (
            <TouchableOpacity 
              key={team.id}
              style={[
                cardStyles.card, 
                { backgroundColor: selectedTeam === team.id ? colors.primary : colors.background.card }
              ]}
              onPress={() => setSelectedTeam(team.id)}
            >
              <Text style={[
                textStyles.title, 
                { 
                  fontSize: typography.size.md,
                  color: selectedTeam === team.id ? colors.text.inverse : colors.text.primary 
                }
              ]}>
                {team.name}
              </Text>
              <Text style={[
                textStyles.caption, 
                { color: selectedTeam === team.id ? colors.text.inverse : colors.text.secondary }
              ]}>
                {getLeagueName(team.leagueId)} • {team.players.length} players
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
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
        <View style={{ gap: spacing.sm }}>
          <TouchableOpacity 
            onPress={handleExportCSV}
            disabled={isExporting || getFilteredGames().length === 0}
          >
            <Text style={[
              textStyles.body, 
              { 
                color: isExporting || getFilteredGames().length === 0 ? colors.text.secondary : colors.primary,
                fontWeight: typography.weight.semiBold 
              }
            ]}>
              {isExporting ? 'Exporting...' : 'Export filtered game(s) to CSV'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AdminCreateGame')}>
            <Text style={[textStyles.body, { color: colors.primary, fontWeight: typography.weight.semiBold }]}>
              Create a new game
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
        <View style={formStyles.inputContainer}>
          <TextInput
            style={[formStyles.input, { marginBottom: 0 }]}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search by team or league name..."
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Status Filters */}
      <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.sm }}>
        <TouchableOpacity onPress={clearFilters}>
          <Text style={[textStyles.body, { color: colors.primary, fontWeight: typography.weight.semiBold }]}>
            Clear All Filters
          </Text>
        </TouchableOpacity>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterButton filter="upcoming" title="Upcoming" />
          <FilterButton filter="completed" title="Completed" />
          <FilterButton filter="all" title="All Games" />
        </ScrollView>
      </View>

      {/* League and Team Filters */}
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <TouchableOpacity 
            style={[
              buttonStyles.secondary, 
              { flex: 1, paddingVertical: spacing.sm },
              selectedLeague && { backgroundColor: colors.primary }
            ]}
            onPress={() => setShowLeagueModal(true)}
          >
            <Text style={[
              buttonStyles.secondaryText,
              { fontSize: typography.size.sm },
              selectedLeague && { color: colors.text.inverse }
            ]}>
              {selectedLeague ? getLeagueName(selectedLeague) : 'All Leagues'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              buttonStyles.secondary, 
              { flex: 1, paddingVertical: spacing.sm },
              selectedTeam && { backgroundColor: colors.primary }
            ]}
            onPress={() => setShowTeamModal(true)}
          >
            <Text style={[
              buttonStyles.secondaryText,
              { fontSize: typography.size.sm },
              selectedTeam && { color: colors.text.inverse }
            ]}>
              {selectedTeam ? getTeamName(selectedTeam) : 'All Teams'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, padding: spacing.xl, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
          <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
            Showing {filteredGames.length} of {games.length} games
          </Text>
          {(selectedLeague || selectedTeam || searchText.trim()) && (
            <Text style={[textStyles.caption, { color: colors.primary }]}>
              Filtered
            </Text>
          )}
        </View>

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

      {/* Filter Modals */}
      <LeagueModal />
      <TeamModal />
    </View>
  );
};

export default AdminSchedulesScreen;