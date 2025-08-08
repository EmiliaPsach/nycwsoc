// components/AttendanceReminderPanel.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Switch,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { PushNotificationService } from '../services/PushNotificationService';
import { User, Game, Team, Poll } from '../types';
import {
  cardStyles,
  textStyles,
  buttonStyles,
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
} from '../styles';

interface AttendanceReminderPanelProps {
  game: Game;
  team: Team;
  poll: Poll | null;
  teamPlayers: User[];
  userTeamId: string;
  onReminderSent: () => void;
}

const AttendanceReminderPanel: React.FC<AttendanceReminderPanelProps> = ({
  game,
  team,
  poll,
  teamPlayers,
  userTeamId,
  onReminderSent,
}) => {
  const { user } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRemindersEnabled, setAutoRemindersEnabled] = useState(true);
  
  const dataStore = new DataStore();
  const pushNotificationService = new PushNotificationService();

  // Check if user can send reminders (captain or admin)
  const canSendReminders = user && (
    user.id === team.captain || 
    user.role === 'admin' || 
    user.role === 'super_admin'
  );

  // Get players who haven't responded
  const unrespondedPlayers = teamPlayers.filter(player => 
    !poll?.responses[player.id]
  );

  useEffect(() => {
    // Load auto-reminder preference
    loadAutoReminderSetting();
  }, []);

  const loadAutoReminderSetting = async () => {
    try {
      // This would typically be stored per user/team in your backend
      const setting = await dataStore.getAutoReminderSetting(userTeamId, user?.id || '');
      setAutoRemindersEnabled(setting !== false); // Default to true
    } catch (error) {
      console.log('Using default auto-reminder setting');
    }
  };

  const toggleAutoReminders = async (enabled: boolean) => {
    setAutoRemindersEnabled(enabled);
    
    try {
      await dataStore.setAutoReminderSetting(userTeamId, user?.id || '', enabled);
      
      if (enabled) {
        // Re-schedule reminders for upcoming games
        await pushNotificationService.scheduleGameReminder(game, team, teamPlayers);
        Alert.alert('Success', 'Automatic reminders enabled for this team');
      } else {
        // Cancel existing reminders
        await pushNotificationService.cancelGameReminder(game.id, userTeamId);
        Alert.alert('Success', 'Automatic reminders disabled for this team');
      }
    } catch (error) {
      console.error('Error toggling auto reminders:', error);
      Alert.alert('Error', 'Failed to update reminder settings');
      setAutoRemindersEnabled(!enabled); // Revert on error
    }
  };

  const handleSelectPlayer = (playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPlayers.length === unrespondedPlayers.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(unrespondedPlayers.map(p => p.id));
    }
  };

  const handleSendReminders = async () => {
    if (selectedPlayers.length === 0) {
      Alert.alert('Error', 'Please select at least one player to remind');
      return;
    }

    setLoading(true);
    
    try {
      const playersToRemind = teamPlayers.filter(p => selectedPlayers.includes(p.id));
      const senderRole = user?.role === 'admin' || user?.role === 'super_admin' ? 'admin' : 'captain';
      
      await pushNotificationService.sendManualReminder(
        game,
        team,
        playersToRemind,
        user?.name || 'Team Captain',
        senderRole
      );

      // Log the reminder in the database for tracking
      await dataStore.logReminderSent({
        gameId: game.id,
        teamId: userTeamId,
        senderId: user?.id || '',
        senderName: user?.name || '',
        senderRole,
        recipientIds: selectedPlayers,
        sentAt: new Date().toISOString(),
        type: 'manual',
      });

      Alert.alert(
        'Success', 
        `Reminders sent to ${selectedPlayers.length} player${selectedPlayers.length > 1 ? 's' : ''}!`
      );
      
      setIsModalVisible(false);
      setSelectedPlayers([]);
      onReminderSent();
      
    } catch (error) {
      console.error('Error sending reminders:', error);
      Alert.alert('Error', 'Failed to send reminders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const PlayerSelectionItem = ({ player }: { player: User }) => {
    const isSelected = selectedPlayers.includes(player.id);
    
    return (
      <TouchableOpacity
        style={[
          cardStyles.compactCard,
          { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
          isSelected && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
        ]}
        onPress={() => handleSelectPlayer(player.id)}
      >
        <View style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: isSelected ? colors.primary : colors.border.light,
          backgroundColor: isSelected ? colors.primary : 'transparent',
          marginRight: spacing.md,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {isSelected && (
            <Text style={{ color: colors.text.inverse, fontSize: 12, fontWeight: 'bold' }}>✓</Text>
          )}
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={[textStyles.body, { fontWeight: typography.weight.semiBold }]}>
            {player.name}
          </Text>
          <Text style={[textStyles.small, { color: colors.text.secondary }]}>
            No response yet
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Don't show if user can't send reminders or no unresponded players
  if (!canSendReminders || game.status !== 'Scheduled') {
    return null;
  }

  return (
    <View style={[cardStyles.card, { marginBottom: spacing.xl }]}>
      <Text style={[textStyles.title, { fontSize: typography.size.lg, marginBottom: spacing.md }]}>
        📢 Attendance Reminders
      </Text>

      {/* Auto-reminder toggle */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.light,
        marginBottom: spacing.md,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={[textStyles.body, { fontWeight: typography.weight.semiBold }]}>
            Automatic Reminders
          </Text>
          <Text style={[textStyles.small, { color: colors.text.secondary, marginTop: 2 }]}>
            Send reminders 4 days before games
          </Text>
        </View>
        <Switch
          value={autoRemindersEnabled}
          onValueChange={toggleAutoReminders}
          trackColor={{ false: colors.border.light, true: colors.primary + '40' }}
          thumbColor={autoRemindersEnabled ? colors.primary : colors.text.secondary}
        />
      </View>

      {/* Manual reminder section */}
      {unrespondedPlayers.length > 0 ? (
        <>
          <Text style={[textStyles.body, { marginBottom: spacing.sm }]}>
            {unrespondedPlayers.length} player{unrespondedPlayers.length > 1 ? 's haven\'t' : ' hasn\'t'} responded yet
          </Text>
          
          <TouchableOpacity
            style={[buttonStyles.secondary, { marginTop: spacing.sm }]}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={buttonStyles.secondaryText}>
              📱 Send Manual Reminder
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={[textStyles.body, { color: colors.secondary, fontWeight: typography.weight.semiBold }]}>
          ✅ All players have responded!
        </Text>
      )}

      {/* Player Selection Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={{ flex: 1, backgroundColor: colors.background.main }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing.xl,
            borderBottomWidth: 1,
            borderBottomColor: colors.border.light,
          }}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={[textStyles.body, { color: colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={[textStyles.title, { fontSize: typography.size.lg }]}>
              Send Reminders
            </Text>
            
            <TouchableOpacity 
              onPress={handleSendReminders}
              disabled={loading || selectedPlayers.length === 0}
            >
              <Text style={[
                textStyles.body, 
                { 
                  color: selectedPlayers.length > 0 ? colors.primary : colors.text.secondary,
                  fontWeight: typography.weight.semiBold 
                }
              ]}>
                {loading ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={{ flex: 1, padding: spacing.xl }}>
            <Text style={[textStyles.body, { marginBottom: spacing.lg }]}>
              Select players to remind about the game on{' '}
              <Text style={{ fontWeight: typography.weight.semiBold }}>
                {new Date(game.date).toLocaleDateString()}
              </Text>
            </Text>

            {/* Select All Button */}
            <TouchableOpacity
              style={[buttonStyles.secondary, { marginBottom: spacing.lg }]}
              onPress={handleSelectAll}
            >
              <Text style={buttonStyles.secondaryText}>
                {selectedPlayers.length === unrespondedPlayers.length ? 'Deselect All' : 'Select All'} ({unrespondedPlayers.length})
              </Text>
            </TouchableOpacity>

            {/* Player List */}
            <FlatList
              data={unrespondedPlayers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <PlayerSelectionItem player={item} />}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AttendanceReminderPanel;