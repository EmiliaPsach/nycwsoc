import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { Game, Team } from '../types';

const { width } = Dimensions.get('window');

const ScheduleScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const dataStore = new DataStore();

  const loadData = async () => {
    if (!user) return;

    try {
      const userGames = await dataStore.getGamesForUser(user.id);
      const userTeams = await dataStore.getTeamsForUser(user.id);
      
      // Sort games by date
      const sortedGames = userGames.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setGames(sortedGames);
      setTeams(userTeams);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load schedule data');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return '#007AFF';
      case 'In Progress': return '#FF9500';
      case 'Completed': return '#34C759';
      case 'Cancelled': return '#FF3B30';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Scheduled': return '📅';
      case 'In Progress': return '⚽';
      case 'Completed': return '✅';
      case 'Cancelled': return '❌';
      default: return '📅';
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
        <View style={styles.gameHeader}>
          <View style={styles.gameStatus}>
            <Text style={styles.statusIcon}>{getStatusIcon(game.status)}</Text>
            <Text style={[styles.statusText, { color: getStatusColor(game.status) }]}>
              {game.status}
            </Text>
          </View>
          <Text style={styles.gameWeek}>Week {game.week}</Text>
        </View>

        <View style={styles.gameInfo}>
          <View style={styles.teamsContainer}>
            <Text style={[styles.teamName, isUserTeam(game.homeTeam) && styles.userTeam]}>
              {homeTeamName}
            </Text>
            <View style={styles.scoreContainer}>
              {game.homeScore !== undefined && game.awayScore !== undefined ? (
                <Text style={styles.score}>
                  {game.homeScore} - {game.awayScore}
                </Text>
              ) : (
                <Text style={styles.vs}>vs</Text>
              )}
            </View>
            <Text style={[styles.teamName, isUserTeam(game.awayTeam) && styles.userTeam]}>
              {awayTeamName}
            </Text>
          </View>
          
          <Text style={styles.gameTime}>{formatGameDate(game.date, game.time)}</Text>
          <Text style={styles.gameLocation}>📍 {game.location}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGamesByDate = () => {
    const gamesByDate = games.reduce((acc, game) => {
      const dateKey = new Date(game.date).toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(game);
      return acc;
    }, {} as { [key: string]: Game[] });

    return Object.keys(gamesByDate).map(dateKey => {
      const date = new Date(dateKey);
      const dateGames = gamesByDate[dateKey];
      
      return (
        <View key={dateKey} style={styles.dateSection}>
          <Text style={styles.dateHeader}>
            {date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          {dateGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </View>
      );
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Schedule</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{games.length}</Text>
            <Text style={styles.statLabel}>Total Games</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {games.filter(g => g.status === 'Scheduled').length}
            </Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {games.filter(g => g.status === 'Completed').length}
            </Text>
            <Text style={styles.statLabel}>Played</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {games.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No Games Scheduled</Text>
            <Text style={styles.emptyText}>
              Join a league to start playing games!
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Leagues')}
            >
              <Text style={styles.emptyButtonText}>Join a League</Text>
            </TouchableOpacity>
          </View>
        ) : (
          renderGamesByDate()
        )}
      </ScrollView>
    </View>
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
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  dateSection: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 10,
    marginTop: 10,
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
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 6,
    fontSize: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  gameWeek: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
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
  scoreContainer: {
    marginHorizontal: 10,
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  vs: {
    fontSize: 14,
    color: '#666',
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
  emptyState: {
    alignItems: 'center',
    padding: 60,
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ScheduleScreen;