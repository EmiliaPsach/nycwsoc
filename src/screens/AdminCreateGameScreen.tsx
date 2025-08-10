// screens/AdminCreateGameScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { Game, Team, League } from '../types';
import {
  globalStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  formStyles,
  cardStyles,
  modalStyles,
  colors,
  spacing,
  typography,
  screenConfig
} from '../styles';

interface Props {
  navigation: any;
  route: {
    params?: {
      gameId?: string;
      leagueId?: string;
    };
  };
}

const AdminCreateGameScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [showHomeTeamModal, setShowHomeTeamModal] = useState(false);
  const [showAwayTeamModal, setShowAwayTeamModal] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  const [formData, setFormData] = useState({
    leagueId: route.params?.leagueId || '',
    homeTeam: '',
    awayTeam: '',
    date: '',
    time: '',
    location: '',
    week: '1',
    homeScore: '',
    awayScore: '',
    status: 'Scheduled' as Game['status'],
  });

  const dataStore = new DataStore();

  useEffect(() => {
    loadData();
    if (route.params?.gameId) {
      loadExistingGame(route.params.gameId);
    }
  }, [route.params?.gameId]);

  const loadData = async () => {
    try {
      const [allTeams, allLeagues] = await Promise.all([
        dataStore.getAllTeams(),
        dataStore.getLeagues(),
      ]);
      
      setTeams(allTeams.filter(t => t.isActive));
      setLeagues(allLeagues.filter(l => l.isActive));
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const loadExistingGame = async (gameId: string) => {
    try {
      const game = await dataStore.getGame(gameId);
      if (game) {
        setEditingGame(game);
        setFormData({
          leagueId: game.leagueId,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          date: game.date,
          time: game.time,
          location: game.location,
          week: game.week.toString(),
          homeScore: game.homeScore?.toString() || '',
          awayScore: game.awayScore?.toString() || '',
          status: game.status,
        });
      }
    } catch (error) {
      console.error('Error loading game:', error);
      Alert.alert('Error', 'Failed to load game data');
    }
  };

  const getFilteredTeams = (excludeTeamId?: string) => {
    let filteredTeams = teams;
    
    if (formData.leagueId) {
      filteredTeams = filteredTeams.filter(team => team.leagueId === formData.leagueId);
    }
    
    if (excludeTeamId) {
      filteredTeams = filteredTeams.filter(team => team.id !== excludeTeamId);
    }
    
    return filteredTeams;
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'Select Team';
  };

  const getLeagueName = (leagueId: string) => {
    const league = leagues.find(l => l.id === leagueId);
    return league?.name || 'Select League';
  };

  const validateForm = () => {
    if (!formData.leagueId) {
      Alert.alert('Error', 'Please select a league');
      return false;
    }
    if (!formData.homeTeam) {
      Alert.alert('Error', 'Please select a home team');
      return false;
    }
    if (!formData.awayTeam) {
      Alert.alert('Error', 'Please select an away team');
      return false;
    }
    if (formData.homeTeam === formData.awayTeam) {
      Alert.alert('Error', 'Home and away teams must be different');
      return false;
    }
    if (!formData.date) {
      Alert.alert('Error', 'Please enter a date (YYYY-MM-DD format)');
      return false;
    }
    if (!formData.time) {
      Alert.alert('Error', 'Please enter a time');
      return false;
    }
    if (!formData.location) {
      Alert.alert('Error', 'Please enter a location');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const gameData: Game = {
        id: editingGame?.id || `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        leagueId: formData.leagueId,
        homeTeam: formData.homeTeam,
        awayTeam: formData.awayTeam,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        week: parseInt(formData.week) || 1,
        status: formData.status,
        createdAt: editingGame?.createdAt || new Date().toISOString(),
      };

      // Add scores if provided
      if (formData.homeScore !== '') {
        gameData.homeScore = parseInt(formData.homeScore);
      }
      if (formData.awayScore !== '') {
        gameData.awayScore = parseInt(formData.awayScore);
      }

      if (editingGame) {
        await dataStore.updateGame(gameData);
        Alert.alert('Success', 'Game updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        await dataStore.createGame(gameData);
        Alert.alert('Success', 'Game created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error saving game:', error);
      Alert.alert('Error', 'Failed to save game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const LeagueModal = () => (
    <Modal visible={showLeagueModal} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: colors.background.main }}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={() => setShowLeagueModal(false)}>
            <Text style={[textStyles.body, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={modalStyles.title}>Select League</Text>
          <TouchableOpacity onPress={() => setShowLeagueModal(false)}>
            <Text style={[textStyles.body, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={{ flex: 1, padding: spacing.xl }}>
          {leagues.map(league => (
            <TouchableOpacity 
              key={league.id}
              style={[
                cardStyles.card, 
                { backgroundColor: formData.leagueId === league.id ? colors.primary : colors.background.card }
              ]}
              onPress={() => {
                setFormData({ 
                  ...formData, 
                  leagueId: league.id,
                  homeTeam: '', // Reset team selections when league changes
                  awayTeam: ''
                });
                setShowLeagueModal(false);
              }}
            >
              <Text style={[
                textStyles.title, 
                { 
                  fontSize: typography.size.md,
                  color: formData.leagueId === league.id ? colors.text.inverse : colors.text.primary 
                }
              ]}>
                {league.name}
              </Text>
              <Text style={[
                textStyles.caption, 
                { color: formData.leagueId === league.id ? colors.text.inverse : colors.text.secondary }
              ]}>
                {league.skillLevel} • {league.dayOfWeek}s • {league.location}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  const TeamModal = ({ 
    visible, 
    onClose, 
    onSelect, 
    excludeTeamId 
  }: { 
    visible: boolean;
    onClose: () => void;
    onSelect: (teamId: string) => void;
    excludeTeamId?: string;
  }) => (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: colors.background.main }}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[textStyles.body, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={modalStyles.title}>Select Team</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[textStyles.body, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={{ flex: 1, padding: spacing.xl }}>
          {getFilteredTeams(excludeTeamId).map(team => (
            <TouchableOpacity 
              key={team.id}
              style={cardStyles.card}
              onPress={() => {
                onSelect(team.id);
                onClose();
              }}
            >
              <Text style={[textStyles.title, { fontSize: typography.size.md }]}>
                {team.name}
              </Text>
              <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                {getLeagueName(team.leagueId)} • {team.players.length} players
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  const StatusPicker = () => {
    const statuses: Game['status'][] = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];
    
    return (
      <View style={formStyles.inputContainer}>
        <Text style={formStyles.label}>Status</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {statuses.map(status => (
            <TouchableOpacity
              key={status}
              style={[
                buttonStyles.secondary,
                { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
                formData.status === status && { backgroundColor: colors.primary }
              ]}
              onPress={() => setFormData({ ...formData, status })}
            >
              <Text style={[
                buttonStyles.secondaryText,
                { fontSize: typography.size.sm },
                formData.status === status && { color: colors.text.inverse }
              ]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
      <View style={headerStyles.header}>
        <Text style={headerStyles.headerTitle}>
          {editingGame ? 'Edit Game' : 'Create Game'}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={{ flex: 1, padding: spacing.xl }}>
        {/* League Selection */}
        <View style={formStyles.inputContainer}>
          <Text style={formStyles.label}>League *</Text>
          <TouchableOpacity 
            style={[formStyles.input, { justifyContent: 'center' }]}
            onPress={() => setShowLeagueModal(true)}
          >
            <Text style={[
              textStyles.body,
              { color: formData.leagueId ? colors.text.primary : colors.text.secondary }
            ]}>
              {formData.leagueId ? getLeagueName(formData.leagueId) : 'Select League'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Team Selections */}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={[formStyles.inputContainer, { flex: 1 }]}>
            <Text style={formStyles.label}>Home Team *</Text>
            <TouchableOpacity 
              style={[formStyles.input, { justifyContent: 'center' }]}
              onPress={() => setShowHomeTeamModal(true)}
              disabled={!formData.leagueId}
            >
              <Text style={[
                textStyles.body,
                { color: formData.homeTeam ? colors.text.primary : colors.text.secondary }
              ]}>
                {formData.homeTeam ? getTeamName(formData.homeTeam) : 'Select Home Team'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[formStyles.inputContainer, { flex: 1 }]}>
            <Text style={formStyles.label}>Away Team *</Text>
            <TouchableOpacity 
              style={[formStyles.input, { justifyContent: 'center' }]}
              onPress={() => setShowAwayTeamModal(true)}
              disabled={!formData.leagueId}
            >
              <Text style={[
                textStyles.body,
                { color: formData.awayTeam ? colors.text.primary : colors.text.secondary }
              ]}>
                {formData.awayTeam ? getTeamName(formData.awayTeam) : 'Select Away Team'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date and Time */}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={[formStyles.inputContainer, { flex: 1 }]}>
            <Text style={formStyles.label}>Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={formStyles.input}
              value={formData.date}
              onChangeText={(text) => setFormData({ ...formData, date: text })}
              placeholder="2025-01-15"
            />
          </View>

          <View style={[formStyles.inputContainer, { flex: 1 }]}>
            <Text style={formStyles.label}>Time *</Text>
            <TextInput
              style={formStyles.input}
              value={formData.time}
              onChangeText={(text) => setFormData({ ...formData, time: text })}
              placeholder="8:30 PM"
            />
          </View>
        </View>

        {/* Location and Week */}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={[formStyles.inputContainer, { flex: 2 }]}>
            <Text style={formStyles.label}>Location *</Text>
            <TextInput
              style={formStyles.input}
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
              placeholder="Central Park Field 1"
            />
          </View>

          <View style={[formStyles.inputContainer, { flex: 1 }]}>
            <Text style={formStyles.label}>Week</Text>
            <TextInput
              style={formStyles.input}
              value={formData.week}
              onChangeText={(text) => setFormData({ ...formData, week: text })}
              placeholder="1"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Status */}
        <StatusPicker />

        {/* Scores (only if status is Completed) */}
        {formData.status === 'Completed' && (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={[formStyles.inputContainer, { flex: 1 }]}>
              <Text style={formStyles.label}>Home Score</Text>
              <TextInput
                style={formStyles.input}
                value={formData.homeScore}
                onChangeText={(text) => setFormData({ ...formData, homeScore: text })}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>

            <View style={[formStyles.inputContainer, { flex: 1 }]}>
              <Text style={formStyles.label}>Away Score</Text>
              <TextInput
                style={formStyles.input}
                value={formData.awayScore}
                onChangeText={(text) => setFormData({ ...formData, awayScore: text })}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[buttonStyles.primary, { marginTop: spacing.xl, marginBottom: spacing.xxl }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={buttonStyles.primaryText}>
            {loading ? 'Saving...' : (editingGame ? 'Update Game' : 'Create Game')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modals */}
      <LeagueModal />
      <TeamModal 
        visible={showHomeTeamModal}
        onClose={() => setShowHomeTeamModal(false)}
        onSelect={(teamId) => setFormData({ ...formData, homeTeam: teamId })}
        excludeTeamId={formData.awayTeam}
      />
      <TeamModal 
        visible={showAwayTeamModal}
        onClose={() => setShowAwayTeamModal(false)}
        onSelect={(teamId) => setFormData({ ...formData, awayTeam: teamId })}
        excludeTeamId={formData.homeTeam}
      />
    </View>
  );
};

export default AdminCreateGameScreen;