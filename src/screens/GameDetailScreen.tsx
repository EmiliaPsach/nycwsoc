import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Share,
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { Game, Team, User, Poll, League } from '../types';
import AttendanceReminderPanel from './AttendanceReminderPanel';
import {
  globalStyles,
  cardStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  statusStyles,
  pollStyles,
  gameDetailStyles,
  formStyles,
  colors,
  spacing,
  typography,
  borderRadius,
  screenConfig
} from '../styles';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    date: '',
    time: '',
    location: '',
    homeScore: '',
    awayScore: '',
    status: 'Scheduled' as Game['status']
  });
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
      
      // Initialize edit form with current game data
      setEditForm({
        date: gameData.date,
        time: gameData.time,
        location: gameData.location,
        homeScore: gameData.homeScore?.toString() || '',
        awayScore: gameData.awayScore?.toString() || '',
        status: gameData.status
      });
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
      case 'Scheduled': return colors.status.scheduled;
      case 'In Progress': return colors.status.inProgress;
      case 'Completed': return colors.status.completed;
      case 'Cancelled': return colors.status.cancelled;
      default: return colors.text.secondary;
    }
  };

  const handleEditGame = async () => {
    if (!game) return;
    
    try {
      const updatedGame: Game = {
        ...game,
        date: editForm.date,
        time: editForm.time,
        location: editForm.location,
        homeScore: editForm.homeScore ? parseInt(editForm.homeScore) : undefined,
        awayScore: editForm.awayScore ? parseInt(editForm.awayScore) : undefined,
        status: editForm.status
      };
      
      await dataStore.updateGame(updatedGame);
      setGame(updatedGame);
      setShowEditModal(false);
      Alert.alert('Success', 'Game updated successfully');
    } catch (error) {
      console.error('Error updating game:', error);
      Alert.alert('Error', 'Failed to update game. Please try again.');
    }
  };

  const openEditModal = () => {
    if (!game) return;
    setEditForm({
      date: game.date,
      time: game.time,
      location: game.location,
      homeScore: game.homeScore?.toString() || '',
      awayScore: game.awayScore?.toString() || '',
      status: game.status
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading game details...</Text>
      </View>
    );
  }

  if (!game || !homeTeam || !awayTeam) {
    return (
      <View style={globalStyles.errorContainer}>
        <Text style={globalStyles.errorText}>Game not found</Text>
        <TouchableOpacity
          style={buttonStyles.primary}
          onPress={() => navigation.goBack()}
        >
          <Text style={buttonStyles.primaryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const userResponse = getUserResponse();
  const pollStats = getPollStats();
  const isUserTeamGame = Boolean(userTeamId);
  const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');

  return (
    <ScrollView
      style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Game Header */}
      <View style={gameDetailStyles.gameHeader}>
        <View style={gameDetailStyles.statusContainer}>
          <View style={[statusStyles.badge, { backgroundColor: getStatusColor(game.status) }]}>
            <Text style={statusStyles.badgeText}>{game.status}</Text>
          </View>
          <Text style={gameDetailStyles.weekText}>Week {game.week}</Text>
        </View>
        
        <View style={gameDetailStyles.matchup}>
          <View style={gameDetailStyles.teamContainer}>
            <Text style={[gameDetailStyles.teamName, game.homeTeam === userTeamId && gameDetailStyles.userTeamName]}>
              {homeTeam.name}
            </Text>
            <Text style={gameDetailStyles.teamLabel}>HOME</Text>
          </View>
          
          <View style={gameDetailStyles.scoreSection}>
            {game.homeScore !== undefined && game.awayScore !== undefined ? (
              <Text style={gameDetailStyles.finalScore}>
                {game.homeScore} - {game.awayScore}
              </Text>
            ) : (
              <Text style={gameDetailStyles.vsText}>VS</Text>
            )}
          </View>
          
          <View style={gameDetailStyles.teamContainer}>
            <Text style={[gameDetailStyles.teamName, game.awayTeam === userTeamId && gameDetailStyles.userTeamName]}>
              {awayTeam.name}
            </Text>
            <Text style={gameDetailStyles.teamLabel}>AWAY</Text>
          </View>
        </View>
      </View>

      {/* Game Information */}
      <View style={gameDetailStyles.section}>
        <Text style={gameDetailStyles.sectionTitle}>Game Information</Text>
        
        <View style={gameDetailStyles.infoGrid}>
          <View style={gameDetailStyles.infoItem}>
            <Text style={gameDetailStyles.infoLabel}>📅 Date & Time</Text>
            <Text style={gameDetailStyles.infoValue}>
              {formatDateTime(game.date, game.time)}
            </Text>
          </View>
          
          <View style={gameDetailStyles.infoItem}>
            <Text style={gameDetailStyles.infoLabel}>📍 Location</Text>
            <Text style={gameDetailStyles.infoValue}>{game.location}</Text>
          </View>
          
          <View style={gameDetailStyles.infoItem}>
            <Text style={gameDetailStyles.infoLabel}>🏆 League</Text>
            <Text style={gameDetailStyles.infoValue}>{league?.name || 'Unknown League'}</Text>
          </View>
          
          <View style={gameDetailStyles.infoItem}>
            <Text style={gameDetailStyles.infoLabel}>⚽ Week</Text>
            <Text style={gameDetailStyles.infoValue}>Week {game.week}</Text>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <TouchableOpacity style={[gameDetailStyles.shareButton, { flex: 1 }]} onPress={handleShare}>
            <Text style={gameDetailStyles.shareButtonText}>📤 Share Game</Text>
          </TouchableOpacity>
          
          {isAdmin && (
            <TouchableOpacity 
              style={[gameDetailStyles.shareButton, { flex: 1, backgroundColor: colors.primary }]} 
              onPress={openEditModal}
            >
              <Text style={[gameDetailStyles.shareButtonText, { color: colors.text.inverse }]}>✏️ Edit Game</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Attendance Poll - Only show for user's team games */}
      {isUserTeamGame && (
        <View style={{backgroundColor: colors.background.card, marginBottom: spacing.xl, padding: spacing.xl}}>
          <Text style={[textStyles.title, {fontSize: typography.size.xl, marginBottom: spacing.lg}]}>Attendance Poll</Text>
          
          {game.status === 'Scheduled' ? (
            <>
              <Text style={pollStyles.pollQuestion}>
                Will you be attending this game?
              </Text>
              
              <View style={pollStyles.pollOptions}>
                {['Yes', 'No', 'Maybe'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      pollStyles.pollOption,
                      userResponse === option && pollStyles.selectedPollOption,
                    ]}
                    onPress={() => handlePollResponse(option as 'Yes' | 'No' | 'Maybe')}
                  >
                    <Text style={[
                      pollStyles.pollOptionText,
                      userResponse === option && pollStyles.selectedPollOptionText,
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {userResponse && (
                <Text style={pollStyles.responseConfirmation}>
                  ✓ Your response: {userResponse}
                </Text>
              )}
            </>
          ) : (
            <Text style={pollStyles.pollClosed}>
              Attendance polling is closed for this game.
            </Text>
          )}
          
          {/* Poll Results */}
          <View style={pollStyles.pollResults}>
            <Text style={pollStyles.pollResultsTitle}>Team Response Summary</Text>
            
            <View style={pollStyles.pollStatsGrid}>
              <View style={pollStyles.pollStat}>
                <Text style={[pollStyles.pollStatNumber, { color: '#34C759' }]}>
                  {pollStats.yes}
                </Text>
                <Text style={pollStyles.pollStatLabel}>Yes</Text>
              </View>
              
              <View style={pollStyles.pollStat}>
                <Text style={[pollStyles.pollStatNumber, { color: '#FF9500' }]}>
                  {pollStats.maybe}
                </Text>
                <Text style={pollStyles.pollStatLabel}>Maybe</Text>
              </View>
              
              <View style={pollStyles.pollStat}>
                <Text style={[pollStyles.pollStatNumber, { color: '#FF3B30' }]}>
                  {pollStats.no}
                </Text>
                <Text style={pollStyles.pollStatLabel}>No</Text>
              </View>
              
              <View style={pollStyles.pollStat}>
                <Text style={[pollStyles.pollStatNumber, { color: '#666' }]}>
                  {pollStats.total - pollStats.yes - pollStats.no - pollStats.maybe}
                </Text>
                <Text style={pollStyles.pollStatLabel}>No Response</Text>
              </View>
            </View>
            
            <View style={pollStyles.pollProgress}>
              <View style={pollStyles.progressBar}>
                <View 
                  style={[
                    pollStyles.progressFill,
                    { 
                      width: `${(pollStats.yes + pollStats.maybe + pollStats.no) / pollStats.total * 100}%`,
                      backgroundColor: '#007AFF'
                    }
                  ]}
                />
              </View>
              <Text style={pollStyles.progressText}>
                {pollStats.yes + pollStats.maybe + pollStats.no} of {pollStats.total} responded
              </Text>
            </View>
          </View>
          {/* Detailed Responses */}
          <View style={{ marginTop: 16 }}>
            <Text style={[pollStyles.pollResultsTitle, { marginBottom: 8 }]}>
              Detailed Responses
            </Text>

            {teamPlayers.length === 0 && <Text>No players found.</Text>}

            {teamPlayers.map(player => {
              const response = poll?.responses[player.id] || 'No Response';
              let color = '#666'; // default gray for no response

              if (response === 'Yes') color = '#34C759';
              else if (response === 'Maybe') color = '#FF9500';
              else if (response === 'No') color = '#FF3B30';

              return (
                <View key={player.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ fontWeight: '600' }}>{player.name}</Text>
                  <Text style={{ color, fontWeight: '700' }}>{response}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Attendance Reminder Panel */}
      {game && userTeamId && (userTeamId === homeTeam?.id || userTeamId === awayTeam?.id) && (
        <AttendanceReminderPanel
          game={game}
          team={userTeamId === homeTeam?.id ? homeTeam : awayTeam!}
          poll={poll}
          teamPlayers={teamPlayers}
          userTeamId={userTeamId}
          onReminderSent={() => {
            // Optionally refresh data after reminder is sent
            loadData();
          }}
        />
      )}

      {/* Quick Actions */}
      <View style={{backgroundColor: colors.background.card, marginBottom: spacing.xl, padding: spacing.xl}}>
        <Text style={[textStyles.title, {fontSize: typography.size.xl, marginBottom: spacing.lg}]}>Quick Actions</Text>
        
        {/* Only show the user's team (either home or away) */}
        {userTeamId === homeTeam?.id && (
          <TouchableOpacity 
            style={gameDetailStyles.actionButton}
            onPress={() => navigation.navigate('TeamDetail', { teamId: homeTeam.id })}
          >
            <Text style={gameDetailStyles.actionButtonText}>View {homeTeam.name}</Text>
          </TouchableOpacity>
        )}
        
        {userTeamId === awayTeam?.id && (
          <TouchableOpacity 
            style={gameDetailStyles.actionButton}
            onPress={() => navigation.navigate('TeamDetail', { teamId: awayTeam.id })}
          >
            <Text style={gameDetailStyles.actionButtonText}>View {awayTeam.name}</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={gameDetailStyles.actionButton}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Schedule' })}
        >
          <Text style={gameDetailStyles.actionButtonText}>View Full Schedule</Text>
        </TouchableOpacity>
      </View>
      
      {/* Admin Edit Modal */}
      {isAdmin && (
        <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
          <View style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
            <View style={headerStyles.header}>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={[textStyles.body, { color: colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={headerStyles.headerTitle}>Edit Game</Text>
              <TouchableOpacity onPress={handleEditGame}>
                <Text style={[textStyles.body, { color: colors.primary, fontWeight: typography.weight.semiBold }]}>Save</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ flex: 1, padding: spacing.xl }}>
              <View style={cardStyles.card}>
                <Text style={[textStyles.subtitle, { marginBottom: spacing.lg }]}>Game Details</Text>
                
                <View style={formStyles.inputContainer}>
                  <Text style={formStyles.label}>Date</Text>
                  <TextInput
                    style={formStyles.input}
                    value={editForm.date}
                    onChangeText={(text) => setEditForm({ ...editForm, date: text })}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                
                <View style={formStyles.inputContainer}>
                  <Text style={formStyles.label}>Time</Text>
                  <TextInput
                    style={formStyles.input}
                    value={editForm.time}
                    onChangeText={(text) => setEditForm({ ...editForm, time: text })}
                    placeholder="8:00 PM"
                  />
                </View>
                
                <View style={formStyles.inputContainer}>
                  <Text style={formStyles.label}>Location</Text>
                  <TextInput
                    style={formStyles.input}
                    value={editForm.location}
                    onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                    placeholder="Field location"
                  />
                </View>
                
                <View style={formStyles.inputContainer}>
                  <Text style={formStyles.label}>Status</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {(['Scheduled', 'In Progress', 'Completed', 'Cancelled'] as Game['status'][]).map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          buttonStyles.secondary,
                          { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
                          editForm.status === status && { backgroundColor: colors.primary }
                        ]}
                        onPress={() => setEditForm({ ...editForm, status })}
                      >
                        <Text style={[
                          buttonStyles.secondaryText,
                          editForm.status === status && { color: colors.text.inverse }
                        ]}>
                          {status}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {editForm.status === 'Completed' && (
                  <>
                    <View style={formStyles.inputContainer}>
                      <Text style={formStyles.label}>Home Score ({homeTeam?.name})</Text>
                      <TextInput
                        style={formStyles.input}
                        value={editForm.homeScore}
                        onChangeText={(text) => setEditForm({ ...editForm, homeScore: text })}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                    
                    <View style={formStyles.inputContainer}>
                      <Text style={formStyles.label}>Away Score ({awayTeam?.name})</Text>
                      <TextInput
                        style={formStyles.input}
                        value={editForm.awayScore}
                        onChangeText={(text) => setEditForm({ ...editForm, awayScore: text })}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

export default GameDetailScreen;