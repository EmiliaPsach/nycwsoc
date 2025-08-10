// screens/LeagueRegistrationScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { League, Team, FreeAgentRegistration, TeamJoinRequest, TeamCreationRequest } from '../types';
import {
  globalStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  cardStyles,
  formStyles,
  modalStyles,
  colors,
  spacing,
  typography,
  borderRadius,
  screenConfig
} from '../styles';

const LeagueRegistrationScreen = ({ route, navigation }: any) => {
  const { league } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedOption, setSelectedOption] = useState<'individual' | 'join' | 'create' | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [teamSelectionModal, setTeamSelectionModal] = useState(false);
  const [isAlreadyInLeague, setIsAlreadyInLeague] = useState(false);
  const dataStore = new DataStore();

  useEffect(() => {
    checkIfUserInLeague();
    loadAvailableTeams();
  }, []);

  const checkIfUserInLeague = async () => {
    if (!user) return;
    
    try {
      // Check if user is already on a team in this league
      const userTeams = await dataStore.getTeamsForUser(user.id);
      const isInLeague = userTeams.some(team => team.leagueId === league.id);
      
      if (isInLeague) {
        setIsAlreadyInLeague(true);
        Alert.alert(
          'Already Registered',
          `You are already registered in ${league.name}. You cannot register again.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // Check for existing pending free agent registration
      const freeAgentRegistrations = await dataStore.getFreeAgentRegistrationsForUser(user.id);
      const hasPendingFreeAgent = freeAgentRegistrations.some(reg => 
        reg.leagueId === league.id && reg.status === 'Pending'
      );

      // Check for existing pending team join requests
      const teamJoinRequests = await dataStore.getTeamJoinRequestsForUser(user.id);
      const hasPendingJoinRequest = teamJoinRequests.some(req => 
        req.leagueId === league.id && req.status === 'Pending'
      );

      // Check for existing pending team creation requests
      const teamCreationRequests = await dataStore.getTeamCreationRequestsForUser(user.id);
      const hasPendingCreationRequest = teamCreationRequests.some(req => 
        req.leagueId === league.id && req.status === 'Pending'
      );

      if (hasPendingFreeAgent || hasPendingJoinRequest || hasPendingCreationRequest) {
        setIsAlreadyInLeague(true);
        Alert.alert(
          'Pending Registration',
          `You already have a pending registration for ${league.name}. Please wait for approval or contact an administrator.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error checking user league status:', error);
    }
  };

  const loadAvailableTeams = async () => {
    try {
      const teams = await dataStore.getTeamsInLeague(league.id);
      // Filter teams that have space (assuming max players per team)
      const availableTeams = teams.filter(team => 
        team.players.length < league.maxPlayersPerTeam && team.isActive
      );
      setAvailableTeams(availableTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const handleIndividualRegistration = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await dataStore.createFreeAgentRegistration(user.id, league.id);
      
      Alert.alert(
        'Registration Submitted',
        'Your free agent registration has been submitted. You will be notified when a team assignment is available.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting individual registration:', error);
      Alert.alert('Error', 'Failed to submit registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeamRequest = async () => {
    if (!user || !selectedTeam) return;

    setLoading(true);
    try {
      const request: Omit<TeamJoinRequest, 'id'> = {
        userId: user.id,
        teamId: selectedTeam.id,
        leagueId: league.id,
        status: 'Pending',
        requestedAt: new Date().toISOString(),
      };

      await dataStore.createTeamJoinRequest(request);
      
      Alert.alert(
        'Request Submitted',
        `Your request to join ${selectedTeam.name} has been submitted. The team captain will review your request.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting team join request:', error);
      Alert.alert('Error', 'Failed to submit team join request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeamRequest = async () => {
    if (!user || !newTeamName.trim()) {
      Alert.alert('Error', 'Please enter a team name.');
      return;
    }

    setLoading(true);
    try {
      const request: Omit<TeamCreationRequest, 'id'> = {
        userId: user.id,
        leagueId: league.id,
        teamName: newTeamName.trim(),
        teamDescription: newTeamDescription.trim(),
        status: 'Pending',
        requestedAt: new Date().toISOString(),
      };

      await dataStore.createTeamCreationRequest(request);
      
      Alert.alert(
        'Team Creation Request Submitted',
        `Your request to create "${newTeamName}" has been submitted. League administrators will review your request.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting team creation request:', error);
      Alert.alert('Error', 'Failed to submit team creation request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const TeamSelectionModal = () => (
    <Modal
      visible={teamSelectionModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={{ flex: 1, backgroundColor: colors.background.main }}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={() => setTeamSelectionModal(false)}>
            <Text style={[textStyles.body, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={modalStyles.title}>Select Team</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView style={{ flex: 1, padding: spacing.xl }}>
          <Text style={[textStyles.body, { marginBottom: spacing.lg }]}>
            Choose a team to join in {league.name}:
          </Text>

          {availableTeams.map(team => (
            <TouchableOpacity
              key={team.id}
              style={[
                cardStyles.card,
                selectedTeam?.id === team.id && {
                  borderColor: colors.primary,
                  borderWidth: 2,
                },
              ]}
              onPress={() => {
                setSelectedTeam(team);
                setTeamSelectionModal(false);
              }}
            >
              <Text style={[textStyles.body, { fontWeight: typography.weight.semiBold, marginBottom: spacing.sm }]}>
                {team.name}
              </Text>
              {team.description && (
                <Text style={[textStyles.caption, { marginBottom: spacing.sm }]}>
                  {team.description}
                </Text>
              )}
              <Text style={textStyles.small}>
                {team.players.length}/{league.maxPlayersPerTeam} players
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
      <View style={headerStyles.header}>
        <Text style={headerStyles.headerTitle}>Join {league.name}</Text>
      </View>

      <ScrollView style={{ flex: 1, padding: spacing.xl }}>
        {!isAlreadyInLeague && (
          <>
            <Text style={[textStyles.body, { marginBottom: spacing.xxl, textAlign: 'center' }]}>
              Choose how you'd like to join this league:
            </Text>

        {/* Individual Registration */}
        <TouchableOpacity
          style={[
            cardStyles.card,
            selectedOption === 'individual' && {
              borderColor: colors.primary,
              borderWidth: 2,
            },
          ]}
          onPress={() => setSelectedOption('individual')}
        >
          <Text style={[textStyles.title, { fontSize: typography.size.lg, marginBottom: spacing.sm }]}>
            🏃‍♂️ Join as Individual
          </Text>
          <Text style={[textStyles.body, { marginBottom: spacing.sm }]}>
            Register as a free agent and get assigned to a team that needs players.
          </Text>
          <Text style={textStyles.small}>
            • No team selection required
            • League admin will assign you to a team
            • Great for new players
          </Text>
        </TouchableOpacity>

        {/* Select Existing Team */}
        <TouchableOpacity
          style={[
            cardStyles.card,
            selectedOption === 'join' && {
              borderColor: colors.primary,
              borderWidth: 2,
            },
            availableTeams.length === 0 && {
              opacity: 0.5,
            },
          ]}
          onPress={() => availableTeams.length > 0 && setSelectedOption('join')}
          disabled={availableTeams.length === 0}
        >
          <Text style={[textStyles.title, { fontSize: typography.size.lg, marginBottom: spacing.sm }]}>
            👥 Select Existing Team
          </Text>
          <Text style={[textStyles.body, { marginBottom: spacing.sm }]}>
            Choose from available teams that have open spots.
          </Text>
          <Text style={textStyles.small}>
            • Choose from {availableTeams.length} available teams
            • Team captain must approve your request
            • Join friends or players you know
          </Text>
          
          {selectedOption === 'join' && (
            <View style={{ marginTop: spacing.lg }}>
              <TouchableOpacity
                style={[buttonStyles.secondary, { marginBottom: spacing.md }]}
                onPress={() => setTeamSelectionModal(true)}
              >
                <Text style={buttonStyles.secondaryText}>
                  {selectedTeam ? `Selected: ${selectedTeam.name}` : 'Select Team'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>

        {/* Register a New Team */}
        <TouchableOpacity
          style={[
            cardStyles.card,
            selectedOption === 'create' && {
              borderColor: colors.primary,
              borderWidth: 2,
            },
          ]}
          onPress={() => setSelectedOption('create')}
        >
          <Text style={[textStyles.title, { fontSize: typography.size.lg, marginBottom: spacing.sm }]}>
            ⚡ Register a New Team
          </Text>
          <Text style={[textStyles.body, { marginBottom: spacing.sm }]}>
            Create and register a new team in this league.
          </Text>
          <Text style={textStyles.small}>
            • You become the team captain
            • Name and manage your team
            • League admin must approve team registration
          </Text>

          {selectedOption === 'create' && (
            <View style={{ marginTop: spacing.lg }}>
              <View style={formStyles.inputContainer}>
                <Text style={formStyles.label}>Team Name *</Text>
                <TextInput
                  style={formStyles.input}
                  value={newTeamName}
                  onChangeText={setNewTeamName}
                  placeholder="Enter team name"
                  maxLength={50}
                />
              </View>

              <View style={formStyles.inputContainer}>
                <Text style={formStyles.label}>Team Description (Optional)</Text>
                <TextInput
                  style={[formStyles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={newTeamDescription}
                  onChangeText={setNewTeamDescription}
                  placeholder="Describe your team's style, goals, or requirements"
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Submit Button */}
        {selectedOption && (
          <TouchableOpacity
            style={[buttonStyles.primary, { marginTop: spacing.xxl }]}
            onPress={() => {
              if (selectedOption === 'individual') {
                handleIndividualRegistration();
              } else if (selectedOption === 'join') {
                if (!selectedTeam) {
                  Alert.alert('Error', 'Please select a team to join.');
                  return;
                }
                handleJoinTeamRequest();
              } else if (selectedOption === 'create') {
                handleCreateTeamRequest();
              }
            }}
            disabled={loading}
          >
            <Text style={buttonStyles.primaryText}>
              {loading ? 'Submitting...' : 'Submit Registration'}
            </Text>
          </TouchableOpacity>
        )}
          </>
        )}
      </ScrollView>

      <TeamSelectionModal />
    </View>
  );
};

export default LeagueRegistrationScreen;