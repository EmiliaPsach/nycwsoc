import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import LeaguesBrowserScreen from './src/screens/LeaguesBrowserScreen';
import LeagueRegistrationScreen from './src/screens/LeagueRegistrationScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminSchedulesScreen from './src/screens/AdminSchedulesScreen';
import AdminFreeAgentsScreen from './src/screens/AdminFreeAgentsScreen';
import AdminRequestsScreen from './src/screens/AdminRequestsScreen';
import AdminCreateLeagueScreen from './src/screens/AdminCreateLeagueScreen';
import AdminCreateTeamScreen from './src/screens/AdminCreateTeamScreen';
import AdminPlayersScreen from './src/screens/AdminPlayersScreen';
import AdminLeaguesScreen from './src/screens/AdminLeaguesScreen';
import AdminLeagueDetailsScreen from './src/screens/AdminLeagueDetailsScreen';
import AdminScheduleGamesScreen from './src/screens/AdminScheduleGamesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import TeamDetailScreen from './src/screens/TeamDetailScreen';
import GameDetailScreen from './src/screens/GameDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName = '';
        
        switch (route.name) {
          case 'AdminDashboard':
            iconName = focused ? 'settings' : 'settings-outline';
            break;
        }
        
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen 
      name="AdminDashboard" 
      component={AdminDashboardScreen}
      options={{ title: 'Admin Dashboard' }}
    />
  </Tab.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName = '';
        
        switch (route.name) {
          case 'Home':
            iconName = focused ? 'home' : 'home-outline';
            break;
          case 'Schedule':
            iconName = focused ? 'calendar' : 'calendar-outline';
            break;
          case 'Leagues':
            iconName = focused ? 'football' : 'football-outline';
            break;
          case 'Profile':
            iconName = focused ? 'person' : 'person-outline';
            break;
        }
        
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Schedule" component={ScheduleScreen} />
    <Tab.Screen name="Leagues" component={LeaguesBrowserScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const MainStack = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={isAdmin ? AdminTabs : MainTabs} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="TeamDetail" 
        component={TeamDetailScreen}
        options={{ title: 'Team Details' }}
      />
      <Stack.Screen 
        name="GameDetail" 
        component={GameDetailScreen}
        options={{ title: 'Game Details' }}
      />
      <Stack.Screen 
        name="LeagueRegistration" 
        component={LeagueRegistrationScreen}
        options={{ title: 'Join League' }}
      />
      <Stack.Screen 
        name="AdminSchedules" 
        component={AdminSchedulesScreen}
        options={{ title: 'All Schedules' }}
      />
      <Stack.Screen 
        name="AdminFreeAgents" 
        component={AdminFreeAgentsScreen}
        options={{ title: 'Free Agents' }}
      />
      <Stack.Screen 
        name="AdminRequests" 
        component={AdminRequestsScreen}
        options={{ title: 'Team Requests' }}
      />
      <Stack.Screen 
        name="AdminCreateLeague" 
        component={AdminCreateLeagueScreen}
        options={{ title: 'Create League' }}
      />
      <Stack.Screen 
        name="AdminCreateTeam" 
        component={AdminCreateTeamScreen}
        options={{ title: 'Create Team' }}
      />
      <Stack.Screen 
        name="AdminPlayers" 
        component={AdminPlayersScreen}
        options={{ title: 'All Players' }}
      />
      <Stack.Screen 
        name="AdminLeagues" 
        component={AdminLeaguesScreen}
        options={{ title: 'All Leagues' }}
      />
      <Stack.Screen 
        name="AdminLeagueDetails" 
        component={AdminLeagueDetailsScreen}
        options={{ title: 'League Details' }}
      />
      <Stack.Screen 
        name="AdminScheduleGames" 
        component={AdminScheduleGamesScreen}
        options={{ title: 'Schedule Games' }}
      />
    </Stack.Navigator>
  );
};

const AppContent = () => {
  const { user } = useAuth();

  // useEffect(() => {
  //   // DEVELOPMENT ONLY: Reset storage to get fresh data
  //   const resetStorage = async () => {
  //     try {
  //       await AsyncStorage.clear();
  //       console.log('✅ AsyncStorage cleared - fresh data will be loaded');
  //     } catch (err) {
  //       console.error('❌ Failed to clear AsyncStorage:', err);
  //       }
  //   };
    
  //   resetStorage();
  // }, []);
  // Removed AsyncStorage.clear() to prevent login issues and crashes
  
  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}