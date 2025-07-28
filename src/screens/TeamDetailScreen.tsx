import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
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
import {
  globalStyles,
  cardStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  colors,
  spacing,
  typography,
  borderRadius,
  shadows
} from '../styles';

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
      case 'W': return colors.secondary;
      case 'L': return colors.danger;
      case 'T': return colors.warning;
      default: return colors.text.secondary;
    }
  };

  const PlayerCard = ({ player }: { player: User }) => {
    const isCurrentUser = player.id === user?.id;
    const role = getPlayerRole(player.id);
    
    return (
      <View style={[cardStyles.compactCard, {flexDirection: 'row', alignItems: 'center', ...shadows.button}, isCurrentUser && {borderWidth: 2, borderColor: colors.primary}]}>
        <View style={{width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md}}>
          <Text style={{color: colors.text.inverse, fontSize: typography.size.md, fontWeight: typography.weight.bold}}>
            {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </Text>
        </View>
        
        <View style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs}}>
            <Text style={[textStyles.body, {fontWeight: typography.weight.semiBold, flex: 1}]}>
              {player.name} {isCurrentUser && '(You)'}
            </Text>
            {role === 'Captain' && (
              <View style={{paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.md, backgroundColor: '#FFD700'}}>
                <Text style={{fontSize: typography.size.xs, fontWeight: typography.weight.bold, color: '#B8860B'}}>👑 Captain</Text>
              </View>
            )}
          </View>
          
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {player.skillLevel && (
              <Text style={[textStyles.small, {marginRight: spacing.sm}]}>{player.skillLevel}</Text>
            )}
            {player.jerseySize && (
              <Text style={[textStyles.small, {marginRight: spacing.sm}]}>• {player.jerseySize}</Text>
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
        style={[cardStyles.compactCard, shadows.button]}
        onPress={() => navigation.navigate('GameDetail', { gameId: game.id, teamId })}
      >
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm}}>
          <View style={{flex: 1}}>
            <Text style={[textStyles.body, {fontWeight: typography.weight.semiBold}]}>
              {new Date(game.date).toLocaleDateString()}
            </Text>
            <Text style={[textStyles.small, {marginTop: 2}]}>{game.location}</Text>
          </View>
          
          {result && (
            <View style={{width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: resultColor}}>
              <Text style={{color: colors.text.inverse, fontSize: typography.size.xs, fontWeight: typography.weight.bold}}>{result}</Text>
            </View>
          )}
        </View>
        
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm}}>
          <Text style={[textStyles.body, {flex: 1, fontWeight: typography.weight.semiBold, textAlign: 'center'}]}>
            {isHome ? team?.name : opponentName}
          </Text>
          
          <View style={{marginHorizontal: spacing.md}}>
            {game.homeScore !== undefined && game.awayScore !== undefined ? (
              <Text style={[textStyles.body, {fontWeight: typography.weight.bold, color: colors.primary, fontSize: typography.size.md}]}>
                {isHome ? game.homeScore : game.awayScore} - {isHome ? game.awayScore : game.homeScore}
              </Text>
            ) : (
              <Text style={textStyles.small}>vs</Text>
            )}
          </View>
          
          <Text style={[textStyles.body, {flex: 1, fontWeight: typography.weight.semiBold, textAlign: 'center'}]}>
            {isHome ? opponentName : team?.name}
          </Text>
        </View>
        
        <Text style={[textStyles.small, {textAlign: 'center'}]}>
          {game.time} • Week {game.week}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading team details...</Text>
      </View>
    );
  }

  if (!team) {
    return (
      <View style={globalStyles.errorContainer}>
        <Text style={globalStyles.errorText}>Team not found</Text>
        <TouchableOpacity
          style={buttonStyles.primary}
          onPress={() => navigation.goBack()}
        >
          <Text style={buttonStyles.primaryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = getGameStats();

  return (
    <ScrollView
      style={globalStyles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Team Header */}
      <View style={{backgroundColor: colors.background.card, padding: spacing.xl, marginBottom: spacing.xl}}>
        <View style={{marginBottom: spacing.lg}}>
          <Text style={[textStyles.title, {marginBottom: spacing.sm}]}>{team.name}</Text>
          {team.description && (
            <Text style={[textStyles.body, {color: colors.text.secondary, lineHeight: typography.size.md * typography.lineHeight.relaxed, marginBottom: spacing.md}]}>{team.description}</Text>
          )}
          
          <View style={{gap: spacing.xs}}>
            <Text style={textStyles.caption}>
              📍 {league?.location || 'Unknown Location'}
            </Text>
            <Text style={textStyles.caption}>
              🗓️ {league?.dayOfWeek}s at {league?.time}
            </Text>
            <Text style={textStyles.caption}>
              ⚽ {league?.season || 'Unknown Season'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={[buttonStyles.small, {alignSelf: 'flex-start'}]} onPress={handleShare}>
          <Text style={buttonStyles.smallText}>Share Team</Text>
        </TouchableOpacity>
      </View>

      {/* Team Stats */}
      <View style={{flexDirection: 'row', paddingHorizontal: spacing.xl, marginBottom: spacing.xl, gap: spacing.md}}>
        <View style={cardStyles.statCard}>
          <Text style={[textStyles.title, {fontSize: typography.size.xxl, color: colors.primary}]}>{players.length}</Text>
          <Text style={[textStyles.small, {marginTop: spacing.xs}]}>Players</Text>
        </View>
        
        <View style={cardStyles.statCard}>
          <Text style={[textStyles.title, {fontSize: typography.size.xxl, color: colors.primary}]}>{stats.played}</Text>
          <Text style={[textStyles.small, {marginTop: spacing.xs}]}>Played</Text>
        </View>
        
        <View style={cardStyles.statCard}>
          <Text style={[textStyles.title, {fontSize: typography.size.xxl, color: colors.primary}]}>{stats.won}</Text>
          <Text style={[textStyles.small, {marginTop: spacing.xs}]}>Won</Text>
        </View>
        
        <View style={cardStyles.statCard}>
          <Text style={[textStyles.title, {fontSize: typography.size.xxl, color: colors.primary}]}>{stats.lost}</Text>
          <Text style={[textStyles.small, {marginTop: spacing.xs}]}>Lost</Text>
        </View>
      </View>

      {/* Team Roster */}
      <View style={{marginBottom: spacing.xxl}}>
        <View style={headerStyles.sectionHeader}>
          <Text style={headerStyles.sectionTitle}>Team Roster ({players.length})</Text>
        </View>
        
        {players.length === 0 ? (
          <View style={globalStyles.emptyState}>
            <Text style={globalStyles.emptyText}>No players found</Text>
          </View>
        ) : (
          players.map(player => (
            <PlayerCard key={player.id} player={player} />
          ))
        )}
      </View>

      {/* Recent Games */}
      <View style={{marginBottom: spacing.xxl}}>
        <View style={headerStyles.sectionHeader}>
          <Text style={headerStyles.sectionTitle}>Games</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Schedule' })}>
            <Text style={headerStyles.sectionAction}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {games.length === 0 ? (
          <View style={globalStyles.emptyState}>
            <Text style={globalStyles.emptyText}>No games scheduled</Text>
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


export default TeamDetailScreen;