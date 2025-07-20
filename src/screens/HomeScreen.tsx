import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { Team, Game, League } from '../types';

const HomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dataStore = new DataStore();

  const loadData = async () => {
    if (!user) return;

    try {
      // Load user's teams
      const userTeams = await dataStore.getTeamsForUser(user.id);
      setTeams(userTeams);

      // Load upcoming games
      const userGames = await dataStore.getGamesForUser(user.id);
      const upcoming = userGames
        .filter(game => {
          const gameDate = new Date(game.date);
          const today = new Date();
          return gameDate >= today && game.status !== 'Completed';
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);
      
      setUpcomingGames(upcoming);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getTeamName = async (teamId: string): Promise<string> => {
    const team = await dataStore.getTeam(teamId);
    return team?.name || 'Unknown Team';
  };

  const formatGameDate = (date: string, time: string) => {
    const gameDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (gameDate.toDateString() === today.toDateString()) {
      return `Today at ${time}`;
    } else if (gameDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${time}`;
    } else {
      return `${gameDate.toLocaleDateString()} at ${time}`;
    }
  };

  const GameCard = ({ game }: { game: Game }) => {
    const [homeTeamName, setHomeTeamName] = useState('');
    const [awayTeamName, setAwayTeamName] = useState('');

    useEffect(() => {
      const loadTeamNames = async () => {
        const homeName = await getTeamName(game.homeTeam);
        const awayName = await getTeamName(game.awayTeam);
        setHomeTeamName(homeName);
        setAwayTeamName(awayName);
      };
      loadTeamNames();
    }, [game]);

    const isUserTeam = (teamId: string) => {
      return teams.some(team => team.id === teamId);
    };

    return (
      <TouchableOpacity 
        style={styles.gameCard}
        onPress={() => navigation.navigate('GameDetail', { gameId: game.id })}
      >
        <View style={styles.gameInfo}>
          <View style={styles.teamsContainer}>
            <Text style={[styles.teamName, isUserTeam(game.homeTeam) && styles.userTeam]}>
              {homeTeamName}
            </Text>
            <Text style={styles.vs}>vs</Text>
            <Text style={[styles.teamName, isUserTeam(game.awayTeam) && styles.userTeam]}>
              {awayTeamName}
            </Text>
          </View>
          <Text style={styles.gameTime}>{formatGameDate(game.date, game.time)}</Text>
          <Text style={styles.gameLocation}>{game.location}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const TeamCard = ({ team }: { team: Team }) => (
    <TouchableOpacity 
      style={styles.teamCard}
      onPress={() => navigation.navigate('TeamDetail', { teamId: team.id })}
    >
      <Text style={styles.teamCardName}>{team.name}</Text>
      <Text style={styles.teamDescription}>{team.description}</Text>
      <View style={styles.teamStats}>
        <Text style={styles.teamStat}>{team.players.length} players</Text>
        <Text style={styles.teamStat}>•</Text>
        <Text style={styles.teamStat}>
          {team.captain === user?.id ? 'Captain' : 'Member'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.name}! ⚽</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{teams.length}</Text>
          <Text style={styles.statLabel}>Teams</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{upcomingGames.length}</Text>
          <Text style={styles.statLabel}>Upcoming Games</Text>
        </View>
      </View>

      {/* Upcoming Games */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Games</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {upcomingGames.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No upcoming games</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Leagues')}
            >
              <Text style={styles.emptyButtonText}>Join a League</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcomingGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))
        )}
      </View>

      {/* My Teams */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Teams</Text>
        </View>

        {teams.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>You're not on any teams yet</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Leagues')}
            >
              <Text style={styles.emptyButtonText}>Find a Team</Text>
            </TouchableOpacity>
          </View>
        ) : (
          teams.map(team => (
            <TeamCard key={team.id} team={team} />
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Schedule')}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>View Schedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Leagues')}
          >
            <Text style={styles.actionIcon}>⚽</Text>
            <Text style={styles.actionText}>Join League</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  welcome: {
    fontSize: 20,
    color: '#666',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginRight: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  gameCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameInfo: {
    flex: 1,
  },
  teamsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  userTeam: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  vs: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 10,
  },
  gameTime: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  gameLocation: {
    fontSize: 14,
    color: '#666',
  },
  teamCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  teamCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  teamDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  teamStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamStat: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HomeScreen;