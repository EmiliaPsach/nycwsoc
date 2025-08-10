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
import { Team, League, User } from '../types';
import ProfilePicture from '../components/ProfilePicture';
import {
  globalStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  formStyles,
  modalStyles,
  cardStyles,
  colors,
  spacing,
  typography,
  screenConfig
} from '../styles';

const AdminCreateTeamScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [selectedCaptain, setSelectedCaptain] = useState<User | null>(null);
  const [leagueModalVisible, setLeagueModalVisible] = useState(false);
  const [captainModalVisible, setCaptainModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const dataStore = new DataStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allLeagues, allUsers] = await Promise.all([
        dataStore.getLeagues(),
        dataStore.getAllUsers(),
      ]);
      setLeagues(allLeagues.filter(l => l.isActive));
      setUsers(allUsers.filter(u => u.isActive && u.role !== 'admin' && u.role !== 'super_admin'));
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const createTeam = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a team name.');
      return;
    }
    
    if (!selectedLeague) {
      Alert.alert('Error', 'Please select a league.');
      return;
    }
    
    if (!selectedCaptain) {
      Alert.alert('Error', 'Please select a captain.');
      return;
    }

    setLoading(true);
    try {
      const newTeam: Team = {
        id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name.trim(),
        leagueId: selectedLeague.id,
        players: [selectedCaptain.id],
        captain: selectedCaptain.id,
        createdAt: new Date().toISOString(),
        isActive: true,
        description: formData.description.trim() || undefined,
      };

      await dataStore.createTeamDirectly(newTeam);
      
      Alert.alert('Success', `Team "${formData.name}" created successfully with ${selectedCaptain.name} as captain!`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating team:', error);
      Alert.alert('Error', 'Failed to create team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const LeagueSelectionModal = () => (
    <Modal
      visible={leagueModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{ flex: 1, backgroundColor: colors.background.main }}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={() => setLeagueModalVisible(false)}>
            <Text style={[textStyles.body, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={modalStyles.title}>Select League</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={{ flex: 1, padding: spacing.xl }}>
          {leagues.map(league => (
            <TouchableOpacity
              key={league.id}
              style={[
                cardStyles.card,
                selectedLeague?.id === league.id && {
                  borderColor: colors.primary,
                  borderWidth: 2,
                },
              ]}
              onPress={() => {
                setSelectedLeague(league);
                setLeagueModalVisible(false);
              }}
            >
              <Text style={[textStyles.title, { fontSize: typography.size.lg, marginBottom: spacing.sm }]}>
                {league.name}
              </Text>
              <Text style={[textStyles.body, { color: colors.text.secondary, marginBottom: spacing.sm }]}>
                {league.skillLevel} • {league.dayOfWeek}s at {league.time}
              </Text>
              <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                {league.location}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  const CaptainSelectionModal = () => (
    <Modal
      visible={captainModalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{ flex: 1, backgroundColor: colors.background.main }}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={() => setCaptainModalVisible(false)}>
            <Text style={[textStyles.body, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={modalStyles.title}>Select Captain</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={{ flex: 1, padding: spacing.xl }}>
          {users.map(user => (
            <TouchableOpacity
              key={user.id}
              style={[
                cardStyles.card,
                selectedCaptain?.id === user.id && {
                  borderColor: colors.primary,
                  borderWidth: 2,
                },
              ]}
              onPress={() => {
                setSelectedCaptain(user);
                setCaptainModalVisible(false);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ProfilePicture user={user} size={50} />
                <View style={{ marginLeft: spacing.md, flex: 1 }}>
                  <Text style={[textStyles.title, { fontSize: typography.size.md }]}>
                    {user.name}
                  </Text>
                  <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
                    {user.email}
                  </Text>
                  {user.skillLevel && (
                    <Text style={[textStyles.small, { color: colors.primary }]}>
                      {user.skillLevel}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
      <View style={headerStyles.header}>
        <Text style={headerStyles.headerTitle}>Create Team</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={{ flex: 1, padding: spacing.xl }}>
        <View style={formStyles.inputContainer}>
          <Text style={formStyles.label}>
            Team Name <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <TextInput
            style={formStyles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter team name"
            maxLength={50}
          />
        </View>

        <View style={formStyles.inputContainer}>
          <Text style={formStyles.label}>
            League <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <TouchableOpacity
            style={[formStyles.input, { justifyContent: 'center' }]}
            onPress={() => setLeagueModalVisible(true)}
          >
            <Text style={[textStyles.body, selectedLeague ? {} : { color: colors.text.secondary }]}>
              {selectedLeague ? selectedLeague.name : 'Select League'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={formStyles.inputContainer}>
          <Text style={formStyles.label}>
            Captain <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <TouchableOpacity
            style={[formStyles.input, { justifyContent: 'center' }]}
            onPress={() => setCaptainModalVisible(true)}
          >
            <Text style={[textStyles.body, selectedCaptain ? {} : { color: colors.text.secondary }]}>
              {selectedCaptain ? selectedCaptain.name : 'Select Captain'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={formStyles.inputContainer}>
          <Text style={formStyles.label}>Team Description</Text>
          <TextInput
            style={[formStyles.input, { height: 100, textAlignVertical: 'top' }]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Optional team description"
            multiline
            numberOfLines={4}
            maxLength={200}
          />
        </View>

        {selectedLeague && (
          <View style={[cardStyles.card, { backgroundColor: colors.background.card }]}>
            <Text style={[textStyles.body, { fontWeight: typography.weight.semiBold, marginBottom: spacing.sm }]}>
              League Details:
            </Text>
            <Text style={[textStyles.body, { color: colors.text.secondary }]}>
              {selectedLeague.skillLevel} • {selectedLeague.dayOfWeek}s at {selectedLeague.time}
            </Text>
            <Text style={[textStyles.caption, { color: colors.text.secondary }]}>
              {selectedLeague.location}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[buttonStyles.primary, { marginTop: spacing.xl, marginBottom: spacing.xxl }]}
          onPress={createTeam}
          disabled={loading}
        >
          <Text style={buttonStyles.primaryText}>
            {loading ? 'Creating Team...' : 'Create Team'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <LeagueSelectionModal />
      <CaptainSelectionModal />
    </View>
  );
};

export default AdminCreateTeamScreen;