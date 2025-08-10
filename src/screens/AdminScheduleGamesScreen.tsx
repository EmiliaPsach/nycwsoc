// screens/AdminScheduleGamesScreen.tsx
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
import { GameScheduler } from '../services/GameScheduler';
import { calculateGameDates } from '../utils/dateUtils';
import { League, Team, Game, ScheduleGame } from '../types';
import {
  globalStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  formStyles,
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

const AdminScheduleGamesScreen: React.FC<Props> = ({ route, navigation }) => {
  const { leagueId } = route.params;
  const { user } = useAuth();
  const [league, setLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [schedulePreview, setSchedulePreview] = useState<ScheduleGame[]>([]);
  const [scheduleStats, setScheduleStats] = useState<any>(null);
  
  // Schedule configuration
  const [availableFields, setAvailableFields] = useState('2');
  const [seasonWeeks, setSeasonWeeks] = useState('12');
  const [gameStartTimes, setGameStartTimes] = useState(['8:30 PM']);
  const [newStartTime, setNewStartTime] = useState('');
  
  const dataStore = new DataStore();

  useEffect(() => {
    loadData();
  }, [leagueId]);

  const loadData = async () => {
    try {
      const [leagueData, leagueTeams] = await Promise.all([
        dataStore.getLeague(leagueId),
        dataStore.getTeamsByLeague(leagueId)
      ]);
      
      setLeague(leagueData);
      setTeams(leagueTeams);
      
        // Pre-populate with existing league settings
        if (leagueData) {
            if (leagueData.availableFields) {
                setAvailableFields(leagueData.availableFields.toString());
            }
            if (leagueData.seasonWeeks) {
                setSeasonWeeks(leagueData.seasonWeeks.toString());
            }
            if (leagueData.gameStartTimes && leagueData.gameStartTimes.length > 0) {
                setGameStartTimes(leagueData.gameStartTimes);
            } else if (leagueData.time) {
                setGameStartTimes([leagueData.time]);
            }
        }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load league data');
    } finally {
      setLoading(false);
    }
  };

  const addStartTime = () => {
    if (newStartTime.trim() && !gameStartTimes.includes(newStartTime.trim())) {
      setGameStartTimes([...gameStartTimes, newStartTime.trim()]);
      setNewStartTime('');
    }
  };

  const removeStartTime = (timeToRemove: string) => {
    if (gameStartTimes.length > 1) {
      setGameStartTimes(gameStartTimes.filter(time => time !== timeToRemove));
    } else {
      Alert.alert('Error', 'At least one start time is required');
    }
  };

  const generateSchedulePreview = () => {
    if (!league || teams.length < 2) {
      Alert.alert('Error', 'Need at least 2 teams to generate schedule');
      return;
    }

    const updatedLeague = {
      ...league,
      availableFields: parseInt(availableFields) || 1,
      seasonWeeks: parseInt(seasonWeeks) || 12,
      gameStartTimes
    };

    const scheduler = new GameScheduler(updatedLeague, teams);
    const schedule = scheduler.generateSeasonSchedule();
    const stats = scheduler.getScheduleStats(schedule);

    setSchedulePreview(schedule);
    setScheduleStats(stats);
    setShowPreview(true);
  };

  const confirmAndCreateGames = async () => {
    if (!league || schedulePreview.length === 0) return;

    setScheduling(true);
    try {
      // Update league with scheduling settings
      const updatedLeague = {
        ...league,
        availableFields: parseInt(availableFields) || 1,
        seasonWeeks: parseInt(seasonWeeks) || 12,
        gameStartTimes
      };
      
      await dataStore.updateLeague(updatedLeague);

      // Generate game dates
      const gameDates = calculateGameDates(updatedLeague, schedulePreview);
      const dateMap = new Map(gameDates.map(gd => [gd.gameId, { date: gd.date, time: gd.time }]));

      // Create games
      const games: Game[] = schedulePreview.map(scheduleGame => {
        const gameId = `${scheduleGame.homeTeamId}_${scheduleGame.awayTeamId}_w${scheduleGame.week}`;
        const dateInfo = dateMap.get(gameId);
        
        return {
          id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          homeTeam: scheduleGame.homeTeamId,
          awayTeam: scheduleGame.awayTeamId,
          leagueId: league.id,
          week: scheduleGame.week,
          date: dateInfo?.date || new Date().toISOString().split('T')[0],
          time: scheduleGame.startTime,
          location: `${league.location} - Field ${scheduleGame.fieldNumber || 1}`,
          status: 'Scheduled' as const,
          homeScore: undefined,
          awayScore: undefined,
          createdAt: new Date().toISOString()
        };
      });

      // Save all games
      await Promise.all(games.map(game => dataStore.createGame(game)));

      Alert.alert(
        'Success!', 
        `Created ${games.length} games for ${league.name}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating games:', error);
      Alert.alert('Error', 'Failed to create games. Please try again.');
    } finally {
      setScheduling(false);
      setShowPreview(false);
    }
  };

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading...</Text>
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

  const fieldsNum = parseInt(availableFields) || 1;
  const gamesPerWeek = fieldsNum * gameStartTimes.length;
  const maxTeamsPerWeek = gamesPerWeek * 2;
  const willHaveByeWeeks = teams.length > maxTeamsPerWeek;

  return (
    <View style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
      <View style={headerStyles.header}>
        <Text style={headerStyles.headerTitle}>Schedule Games</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={{ flex: 1, padding: spacing.xl }}>
        <View style={cardStyles.card}>
          <Text style={textStyles.title}>{league.name}</Text>
          <Text style={[textStyles.body, { color: colors.text.secondary }]}>
            {teams.length} teams • {league.dayOfWeek}s at {league.location}
          </Text>
        </View>

        {/* Configuration */}
        <View style={[cardStyles.card, { marginTop: spacing.lg }]}>
          <Text style={[textStyles.subtitle, { marginBottom: spacing.md }]}>Schedule Configuration</Text>
          
          <View style={formStyles.inputContainer}>
            <Text style={formStyles.label}>Available Fields</Text>
            <TextInput
              style={formStyles.input}
              value={availableFields}
              onChangeText={setAvailableFields}
              keyboardType="numeric"
              placeholder="Number of fields"
            />
          </View>

          <View style={formStyles.inputContainer}>
            <Text style={formStyles.label}>Season Length (Weeks)</Text>
            <TextInput
              style={formStyles.input}
              value={seasonWeeks}
              onChangeText={setSeasonWeeks}
              keyboardType="numeric"
              placeholder="Number of weeks"
            />
          </View>

          <View style={formStyles.inputContainer}>
            <Text style={formStyles.label}>Game Start Times</Text>
            {gameStartTimes.map((time, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Text style={[textStyles.body, { flex: 1, padding: spacing.sm, backgroundColor: colors.background.card, borderRadius: 8 }]}>
                  {time}
                </Text>
                {gameStartTimes.length > 1 && (
                  <TouchableOpacity 
                    onPress={() => removeStartTime(time)}
                    style={{ marginLeft: spacing.sm, padding: spacing.sm }}
                  >
                    <Text style={{ color: colors.danger, fontSize: typography.size.lg }}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            <View style={{ flexDirection: 'row', marginTop: spacing.sm }}>
              <TextInput
                style={[formStyles.input, { flex: 1, marginRight: spacing.sm }]}
                value={newStartTime}
                onChangeText={setNewStartTime}
                placeholder="e.g., 9:15 PM"
              />
              <TouchableOpacity 
                style={[buttonStyles.secondary, { paddingHorizontal: spacing.md }]}
                onPress={addStartTime}
              >
                <Text style={buttonStyles.secondaryText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Schedule Preview Info */}
        <View style={[cardStyles.card, { marginTop: spacing.lg }]}>
          <Text style={[textStyles.subtitle, { marginBottom: spacing.md }]}>Schedule Preview</Text>
          
          <Text style={textStyles.body}>
            • {gamesPerWeek} games per week ({fieldsNum} fields × {gameStartTimes.length} time slots)
          </Text>
          <Text style={textStyles.body}>
            • Up to {maxTeamsPerWeek} teams can play each week
          </Text>
          
          {willHaveByeWeeks ? (
            <Text style={[textStyles.body, { color: colors.warning }]}>
              • Some teams will have bye weeks (not all teams can play every week)
            </Text>
          ) : (
            <Text style={[textStyles.body, { color: colors.status.completed }]}>
              • All teams can potentially play every week
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[buttonStyles.secondary, { marginTop: spacing.xl }]}
          onPress={generateSchedulePreview}
        >
          <Text style={buttonStyles.secondaryText}>Preview Schedule</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Schedule Preview Modal */}
      <Modal visible={showPreview} animationType="slide">
        <View style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
          <View style={headerStyles.header}>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <Text style={[buttonStyles.secondaryText, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={headerStyles.headerTitle}>Schedule Preview</Text>
            <TouchableOpacity 
              onPress={confirmAndCreateGames}
              disabled={scheduling}
            >
              <Text style={[buttonStyles.secondaryText, { color: colors.primary }]}>
                {scheduling ? 'Creating...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, padding: spacing.xl }}>
            {scheduleStats && (
              <View style={[cardStyles.card, { marginBottom: spacing.lg }]}>
                <Text style={[textStyles.subtitle, { marginBottom: spacing.md }]}>Statistics</Text>
                <Text style={textStyles.body}>Total Games: {scheduleStats.totalGames}</Text>
                
                <Text style={[textStyles.body, { marginTop: spacing.sm, fontWeight: typography.weight.semiBold }]}>
                  Games per Team:
                </Text>
                {Object.entries(scheduleStats.gamesPerTeam).map(([teamId, count]) => {
                  const team = teams.find(t => t.id === teamId);
                  return (
                    <Text key={teamId} style={[textStyles.caption, { marginLeft: spacing.md }]}>
                      {team?.name}: {count} games, {scheduleStats.byeWeeksPerTeam[teamId]} bye weeks
                    </Text>
                  );
                })}
              </View>
            )}

            {/* Week by week schedule */}
            {Array.from(new Set(schedulePreview.map(g => g.week))).sort((a, b) => a - b).map(week => (
              <View key={week} style={[cardStyles.card, { marginBottom: spacing.md }]}>
                <Text style={[textStyles.subtitle, { marginBottom: spacing.sm }]}>Week {week}</Text>
                
                {schedulePreview
                  .filter(game => game.week === week)
                  .map((game, index) => {
                    const homeTeam = teams.find(t => t.id === game.homeTeamId);
                    const awayTeam = teams.find(t => t.id === game.awayTeamId);
                    
                    return (
                      <View key={index} style={{ 
                        flexDirection: 'row', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        paddingVertical: spacing.sm,
                        borderBottomWidth: index < schedulePreview.filter(g => g.week === week).length - 1 ? 1 : 0,
                        borderBottomColor: colors.border.dark
                      }}>
                        <Text style={[textStyles.body, { flex: 1 }]}>
                          {homeTeam?.name} vs {awayTeam?.name}
                        </Text>
                        <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                          Field {game.fieldNumber} • {game.startTime}
                        </Text>
                      </View>
                    );
                  })}
                
                {/* Show teams with bye weeks */}
                {(() => {
                  const playingTeamIds = new Set(
                    schedulePreview
                      .filter(g => g.week === week)
                      .flatMap(g => [g.homeTeamId, g.awayTeamId])
                  );
                  const byeTeams = teams.filter(t => !playingTeamIds.has(t.id));
                  
                  if (byeTeams.length > 0) {
                    return (
                      <Text style={[textStyles.caption, { color: colors.text.secondary, fontStyle: 'italic', marginTop: spacing.sm }]}>
                        Bye: {byeTeams.map(t => t.name).join(', ')}
                      </Text>
                    );
                  }
                  return null;
                })()}
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

export default AdminScheduleGamesScreen;