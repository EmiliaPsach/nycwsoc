import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
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
import {
  globalStyles,
  cardStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  colors,
  spacing,
  typography,
  statusStyles
} from '../styles';

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
      case 'Scheduled': return colors.status.scheduled;
      case 'In Progress': return colors.status.inProgress;
      case 'Completed': return colors.status.completed;
      case 'Cancelled': return colors.status.cancelled;
      default: return colors.text.secondary;
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
        style={cardStyles.card}
        onPress={() => navigation.navigate('GameDetail', { gameId: game.id })}
      >
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={{marginRight: spacing.xs, fontSize: typography.size.md}}>{getStatusIcon(game.status)}</Text>
            <Text style={[{fontSize: typography.size.sm, fontWeight: typography.weight.semiBold}, { color: getStatusColor(game.status) }]}>
              {game.status}
            </Text>
          </View>
          <Text style={[textStyles.small, {fontWeight: typography.weight.medium}]}>Week {game.week}</Text>
        </View>

        <View style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm}}>
            <Text style={[{fontSize: typography.size.md, fontWeight: typography.weight.semiBold, color: colors.text.primary, flex: 1, textAlign: 'center'}, isUserTeam(game.homeTeam) && {color: colors.primary, fontWeight: typography.weight.bold}]}>
              {homeTeamName}
            </Text>
            <View style={{marginHorizontal: spacing.sm}}>
              {game.homeScore !== undefined && game.awayScore !== undefined ? (
                <Text style={{fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.primary}}>
                  {game.homeScore} - {game.awayScore}
                </Text>
              ) : (
                <Text style={textStyles.caption}>vs</Text>
              )}
            </View>
            <Text style={[{fontSize: typography.size.md, fontWeight: typography.weight.semiBold, color: colors.text.primary, flex: 1, textAlign: 'center'}, isUserTeam(game.awayTeam) && {color: colors.primary, fontWeight: typography.weight.bold}]}>
              {awayTeamName}
            </Text>
          </View>
          
          <Text style={[{fontSize: typography.size.md, color: colors.primary, fontWeight: typography.weight.semiBold, marginBottom: spacing.xs}]}>{formatGameDate(game.date, game.time)}</Text>
          <Text style={textStyles.caption}>📍 {game.location}</Text>
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
        <View key={dateKey} style={{marginBottom: spacing.xl}}>
          <Text style={[headerStyles.sectionTitle, {marginLeft: spacing.xl, marginRight: spacing.xl, marginBottom: spacing.sm, marginTop: spacing.sm, fontSize: typography.size.lg, fontWeight: typography.weight.semiBold}]}>
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
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <View style={headerStyles.header}>
        <Text style={headerStyles.headerTitle}>Schedule</Text>
        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          <View style={{alignItems: 'center'}}>
            <Text style={[{fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.primary}]}>{games.length}</Text>
            <Text style={[textStyles.small, {marginTop: 2}]}>Total Games</Text>
          </View>
          <View style={{alignItems: 'center'}}>
            <Text style={[{fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.primary}]}>
              {games.filter(g => g.status === 'Scheduled').length}
            </Text>
            <Text style={[textStyles.small, {marginTop: 2}]}>Upcoming</Text>
          </View>
          <View style={{alignItems: 'center'}}>
            <Text style={[{fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.primary}]}>
              {games.filter(g => g.status === 'Completed').length}
            </Text>
            <Text style={[textStyles.small, {marginTop: 2}]}>Played</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{flex: 1}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {games.length === 0 ? (
          <View style={globalStyles.emptyState}>
            <Text style={{fontSize: 64, marginBottom: spacing.lg}}>📅</Text>
            <Text style={[textStyles.title, {marginBottom: spacing.sm, fontSize: typography.size.xl}]}>No Games Scheduled</Text>
            <Text style={[globalStyles.emptyText, {lineHeight: typography.size.md * typography.lineHeight.relaxed}]}>
              Join a league to start playing games!
            </Text>
            <TouchableOpacity 
              style={[buttonStyles.primary, {paddingHorizontal: spacing.xxl, paddingVertical: spacing.md}]}
              onPress={() => navigation.navigate('Leagues')}
            >
              <Text style={buttonStyles.primaryText}>Join a League</Text>
            </TouchableOpacity>
          </View>
        ) : (
          renderGamesByDate()
        )}
      </ScrollView>
    </View>
  );
};


export default ScheduleScreen;