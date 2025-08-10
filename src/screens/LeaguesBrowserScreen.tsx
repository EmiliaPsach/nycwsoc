// screens/LeaguesBrowserScreen.tsx - Simple leagues browser for tab navigation
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
import { League } from '../types';
import {
  globalStyles,
  cardStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  statusStyles,
  colors,
  spacing,
  typography,
  screenConfig
} from '../styles';

const LeaguesBrowserScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dataStore = new DataStore();

  const loadData = async () => {
    try {
      const allLeagues = await dataStore.getLeagues();
      // Filter active leagues where registration deadline hasn't passed
      const now = new Date();
      const activeLeagues = allLeagues.filter(league => {
        const registrationDeadline = new Date(league.registrationDeadline);
        return league.isActive && registrationDeadline > now;
      });
      setLeagues(activeLeagues);
    } catch (error) {
      console.error('Error loading leagues:', error);
      Alert.alert('Error', 'Failed to load leagues');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const LeagueCard = ({ league }: { league: League }) => (
    <TouchableOpacity 
      style={cardStyles.card}
      onPress={() => navigation.navigate('LeagueRegistration', { league })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
        <Text style={[textStyles.title, { fontSize: typography.size.lg, flex: 1 }]}>
          {league.name}
        </Text>
        <View style={[statusStyles.badge, { backgroundColor: colors.status.scheduled }]}>
          <Text style={statusStyles.badgeText}>Open</Text>
        </View>
      </View>
      
      {league.description && (
        <Text style={[textStyles.body, { marginBottom: spacing.sm }]}>
          {league.description}
        </Text>
      )}
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm }}>
        <View style={{ marginRight: spacing.lg, marginBottom: spacing.xs }}>
          <Text style={textStyles.small}>📍 {league.location}</Text>
        </View>
        <View style={{ marginRight: spacing.lg, marginBottom: spacing.xs }}>
          <Text style={textStyles.small}>🏆 {league.skillLevel}</Text>
        </View>
        <View style={{ marginRight: spacing.lg, marginBottom: spacing.xs }}>
          <Text style={textStyles.small}>📅 {league.dayOfWeek}</Text>
        </View>
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
          Registration until: {formatDate(league.registrationDeadline)}
        </Text>
        <Text style={[textStyles.body, { color: colors.primary, fontWeight: typography.weight.semiBold }]}>
          Join League →
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading leagues...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={headerStyles.header}>
        <Text style={headerStyles.headerTitle}>Soccer Leagues</Text>
      </View>

      <View style={{ padding: spacing.xl }}>
        <Text style={[textStyles.body, { marginBottom: spacing.xl, textAlign: 'center' }]}>
          Join a league to start playing competitive soccer!
        </Text>

        {leagues.length === 0 ? (
          <View style={globalStyles.emptyState}>
            <Text style={globalStyles.emptyText}>No leagues available for registration</Text>
            <Text style={[textStyles.caption, { marginTop: spacing.sm, textAlign: 'center' }]}>
              Check back later or contact an administrator for more information.
            </Text>
          </View>
        ) : (
          leagues.map(league => (
            <LeagueCard key={league.id} league={league} />
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default LeaguesBrowserScreen;