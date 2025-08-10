// screens/AdminDashboardScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { League, Team, FreeAgentRegistration, TeamCreationRequest } from '../types';
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

const AdminDashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalLeagues: 0,
    totalTeams: 0,
    totalPlayers: 0,
    pendingTeamRequests: 0,
    pendingFreeAgents: 0,
  });
  const [loading, setLoading] = useState(true);
  const dataStore = new DataStore();
  const { logout } = useAuth();

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'super_admin') {
      Alert.alert('Access Denied', 'You do not have admin privileges.');
      navigation.goBack();
      return;
    }
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const [leagues, teams, users, teamRequests, freeAgents] = await Promise.all([
        dataStore.getLeagues(),
        dataStore.getAllTeams(),
        dataStore.getAllUsers(),
        dataStore.getTeamCreationRequestsForAdmin(),
        dataStore.getAllFreeAgentRegistrations(),
      ]);

      setStats({
        totalLeagues: leagues.length,
        totalTeams: teams.length,
        totalPlayers: users.filter(u => u.role !== 'admin' && u.role !== 'super_admin').length,
        pendingTeamRequests: teamRequests.length,
        pendingFreeAgents: freeAgents.filter(fa => fa.status === 'Pending').length,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of the admin account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const StatCard = ({ title, value, color = colors.primary }: { title: string; value: number; color?: string }) => (
    <View style={[cardStyles.statCard, { backgroundColor: colors.background.card }]}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color, marginBottom: spacing.xs }}>
        {value}
      </Text>
      <Text style={{ fontSize: 14, color: colors.text.secondary, textAlign: 'center' }}>
        {title}
      </Text>
    </View>
  );

  const ActionCard = ({ title, description, onPress, icon }: { 
    title: string; 
    description: string; 
    onPress: () => void; 
    icon: string;
  }) => (
    <TouchableOpacity style={cardStyles.card} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
        <Text style={{ fontSize: 24, marginRight: spacing.md }}>{icon}</Text>
        <Text style={[textStyles.title, { fontSize: typography.size.lg, flex: 1 }]}>
          {title}
        </Text>
      </View>
      <Text style={[textStyles.body, { color: colors.text.secondary }]}>
        {description}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
      <View style={headerStyles.header}>
        <View style={{ width: 50 }} />
        <Text style={headerStyles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={[textStyles.body, { color: colors.danger, fontWeight: typography.weight.semiBold }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={{ padding: spacing.xl }}>
        <Text style={[headerStyles.sectionTitle, { marginBottom: spacing.lg }]}>
          League Overview
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.xl }}>
          <StatCard title="Leagues" value={stats.totalLeagues} />
          <StatCard title="Teams" value={stats.totalTeams} />
          <StatCard title="Players" value={stats.totalPlayers} />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.xl }}>
          <StatCard title="Pending Team Requests" value={stats.pendingTeamRequests} color={colors.status.scheduled} />
          <StatCard title="Free Agents" value={stats.pendingFreeAgents} color={colors.status.inProgress} />
        </View>

        {/* Admin Actions */}
        <Text style={[headerStyles.sectionTitle, { marginBottom: spacing.lg }]}>
          Admin Actions
        </Text>

        <ActionCard
          title="Search Players"
          description="Search and view detailed information about all players"
          icon="🔍"
          onPress={() => navigation.navigate('AdminPlayers')}
        />

        <ActionCard
          title="View All Leagues"
          description="See all leagues and manage teams within each league"
          icon="🏆"
          onPress={() => navigation.navigate('AdminLeagues')}
        />

        <ActionCard
          title="View All Teams & Players"
          description="See all teams across leagues and manage player rosters"
          icon="👥"
          onPress={() => navigation.navigate('AdminTeams')}
        />

        <ActionCard
          title="League & Team Schedules"
          description="View and manage schedules for all leagues and teams"
          icon="📅"
          onPress={() => navigation.navigate('AdminSchedules')}
        />

        <ActionCard
          title="Team Registration Requests"
          description={`Review ${stats.pendingTeamRequests} pending team registration requests`}
          icon="📝"
          onPress={() => navigation.navigate('AdminRequests')}
        />

        <ActionCard
          title="Free Agent Management"
          description={`Assign ${stats.pendingFreeAgents} free agents to teams`}
          icon="🏃‍♂️"
          onPress={() => navigation.navigate('AdminFreeAgents')}
        />

        <ActionCard
          title="Create League"
          description="Create new leagues and set up seasons"
          icon="🏆"
          onPress={() => navigation.navigate('AdminCreateLeague')}
        />

        <ActionCard
          title="Create Team"
          description="Directly create teams without approval process"
          icon="⚡"
          onPress={() => navigation.navigate('AdminCreateTeam')}
        />
      </View>
    </ScrollView>
  );
};

export default AdminDashboardScreen;