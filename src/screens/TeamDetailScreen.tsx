import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { Team, User, Game, League } from '../types';

const TeamDetailScreen = ({ route, navigation }: any) => {
  const { teamId } = route.params;
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<User[]>([]);
  const [captain, setCaptain] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dataStore = new DataStore();

  const loadData = async () => {
    try {
      const teamData = await dataStore.getTeam(teamId);
      if (!teamData) {
        Alert.alert('Error', 'Team not found');
        navigation.goBack();
        return;
      }

      const teamPlayers = await dataStore.getPlayersInTeam(teamId);
      const captainData = await dataStore.getUser(teamData.captain);
      const teamGames = await dataStore.getGamesForTeam(teamId);
      const leagueData = await dataStore.getLeague(teamData.leagueId);

      setTeam(teamData);
      setPlayers(teamPlayers);
      setCaptain(captainData);
      setGames(teamGames.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setLeague(leagueData);
    } catch (error) {
      console.error('Error loading team data:', error);
      Alert.alert('Error', 'Failed to load team data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [teamId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleShare = async () => {
    if (!team) return;
    
    try {
      await Share.share({
        message: `Join my soccer team "${team.name}"! We play ${league?.dayOfWeek}s at ${league?.time} in ${league?.location}. 🥅⚽`,
        title: `Join ${team.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getPlayerRole = (playerId: string) => {
    if (playerId === team?.captain) return 'Captain';
    return 'Player';
  };

  const getGameStats = () => {
    const played = games.filter(g => g.status === 'Completed').length;
    const won = games.filter(g => {
      if (g.status !== 'Completed' || g.homeScore === undefined || g.awayScore === undefined) return false;
      
      if (g.homeTeam === teamId) {
        return g.homeScore > g.awayScore;
      } else {
        return g.awayScore > g.homeScore;
      }
    }).length;
    
    const lost = played - won;
    
    return { played, won, lost };
  };

  const formatGameResult = (game: Game) => {
    if (game.status !== 'Completed' || game.homeScore === undefined || game.awayScore === undefined) {
      return '';
    }
    
    const isHome = game.homeTeam === teamId;
    const teamScore = isHome ? game.homeScore : game.awayScore;
    const opponentScore = isHome ? game.awayScore : game.homeScore;
    
    if (teamScore > opponentScore) return 'W';
    if (teamScore < opponentScore) return 'L';
    return 'T';
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'W': return '#34C759';
      case 'L': return '#FF3B30';
      case 'T': return '#FF9500';
      default: return '#666';
    }
  };

  const PlayerCard = ({ player }: { player: User }) => {
    const isCurrentUser = player.id === user?.id;
    const role = getPlayerRole(player.id);
    
    return (
      <View style={[styles.playerCard, isCurrentUser && styles.currentUserCard]}>
        <View style={styles.playerAvatar}>
          <Text style={styles.playerAvatarText}>
            {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.playerInfo}>
          <View style={styles.playerNameRow}>
            <Text style={styles.playerName}>
              {player.name} {isCurrentUser && '(You)'}
            </Text>
            {role === 'Captain' && (
              <View style={styles.captainBadge}>
                <Text style={styles.captainBadgeText}>👑 Captain</Text>
              </View>
            )}
          </View>
          
          <View style={styles.playerDetails}>
            {player.skillLevel && (
              <Text style={styles.playerDetail}>{player.skillLevel}</Text>
            )}
            {player.jerseySize && (
              <Text style={styles.playerDetail}>• {player.jerseySize}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const GameCard = ({ game }: { game: Game }) => {
    const [opponentName, setOpponentName] = useState('');
    
    useEffect(() => {
      const loadOpponentName = async () => {
        const opponentId = game.homeTeam === teamId ? game.awayTeam : game.homeTeam;
        const opponent = await dataStore.getTeam(opponentId);
        setOpponentName(opponent?.name || 'Unknown Team');
      };
      loadOpponentName();
    }, [game]);
    
    const isHome = game.homeTeam === teamId;
    const result = formatGameResult(game);
    const resultColor = getResultColor(result);
    
    return (
      <TouchableOpacity 
        style={styles.gameCard}
        onPress={() => navigation.navigate('GameDetail', { gameId: game.id, teamId })}
      >
        <View style={styles.gameHeader}>
          <View style={styles.gameInfo}>
            <Text style={styles.gameDate}>
              {new Date(game.date).toLocaleDateString()}
            </Text>
            <Text style={styles.gameLocation}>{game.location}</Text>
          </View>
          
          {result && (
            <View style={[styles.resultBadge, { backgroundColor: resultColor }]}>
              <Text style={styles.resultText}>{result}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.gameMatchup}>
          <Text style={styles.teamName}>
            {isHome ? team?.name : opponentName}
          </Text>
          
          <View style={styles.scoreContainer}>
            {game.homeScore !== undefined && game.awayScore !== undefined ? (
              <Text style={styles.score}>
                {isHome ? game.homeScore : game.awayScore} - {isHome ? game.awayScore : game.homeScore}
              </Text>
            ) : (
              <Text style={styles.vsText}>vs</Text>
            )}
          </View>
          
          <Text style={styles.teamName}>
            {isHome ? opponentName : team?.name}
          </Text>
        </View>
        
        <Text style={styles.gameTime}>
          {game.time} • Week {game.week}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading team details...</Text>
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Team not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = getGameStats();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Team Header */}
      <View style={styles.teamHeader}>
        <View style={styles.teamInfo}>
          <Text style={styles.teamName}>{team.name}</Text>
          {team.description && (
            <Text style={styles.teamDescription}>{team.description}</Text>
          )}
          
          <View style={styles.teamMeta}>
            <Text style={styles.metaItem}>
              📍 {league?.location || 'Unknown Location'}
            </Text>
            <Text style={styles.metaItem}>
              🗓️ {league?.dayOfWeek}s at {league?.time}
            </Text>
            <Text style={styles.metaItem}>
              ⚽ {league?.season || 'Unknown Season'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share Team</Text>
        </TouchableOpacity>
      </View>

      {/* Team Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{players.length}</Text>
          <Text style={styles.statLabel}>Players</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.played}</Text>
          <Text style={styles.statLabel}>Played</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.won}</Text>
          <Text style={styles.statLabel}>Won</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.lost}</Text>
          <Text style={styles.statLabel}>Lost</Text>
        </View>
      </View>

      {/* Team Roster */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Team Roster ({players.length})</Text>
        </View>
        
        {players.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No players found</Text>
          </View>
        ) : (
          players.map(player => (
            <PlayerCard key={player.id} player={player} />
          ))
        )}
      </View>

      {/* Recent Games */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Games</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {games.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No games scheduled</Text>
          </View>
        ) : (
          games.slice(0, 5).map(game => (
            <GameCard key={game.id} game={game} />
          ))
        )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  teamHeader: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
  },
  teamInfo: {
    marginBottom: 16,
  },
  teamName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  teamDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  teamMeta: {
    gap: 4,
  },
  metaItem: {
    fontSize: 14,
    color: '#666',
  },
  shareButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  playerCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  captainBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#FFD700',
  },
  captainBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B8860B',
  },
  playerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerDetail: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  gameCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameInfo: {
    flex: 1,
  },
  gameDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  gameLocation: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  resultBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  gameMatchup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  scoreContainer: {
    marginHorizontal: 12,
  },
  score: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  vsText: {
    fontSize: 12,
    color: '#666',
  },
  gameTime: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default TeamDetailScreen;