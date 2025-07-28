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
import { Team, Game, League } from '../types';
import {
  globalStyles,
  buttonStyles,
  cardStyles,
  headerStyles,
  textStyles,
  colors,
  spacing,
} from '../styles';

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
        style={cardStyles.card}
        onPress={() => navigation.navigate('GameDetail', { gameId: game.id })}
      >
        <View style={{ flex: 1 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.sm,
          }}>
            <Text style={[
              {
                fontSize: 16,
                fontWeight: '600',
                color: colors.text.primary,
                flex: 1,
                textAlign: 'center',
              },
              isUserTeam(game.homeTeam) && {
                color: colors.primary,
                fontWeight: 'bold',
              }
            ]}>
              {homeTeamName}
            </Text>
            <Text style={{
              fontSize: 14,
              color: colors.text.secondary,
              marginHorizontal: spacing.sm,
            }}>vs</Text>
            <Text style={[
              {
                fontSize: 16,
                fontWeight: '600',
                color: colors.text.primary,
                flex: 1,
                textAlign: 'center',
              },
              isUserTeam(game.awayTeam) && {
                color: colors.primary,
                fontWeight: 'bold',
              }
            ]}>
              {awayTeamName}
            </Text>
          </View>
          <Text style={[
            textStyles.body,
            {
              color: colors.primary,
              fontWeight: '600',
              marginBottom: spacing.xs,
            }
          ]}>{formatGameDate(game.date, game.time)}</Text>
          <Text style={textStyles.caption}>{game.location}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const TeamCard = ({ team }: { team: Team }) => (
    <TouchableOpacity 
      style={cardStyles.card}
      onPress={() => navigation.navigate('TeamDetail', { teamId: team.id })}
    >
      <Text style={[
        textStyles.body,
        {
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: spacing.xs,
        }
      ]}>{team.name}</Text>
      <Text style={[
        textStyles.caption,
        { marginBottom: spacing.sm }
      ]}>{team.description}</Text>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Text style={[
          textStyles.small,
          { marginRight: spacing.sm }
        ]}>{team.players.length} players</Text>
        <Text style={[
          textStyles.small,
          { marginRight: spacing.sm }
        ]}>•</Text>
        <Text style={textStyles.small}>
          {team.captain === user?.id ? 'Captain' : 'Member'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={globalStyles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={headerStyles.welcomeHeader}>
        <Text style={headerStyles.welcomeText}>Welcome back,</Text>
        <Text style={headerStyles.welcomeUserName}>{user?.name}! ⚽</Text>
      </View>

      {/* Quick Stats */}
      <View style={{
        flexDirection: 'row',
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.xl,
      }}>
        <View style={cardStyles.statCard}>
          <Text style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: colors.primary,
          }}>{teams.length}</Text>
          <Text style={{
            fontSize: 14,
            color: colors.text.secondary,
            marginTop: spacing.xs,
          }}>Teams</Text>
        </View>
        <View style={cardStyles.statCard}>
          <Text style={{
            fontSize: 32,
            fontWeight: 'bold',
            color: colors.primary,
          }}>{upcomingGames.length}</Text>
          <Text style={{
            fontSize: 14,
            color: colors.text.secondary,
            marginTop: spacing.xs,
          }}>Upcoming Games</Text>
        </View>
      </View>

      {/* Upcoming Games */}
      <View style={{ marginBottom: spacing.xxxl }}>
        <View style={headerStyles.sectionHeader}>
          <Text style={headerStyles.sectionTitle}>Upcoming Games</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Schedule' })}>
            <Text style={headerStyles.sectionAction}>See All</Text>
          </TouchableOpacity>
        </View>

        {upcomingGames.length === 0 ? (
          <View style={globalStyles.emptyState}>
            <Text style={globalStyles.emptyText}>No upcoming games</Text>
            <TouchableOpacity 
              style={buttonStyles.primary}
              onPress={() => navigation.navigate('Leagues')}
            >
              <Text style={buttonStyles.primaryText}>Join a League</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcomingGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))
        )}
      </View>

      {/* My Teams */}
      <View style={{ marginBottom: spacing.xxxl }}>
        <View style={headerStyles.sectionHeader}>
          <Text style={headerStyles.sectionTitle}>My Teams</Text>
        </View>

        {teams.length === 0 ? (
          <View style={globalStyles.emptyState}>
            <Text style={globalStyles.emptyText}>You're not on any teams yet</Text>
            <TouchableOpacity 
              style={buttonStyles.primary}
              onPress={() => navigation.navigate('Leagues')}
            >
              <Text style={buttonStyles.primaryText}>Find a Team</Text>
            </TouchableOpacity>
          </View>
        ) : (
          teams.map(team => (
            <TeamCard key={team.id} team={team} />
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={{ marginBottom: spacing.xxxl }}>
        <Text style={[headerStyles.sectionTitle, { paddingHorizontal: spacing.xl }]}>Quick Actions</Text>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingHorizontal: spacing.xl,
          marginTop: spacing.sm,
        }}>
          <TouchableOpacity 
            style={[
              cardStyles.compactCard,
              {
                alignItems: 'center',
                width: 100,
                marginHorizontal: 0,
                marginBottom: 0,
              }
            ]}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Schedule' })}
          >
            <Text style={{ fontSize: 28, marginBottom: spacing.xs }}>📅</Text>
            <Text style={[
              textStyles.caption,
              {
                fontWeight: '600',
                textAlign: 'center',
                color: colors.text.primary,
              }
            ]}>View Schedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              cardStyles.compactCard,
              {
                alignItems: 'center',
                width: 100,
                marginHorizontal: 0,
                marginBottom: 0,
              }
            ]}
            onPress={() => navigation.navigate('Leagues')}
          >
            <Text style={{ fontSize: 28, marginBottom: spacing.xs }}>⚽</Text>
            <Text style={[
              textStyles.caption,
              {
                fontWeight: '600',
                textAlign: 'center',
                color: colors.text.primary,
              }
            ]}>Join League</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              cardStyles.compactCard,
              {
                alignItems: 'center',
                width: 100,
                marginHorizontal: 0,
                marginBottom: 0,
              }
            ]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={{ fontSize: 28, marginBottom: spacing.xs }}>👤</Text>
            <Text style={[
              textStyles.caption,
              {
                fontWeight: '600',
                textAlign: 'center',
                color: colors.text.primary,
              }
            ]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};


export default HomeScreen;