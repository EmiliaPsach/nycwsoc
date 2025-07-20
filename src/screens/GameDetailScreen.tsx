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
import { Game, Team, User, Poll, League } from '../types';

const GameDetailScreen = ({ route, navigation }: any) => {
  const { gameId, teamId } = route.params;
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dataStore = new DataStore();

  const loadData = async () => {
    try {
      const gameData = await dataStore.getGame(gameId);
      if (!gameData) {
        Alert.alert('Error', 'Game not found');
        navigation.goBack();
        return;
      }

      const [homeTeamData, awayTeamData] = await Promise.all([
        dataStore.getTeam(gameData.homeTeam),
        dataStore.getTeam(gameData.awayTeam),
      ]);

      const leagueData = await dataStore.getLeague(gameData.leagueId);

      // Determine which team the user is on
      let userTeam = null;
      if (user) {
        const userTeams = await dataStore.getTeamsForUser(user.id);
        userTeam = userTeams.find(t => t.id === gameData.homeTeam || t.id === gameData.awayTeam);
      }

      // Load poll data if user is on one of the teams
      let pollData = null;
      let playersData: User[] = [];
      if (userTeam) {
        pollData = await dataStore.getPoll(gameId, userTeam.id);
        playersData = await dataStore.getPlayersInTeam(userTeam.id);
      }

      setGame(gameData);
      setHomeTeam(homeTeamData);
      setAwayTeam(awayTeamData);
      setLeague(leagueData);
      setUserTeamId(userTeam?.id || null);
      setPoll(pollData);
      setTeamPlayers(playersData);
    } catch (error) {
      console.error('Error loading game data:', error);
      Alert.alert('Error', 'Failed to load game data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [gameId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleShare = async () => {
    if (!game || !homeTeam || !awayTeam) return;
    
    try {
      const message = `⚽ ${homeTeam.name} vs ${awayTeam.name}\n📅 ${new Date(game.date).toLocaleDateString()} at ${game.time}\n📍 ${game.location}\n\nCome watch the game!`;
      
      await Share.share({
        message,
        title: `${homeTeam.name} vs ${awayTeam.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handlePollResponse = async (response: 'Yes' | 'No' | 'Maybe') => {
    if (!user || !userTeamId || !game) return;

    try {
      await dataStore.updatePollResponse(game.id, userTeamId, user.id, response);
      
      // Refresh poll data
      const updatedPoll = await dataStore.getPoll(game.id, userTeamId);
      setPoll(updatedPoll);
      
      Alert.alert('Success', `Your response "${response}" has been recorded.`);
    } catch (error) {
      console.error('Error updating poll response:', error);
      Alert.alert('Error', 'Failed to update your response. Please try again.');
    }
  };

  const getUserResponse = () => {
    if (!user || !poll) return null;
    return poll.responses[user.id] || null;
  };

  const getPollStats = () => {
    if (!poll) return { yes: 0, no: 0, maybe: 0, total: 0 };
    
    const responses = Object.values(poll.responses);
    const yes = responses.filter(r => r === 'Yes').length;
    const no = responses.filter(r => r === 'No').length;
    const maybe = responses.filter(r => r === 'Maybe').length;
    const total = teamPlayers.length;
    
    return { yes, no, maybe, total };
  };

  const formatDateTime = (date: string, time: string) => {
    const gameDate = new Date(date);
    const now = new Date();
    const diffTime = gameDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let dateText = gameDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    
    if (diffDays === 0) dateText = `Today, ${dateText.split(', ')[1]}`;
    else if (diffDays === 1) dateText = `Tomorrow, ${dateText.split(', ')[1]}`;
    else if (diffDays < 0) dateText = `${Math.abs(diffDays)} days ago`;
    else if (diffDays <= 7) dateText = `In ${diffDays} days`;
    
    return `${dateText} at ${time}`;
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading game details...</Text>
      </View>
    );
  }

  if (!game || !homeTeam || !awayTeam) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Game not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const userResponse = getUserResponse();
  const pollStats = getPollStats();
  const isUserTeamGame = Boolean(userTeamId);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Game Header */}
      <View style={styles.gameHeader}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(game.status) }]}>
            <Text style={styles.statusText}>{game.status}</Text>
          </View>
          <Text style={styles.weekText}>Week {game.week}</Text>
        </View>
        
        <View style={styles.matchup}>
          <View style={styles.teamContainer}>
            <Text style={[styles.teamName, game.homeTeam === userTeamId && styles.userTeamName]}>
              {homeTeam.name}
            </Text>
            <Text style={styles.teamLabel}>HOME</Text>
          </View>
          
          <View style={styles.scoreSection}>
            {game.homeScore !== undefined && game.awayScore !== undefined ? (
              <Text style={styles.finalScore}>
                {game.homeScore} - {game.awayScore}
              </Text>
            ) : (
              <Text style={styles.vsText}>VS</Text>
            )}
          </View>
          
          <View style={styles.teamContainer}>
            <Text style={[styles.teamName, game.awayTeam === userTeamId && styles.userTeamName]}>
              {awayTeam.name}
            </Text>
            <Text style={styles.teamLabel}>AWAY</Text>
          </View>
        </View>
      </View>

      {/* Game Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Game Information</Text>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>📅 Date & Time</Text>
            <Text style={styles.infoValue}>
              {formatDateTime(game.date, game.time)}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>📍 Location</Text>
            <Text style={styles.infoValue}>{game.location}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>🏆 League</Text>
            <Text style={styles.infoValue}>{league?.name || 'Unknown League'}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>⚽ Week</Text>
            <Text style={styles.infoValue}>Week {game.week}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>📤 Share Game</Text>
        </TouchableOpacity>
      </View>

      {/* Attendance Poll - Only show for user's team games */}
      {isUserTeamGame && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Poll</Text>
          
          {game.status === 'Scheduled' ? (
            <>
              <Text style={styles.pollQuestion}>
                Will you be attending this game?
              </Text>
              
              <View style={styles.pollOptions}>
                {['Yes', 'No', 'Maybe'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.pollOption,
                      userResponse === option && styles.selectedPollOption,
                    ]}
                    onPress={() => handlePollResponse(option as 'Yes' | 'No' | 'Maybe')}
                  >
                    <Text style={[
                      styles.pollOptionText,
                      userResponse === option && styles.selectedPollOptionText,
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {userResponse && (
                <Text style={styles.responseConfirmation}>
                  ✓ Your response: {userResponse}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.pollClosed}>
              Attendance polling is closed for this game.
            </Text>
          )}
          
          {/* Poll Results */}
          <View style={styles.pollResults}>
            <Text style={styles.pollResultsTitle}>Team Response Summary</Text>
            
            <View style={styles.pollStatsGrid}>
              <View style={styles.pollStat}>
                <Text style={[styles.pollStatNumber, { color: '#34C759' }]}>
                  {pollStats.yes}
                </Text>
                <Text style={styles.pollStatLabel}>Yes</Text>
              </View>
              
              <View style={styles.pollStat}>
                <Text style={[styles.pollStatNumber, { color: '#FF9500' }]}>
                  {pollStats.maybe}
                </Text>
                <Text style={styles.pollStatLabel}>Maybe</Text>
              </View>
              
              <View style={styles.pollStat}>
                <Text style={[styles.pollStatNumber, { color: '#FF3B30' }]}>
                  {pollStats.no}
                </Text>
                <Text style={styles.pollStatLabel}>No</Text>
              </View>
              
              <View style={styles.pollStat}>
                <Text style={[styles.pollStatNumber, { color: '#666' }]}>
                  {pollStats.total - pollStats.yes - pollStats.no - pollStats.maybe}
                </Text>
                <Text style={styles.pollStatLabel}>No Response</Text>
              </View>
            </View>
            
            <View style={styles.pollProgress}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${(pollStats.yes + pollStats.maybe + pollStats.no) / pollStats.total * 100}%`,
                      backgroundColor: '#007AFF'
                    }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {pollStats.yes + pollStats.maybe + pollStats.no} of {pollStats.total} responded
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('TeamDetail', { teamId: homeTeam.id })}
        >
          <Text style={styles.actionButtonText}>View {homeTeam.name}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('TeamDetail', { teamId: awayTeam.id })}
        >
          <Text style={styles.actionButtonText}>View {awayTeam.name}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Schedule')}
        >
          <Text style={styles.actionButtonText}>View Full Schedule</Text>
        </TouchableOpacity>
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
  gameHeader: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  weekText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  matchup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  userTeamName: {
    color: '#007AFF',
  },
  teamLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  scoreSection: {
    paddingHorizontal: 20,
  },
  finalScore: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  vsText: {
    fontSize: 24,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoGrid: {
    marginBottom: 20,
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  shareButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pollQuestion: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  pollOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  pollOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedPollOption: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  pollOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedPollOptionText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  responseConfirmation: {
    fontSize: 14,
    color: '#34C759',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  pollClosed: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  pollResults: {
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    paddingTop: 20,
  },
  pollResultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  pollStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  pollStat: {
    alignItems: 'center',
  },
  pollStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pollStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  pollProgress: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e1e5e9',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default GameDetailScreen;