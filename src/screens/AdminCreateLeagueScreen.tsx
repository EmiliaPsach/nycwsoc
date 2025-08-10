import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { League } from '../types';
import {
  globalStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  formStyles,
  colors,
  spacing,
  typography,
  screenConfig
} from '../styles';

const AdminCreateLeagueScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    skillLevel: 'All Levels' as League['skillLevel'],
    dayOfWeek: 'Saturday' as League['dayOfWeek'],
    time: '',
    season: '',
    maxTeams: '8',
    maxPlayersPerTeam: '15',
    regularPrice: '150',
    earlyPrice: '120',
    description: '',
    registrationDeadline: '',
    earlyBirdDeadline: '',
    startDate: '',
    endDate: '',
  });
  const dataStore = new DataStore();

  const createLeague = async () => {
    if (!formData.name.trim() || !formData.location.trim()) {
      Alert.alert('Error', 'Please fill in required fields (Name and Location).');
      return;
    }

    setLoading(true);
    try {
      const newLeague: League = {
        id: `league_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name.trim(),
        location: formData.location.trim(),
        skillLevel: formData.skillLevel,
        dayOfWeek: formData.dayOfWeek,
        time: formData.time.trim() || '10:00 AM',
        season: formData.season.trim() || new Date().getFullYear().toString(),
        maxTeams: parseInt(formData.maxTeams) || 8,
        maxPlayersPerTeam: parseInt(formData.maxPlayersPerTeam) || 15,
        currentTeams: 0,
        regularPrice: parseFloat(formData.regularPrice) || 150,
        earlyPrice: parseFloat(formData.earlyPrice) || 120,
        description: formData.description.trim(),
        registrationDeadline: formData.registrationDeadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        earlyBirdDeadline: formData.earlyBirdDeadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        startDate: formData.startDate || new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: formData.endDate || new Date(Date.now() + 135 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      await dataStore.createLeague(newLeague);
      Alert.alert('Success', `League "${formData.name}" created successfully!`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error creating league:', error);
      Alert.alert('Error', 'Failed to create league. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const FormField = ({ label, value, onChangeText, placeholder, required = false, keyboardType = 'default' }: any) => (
    <View style={formStyles.inputContainer}>
      <Text style={formStyles.label}>
        {label}{required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      <TextInput
        style={formStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
      />
    </View>
  );

  const PickerField = ({ label, value, onValueChange, options, required = false }: any) => (
    <View style={formStyles.inputContainer}>
      <Text style={formStyles.label}>
        {label}{required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
        {options.map((option: string) => (
          <TouchableOpacity
            key={option}
            style={[
              buttonStyles.secondary,
              { marginRight: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
              value === option && { backgroundColor: colors.primary }
            ]}
            onPress={() => onValueChange(option)}
          >
            <Text style={[
              buttonStyles.secondaryText,
              { fontSize: typography.size.sm },
              value === option && { color: colors.text.inverse }
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
      <View style={headerStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[textStyles.body, { color: colors.primary }]}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={headerStyles.headerTitle}>Create League</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={{ flex: 1, padding: spacing.xl }}>
        <FormField
          label="League Name"
          value={formData.name}
          onChangeText={(text: string) => setFormData({ ...formData, name: text })}
          placeholder="Enter league name"
          required={true}
        />

        <FormField
          label="Location"
          value={formData.location}
          onChangeText={(text: string) => setFormData({ ...formData, location: text })}
          placeholder="e.g., Central Park, Brooklyn"
          required={true}
        />

        <PickerField
          label="Skill Level"
          value={formData.skillLevel}
          onValueChange={(value: string) => setFormData({ ...formData, skillLevel: value as League['skillLevel'] })}
          options={['Beginner', 'Intermediate', 'Advanced', 'All Levels']}
        />

        <PickerField
          label="Game Day"
          value={formData.dayOfWeek}
          onValueChange={(value: string) => setFormData({ ...formData, dayOfWeek: value as League['dayOfWeek'] })}
          options={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']}
        />

        <FormField
          label="Game Time"
          value={formData.time}
          onChangeText={(text: string) => setFormData({ ...formData, time: text })}
          placeholder="e.g., 10:00 AM"
        />

        <FormField
          label="Season"
          value={formData.season}
          onChangeText={(text: string) => setFormData({ ...formData, season: text })}
          placeholder="e.g., Fall 2024"
        />

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <FormField
              label="Max Teams"
              value={formData.maxTeams}
              onChangeText={(text: string) => setFormData({ ...formData, maxTeams: text })}
              placeholder="8"
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormField
              label="Max Players/Team"
              value={formData.maxPlayersPerTeam}
              onChangeText={(text: string) => setFormData({ ...formData, maxPlayersPerTeam: text })}
              placeholder="15"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <FormField
              label="Regular Price"
              value={formData.regularPrice}
              onChangeText={(text: string) => setFormData({ ...formData, regularPrice: text })}
              placeholder="150"
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormField
              label="Early Bird Price"
              value={formData.earlyPrice}
              onChangeText={(text: string) => setFormData({ ...formData, earlyPrice: text })}
              placeholder="120"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={formStyles.inputContainer}>
          <Text style={formStyles.label}>Description</Text>
          <TextInput
            style={[formStyles.input, { height: 100, textAlignVertical: 'top' }]}
            value={formData.description}
            onChangeText={(text: string) => setFormData({ ...formData, description: text })}
            placeholder="League description, rules, and details"
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          style={[buttonStyles.primary, { marginTop: spacing.xl, marginBottom: spacing.xxl }]}
          onPress={createLeague}
          disabled={loading}
        >
          <Text style={buttonStyles.primaryText}>
            {loading ? 'Creating League...' : 'Create League'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default AdminCreateLeagueScreen;