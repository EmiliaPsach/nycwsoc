// screens/AdminPlayersScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { User, Team } from '../types';
import ProfilePicture from '../components/ProfilePicture';
import { useCSVExport } from '../hooks/useCSVExport';
import {
  globalStyles,
  cardStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  formStyles,
  statusStyles,
  colors,
  spacing,
  typography,
  screenConfig
} from '../styles';

const AdminPlayersScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [allPlayers, setAllPlayers] = useState<User[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dataStore = new DataStore();
  const { exportPlayers, isExporting } = useCSVExport();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const [allUsers, allTeams] = await Promise.all([
        dataStore.getAllUsers(),
        dataStore.getAllTeams(),
      ]);
      
      // Filter out admin users
      const players = allUsers.filter(u => u.role !== 'admin' && u.role !== 'super_admin');
      setAllPlayers(players);
      setFilteredPlayers(players);
      setTeams(allTeams);
    } catch (error) {
      console.error('Error loading players data:', error);
      Alert.alert('Error', 'Failed to load players data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredPlayers(allPlayers);
    } else {
      const filtered = allPlayers.filter(player =>
        player.name.toLowerCase().includes(text.toLowerCase()) ||
        player.email.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredPlayers(filtered);
    }
  };

  const getPlayerTeams = (playerId: string): Team[] => {
    return teams.filter(team => team.players.includes(playerId));
  };

  const handleExportCSV = async () => {
    if (filteredPlayers.length === 0) {
      Alert.alert('No Data', 'No players available to export');
      return;
    }
    
    try {
      await exportPlayers(filteredPlayers, teams, { searchText });
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const PlayerCard = ({ player }: { player: User }) => {
    const playerTeams = getPlayerTeams(player.id);

    return (
      <View style={cardStyles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <ProfilePicture user={player} size={60} />
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={[textStyles.title, { fontSize: typography.size.lg }]}>
              {player.name}
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
              {player.email}
            </Text>
            {player.skillLevel && (
              <Text style={[textStyles.body, { color: colors.primary, marginTop: spacing.xs }]}>
                {player.skillLevel}
              </Text>
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md }}>
          {player.skillLevel && (
            <View style={[statusStyles.badge, { backgroundColor: colors.status.scheduled, marginRight: spacing.sm, marginBottom: spacing.xs }]}>
              <Text style={statusStyles.badgeText}>{player.skillLevel}</Text>
            </View>
          )}
          {player.jerseySize && (
            <View style={[statusStyles.badge, { backgroundColor: colors.status.inProgress, marginRight: spacing.sm, marginBottom: spacing.xs }]}>
              <Text style={statusStyles.badgeText}>Size {player.jerseySize}</Text>
            </View>
          )}
          {player.gender && (
            <View style={[statusStyles.badge, { backgroundColor: colors.status.completed, marginRight: spacing.sm, marginBottom: spacing.xs }]}>
              <Text style={statusStyles.badgeText}>{player.gender}</Text>
            </View>
          )}
        </View>

        <View style={{ marginBottom: spacing.md }}>
          <Text style={[textStyles.body, { fontWeight: typography.weight.semiBold, marginBottom: spacing.sm }]}>
            Teams ({playerTeams.length}):
          </Text>
          {playerTeams.length === 0 ? (
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
              Not on any teams
            </Text>
          ) : (
            playerTeams.map(team => (
              <TouchableOpacity
                key={team.id}
                style={{ marginBottom: spacing.xs }}
                onPress={() => navigation.navigate('TeamDetail', { teamId: team.id })}
              >
                <Text style={[textStyles.body, { color: colors.primary }]}>
                  • {team.name} {team.captain === player.id && '(Captain)'}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
            Joined: {new Date(player.createdAt).toLocaleDateString()}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {player.zipCode && (
              <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                📍 {player.zipCode}
              </Text>
            )}
            {player.phoneNumber && (
              <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                📱 {player.phoneNumber}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading players...</Text>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
      <View style={headerStyles.header}>
        <Text style={headerStyles.headerTitle}>All Players ({filteredPlayers.length})</Text>
        <TouchableOpacity 
          onPress={handleExportCSV}
          disabled={isExporting || filteredPlayers.length === 0}
        >
          <Text style={[
            textStyles.body, 
            { 
              color: isExporting || filteredPlayers.length === 0 ? colors.text.secondary : colors.primary,
              fontWeight: typography.weight.semiBold 
            }
          ]}>
            {isExporting ? 'Exporting...' : 'Export filtered player(s) to CSV'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.md }}>
        <View style={formStyles.inputContainer}>
          <TextInput
            style={[formStyles.input, { marginBottom: 0 }]}
            value={searchText}
            onChangeText={handleSearch}
            placeholder="Search players by name or email..."
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, padding: spacing.xl, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredPlayers.length === 0 ? (
          <View style={globalStyles.emptyState}>
            <Text style={globalStyles.emptyText}>
              {searchText.trim() !== '' ? 'No players found matching your search' : 'No players found'}
            </Text>
            {searchText.trim() !== '' && (
              <TouchableOpacity
                style={[buttonStyles.secondary, { marginTop: spacing.md }]}
                onPress={() => {
                  setSearchText('');
                  setFilteredPlayers(allPlayers);
                }}
              >
                <Text style={buttonStyles.secondaryText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {searchText.trim() !== '' && (
              <Text style={[textStyles.caption, { marginBottom: spacing.lg, color: colors.text.secondary, textAlign: 'center' }]}>
                Showing {filteredPlayers.length} of {allPlayers.length} players
              </Text>
            )}
            {filteredPlayers.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default AdminPlayersScreen;