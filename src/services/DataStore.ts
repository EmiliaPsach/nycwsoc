import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  Team, 
  League, 
  Game, 
  Poll, 
  TeamJoinRequest, 
  FreeAgentRegistration, 
  TeamCreationRequest 
} from '../types';

export class DataStore {
  private static instance: DataStore;
  
  // Storage keys
  private readonly USERS_KEY = 'users';
  private readonly TEAMS_KEY = 'teams';
  private readonly LEAGUES_KEY = 'leagues';
  private readonly GAMES_KEY = 'games';
  private readonly POLLS_KEY = 'polls';
  private readonly NOTIFICATIONS_KEY = 'notifications';
  private readonly FREE_AGENT_REGISTRATIONS_KEY = 'freeAgentRegistrations';
  private readonly TEAM_REGISTRATIONS_KEY = 'teamRegistrations';

  constructor() {
    if (!DataStore.instance) {
      this.initializeData();
      DataStore.instance = this;
    }
    return DataStore.instance;
  }

  private async initializeData() {
    try {
      // Initialize with sample data if not exists
      const users = await this.getStoredData<User[]>(this.USERS_KEY);
      if (!users || users.length === 0) {
        await this.initializeSampleData();
      }
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }

  private async initializeSampleData() {
    const sampleUsers: User[] = [
      {
        id: 'user1',
        email: 'alex@example.com',
        name: 'Alex Johnson',
        zipCode: '10001',
        jerseySize: 'M',
        gender: 'Woman',
        skillLevel: 'Intermediate',
        teams: ['team1'],
        createdAt: new Date().toISOString(),
        isActive: true,
        phoneNumber: '+1234567890'
      },
      {
        id: 'user2',
        email: 'sam@example.com',
        name: 'Sam Rodriguez',
        zipCode: '10002',
        jerseySize: 'L',
        gender: 'Non-binary',
        skillLevel: 'Advanced',
        teams: ['team2'],
        createdAt: new Date().toISOString(),
        isActive: true
      },
      // More players
      {
        id: 'user3',
        email: 'jessie@example.com',
        name: 'Jessie Smith',
        zipCode: '10003',
        jerseySize: 'S',
        gender: 'Woman',
        skillLevel: 'Beginner',
        teams: ['team1'],
        createdAt: new Date().toISOString(),
        isActive: true
      },
      {
        id: 'user4',
        email: 'taylor@example.com',
        name: 'Taylor Kim',
        zipCode: '10004',
        jerseySize: 'M',
        gender: 'Woman',
        skillLevel: 'Intermediate',
        teams: ['team1'],
        createdAt: new Date().toISOString(),
        isActive: true
      },
      {
        id: 'user5',
        email: 'morgan@example.com',
        name: 'Morgan Lee',
        zipCode: '10005',
        jerseySize: 'L',
        gender: 'Non-binary',
        skillLevel: 'Advanced',
        teams: ['team2'],
        createdAt: new Date().toISOString(),
        isActive: true
      },
      {
        id: 'user6',
        email: 'christen@example.com',
        name: 'Christen Doe',
        zipCode: '10006',
        jerseySize: 'M',
        gender: 'Woman',
        skillLevel: 'Intermediate',
        teams: ['team2'],
        createdAt: new Date().toISOString(),
        isActive: true
      },
      {
        id: 'admin1',
        email: 'admin@nycwsoc.com',
        name: 'League Admin',
        zipCode: '10001',
        jerseySize: 'L',
        skillLevel: 'Advanced',
        teams: [],
        createdAt: new Date().toISOString(),
        isActive: true,
        role: 'admin'
      }
    ];

    const sampleTeams: Team[] = [
      {
        id: 'team1',
        name: 'Brooklyn Thunder',
        leagueId: 'league1',
        players: ['user1', 'user3', 'user4'],
        captain: 'user1',
        createdAt: new Date().toISOString(),
        isActive: true,
        description: 'A competitive team focused on skill development and fun!'
      },
      {
        id: 'team2',
        name: 'Manhattan United',
        leagueId: 'league1',
        players: ['user2', 'user5', 'user6'],
        captain: 'user2',
        createdAt: new Date().toISOString(),
        isActive: true,
        description: 'Welcoming team for all skill levels.'
      }
    ];

    const sampleLeagues: League[] = [
      {
        id: 'league1',
        name: 'Manhattan Sunday League',
        location: 'Manhattan',
        skillLevel: 'Intermediate',
        dayOfWeek: 'Sunday',
        time: '10:00 AM',
        season: 'Fall 2025',
        maxTeams: 8,
        maxPlayersPerTeam: 15,
        currentTeams: 6,
        regularPrice: 150,
        earlyPrice: 120,
        description: 'Competitive 11v11 league in Central Park with experienced referees.',
        registrationDeadline: '2025-11-15T23:59:59Z',
        earlyBirdDeadline: '2025-10-15T23:59:59Z',
        startDate: '2025-09-07T10:00:00Z',
        endDate: '2025-12-14T10:00:00Z',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'league2',
        name: 'Brooklyn Wednesday League',
        location: 'Brooklyn',
        skillLevel: 'Beginner',
        dayOfWeek: 'Wednesday',
        time: '7:00 PM',
        season: 'Fall 2025',
        maxTeams: 6,
        maxPlayersPerTeam: 12,
        currentTeams: 4,
        regularPrice: 120,
        earlyPrice: 100,
        description: 'Perfect for newcomers to soccer! Focus on learning and having fun.',
        registrationDeadline: '2025-11-10T23:59:59Z',
        earlyBirdDeadline: '2025-10-10T23:59:59Z',
        startDate: '2025-09-10T19:00:00Z',
        endDate: '2025-12-17T19:00:00Z',
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'league3',
        name: 'Queens Friday Night League',
        location: 'Queens',
        skillLevel: 'Advanced',
        dayOfWeek: 'Friday',
        time: '8:00 PM',
        season: 'Fall 2025',
        maxTeams: 10,
        maxPlayersPerTeam: 18,
        currentTeams: 3,
        regularPrice: 200,
        earlyPrice: 180,
        description: 'High-level competition for experienced players.',
        registrationDeadline: '2025-11-20T23:59:59Z',
        earlyBirdDeadline: '2025-10-20T23:59:59Z',
        startDate: '2025-09-12T20:00:00Z',
        endDate: '2025-12-19T20:00:00Z',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    const sampleGames: Game[] = [
      {
        id: 'game1',
        homeTeam: 'team1',
        awayTeam: 'team2',
        date: '2025-09-14T10:00:00Z',
        time: '10:00 AM',
        location: 'Central Park Field 1',
        leagueId: 'league1',
        week: 1,
        status: 'Scheduled',
        createdAt: new Date().toISOString()
      },
      {
        id: 'game2',
        homeTeam: 'team2',
        awayTeam: 'team1',
        date: '2025-09-21T10:00:00Z',
        time: '10:00 AM',
        location: 'Central Park Field 2',
        leagueId: 'league1',
        week: 2,
        status: 'Scheduled',
        createdAt: new Date().toISOString()
      }
    ];

    const samplePolls: Poll[] = [
      {
        id: 'poll1',
        gameId: 'game1',
        teamId: 'team1',
        responses: { 'user1': 'Yes' },
        createdAt: new Date().toISOString(),
        reminderSent: false
      }
    ];

    await AsyncStorage.setItem(this.USERS_KEY, JSON.stringify(sampleUsers));
    await AsyncStorage.setItem(this.TEAMS_KEY, JSON.stringify(sampleTeams));
    await AsyncStorage.setItem(this.LEAGUES_KEY, JSON.stringify(sampleLeagues));
    await AsyncStorage.setItem(this.GAMES_KEY, JSON.stringify(sampleGames));
    await AsyncStorage.setItem(this.POLLS_KEY, JSON.stringify(samplePolls));
    await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify([]));
    await AsyncStorage.setItem(this.FREE_AGENT_REGISTRATIONS_KEY, JSON.stringify([]));
    await AsyncStorage.setItem(this.TEAM_REGISTRATIONS_KEY, JSON.stringify([]));
  }



  private async getStoredData<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  }

  private async setStoredData<T>(key: string, data: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      throw error;
    }
  }

  // User methods
  async authenticateUser(email: string, password: string): Promise<User | null> {
    const users = await this.getStoredData<User[]>(this.USERS_KEY) || [];
    // Simple authentication - in production, use proper password hashing
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.isActive);
    return user || null;
  }

  async createUser(userData: Partial<User> & { email: string; name: string; password: string }): Promise<User | null> {
    try {
      const users = await this.getStoredData<User[]>(this.USERS_KEY) || [];
      
      // Check if user already exists
      const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: userData.email,
        name: userData.name,
        zipCode: userData.zipCode,
        jerseySize: userData.jerseySize,
        gender: userData.gender,
        skillLevel: userData.skillLevel,
        phoneNumber: userData.phoneNumber,
        teams: [],
        createdAt: new Date().toISOString(),
        isActive: true
      };

      users.push(newUser);
      await this.setStoredData(this.USERS_KEY, users);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  async getUser(id: string): Promise<User | null> {
    const users = await this.getStoredData<User[]>(this.USERS_KEY) || [];
    return users.find(u => u.id === id && u.isActive) || null;
  }

  async updateUser(user: User): Promise<void> {
    const users = await this.getStoredData<User[]>(this.USERS_KEY) || [];
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
      await this.setStoredData(this.USERS_KEY, users);
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.getStoredData<User[]>(this.USERS_KEY) || [];
    return users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.isActive) || null;
  }

  // Team methods
  async getTeam(id: string): Promise<Team | null> {
    const teams = await this.getStoredData<Team[]>(this.TEAMS_KEY) || [];
    return teams.find(t => t.id === id && t.isActive) || null;
  }

  async getTeamsForUser(userId: string): Promise<Team[]> {
    const teams = await this.getStoredData<Team[]>(this.TEAMS_KEY) || [];
    return teams.filter(t => t.players.includes(userId) && t.isActive);
  }


  // League methods
  async getLeagues(filters?: {
    location?: string;
    skillLevel?: string;
    dayOfWeek?: string;
    season?: string;
  }): Promise<League[]> {
    let leagues = await this.getStoredData<League[]>(this.LEAGUES_KEY) || [];
    leagues = leagues.filter(l => l.isActive);

    if (filters) {
      if (filters.location) {
        leagues = leagues.filter(l => 
          l.location.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }
      if (filters.skillLevel) {
        leagues = leagues.filter(l => 
          l.skillLevel.toLowerCase().includes(filters.skillLevel!.toLowerCase())
        );
      }
      if (filters.dayOfWeek) {
        leagues = leagues.filter(l => 
          l.dayOfWeek.toLowerCase().includes(filters.dayOfWeek!.toLowerCase())
        );
      }
      if (filters.season) {
        leagues = leagues.filter(l => 
          l.season.toLowerCase().includes(filters.season!.toLowerCase())
        );
      }
    }

    return leagues;
  }

  async getLeague(id: string): Promise<League | null> {
    const leagues = await this.getStoredData<League[]>(this.LEAGUES_KEY) || [];
    return leagues.find(l => l.id === id && l.isActive) || null;
  }

  // Game methods
  async getGamesForTeam(teamId: string): Promise<Game[]> {
    const games = await this.getStoredData<Game[]>(this.GAMES_KEY) || [];
    return games.filter(g => (g.homeTeam === teamId || g.awayTeam === teamId));
  }

  async getGame(id: string): Promise<Game | null> {
    const games = await this.getStoredData<Game[]>(this.GAMES_KEY) || [];
    return games.find(g => g.id === id) || null;
  }

  async getGamesForUser(userId: string): Promise<Game[]> {
    const userTeams = await this.getTeamsForUser(userId);
    const teamIds = userTeams.map(t => t.id);
    
    const games = await this.getStoredData<Game[]>(this.GAMES_KEY) || [];
    return games.filter(g => teamIds.includes(g.homeTeam) || teamIds.includes(g.awayTeam));
  }

  // Poll methods
  async getPoll(gameId: string, teamId: string): Promise<Poll | null> {
    const polls = await this.getStoredData<Poll[]>(this.POLLS_KEY) || [];
    return polls.find(p => p.gameId === gameId && p.teamId === teamId) || null;
  }

  async updatePollResponse(gameId: string, teamId: string, playerId: string, response: 'Yes' | 'No' | 'Maybe'): Promise<void> {
    const polls = await this.getStoredData<Poll[]>(this.POLLS_KEY) || [];
    let poll = polls.find(p => p.gameId === gameId && p.teamId === teamId);
    
    if (!poll) {
      poll = {
        id: `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        gameId,
        teamId,
        responses: {},
        createdAt: new Date().toISOString(),
        reminderSent: false
      };
      polls.push(poll);
    }
    
    poll.responses[playerId] = response;
    await this.setStoredData(this.POLLS_KEY, polls);
  }

  async getPollsForTeam(teamId: string): Promise<Poll[]> {
    const polls = await this.getStoredData<Poll[]>(this.POLLS_KEY) || [];
    return polls.filter(p => p.teamId === teamId);
  }

  // Free Agent Registration methods
  async createFreeAgentRegistration(userId: string, leagueId: string): Promise<FreeAgentRegistration> {
    const registrations = await this.getStoredData<FreeAgentRegistration[]>(this.FREE_AGENT_REGISTRATIONS_KEY) || [];
    
    const newRegistration: FreeAgentRegistration = {
      id: `fa_reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      leagueId,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    registrations.push(newRegistration);
    await this.setStoredData(this.FREE_AGENT_REGISTRATIONS_KEY, registrations);
    return newRegistration;
  }

  async getFreeAgentRegistrationsForUser(userId: string): Promise<FreeAgentRegistration[]> {
    const registrations = await this.getStoredData<FreeAgentRegistration[]>(this.FREE_AGENT_REGISTRATIONS_KEY) || [];
    return registrations.filter(r => r.userId === userId);
  }

  // Push Notification & Reminder methods
  private REMINDER_SETTINGS_KEY = 'reminder_settings';
  private REMINDER_LOGS_KEY = 'reminder_logs';

  async getAutoReminderSetting(teamId: string, userId: string): Promise<boolean> {
    try {
      const settings = await this.getStoredData<{[key: string]: boolean}>(this.REMINDER_SETTINGS_KEY) || {};
      const key = `${teamId}_${userId}`;
      return settings[key] !== undefined ? settings[key] : true; // Default to true
    } catch (error) {
      console.error('Error getting auto reminder setting:', error);
      return true;
    }
  }

  async setAutoReminderSetting(teamId: string, userId: string, enabled: boolean): Promise<void> {
    try {
      const settings = await this.getStoredData<{[key: string]: boolean}>(this.REMINDER_SETTINGS_KEY) || {};
      const key = `${teamId}_${userId}`;
      settings[key] = enabled;
      await this.setStoredData(this.REMINDER_SETTINGS_KEY, settings);
    } catch (error) {
      console.error('Error setting auto reminder setting:', error);
      throw error;
    }
  }

  async getAllUpcomingGames(): Promise<Game[]> {
    try {
      const games = await this.getStoredData<Game[]>(this.GAMES_KEY) || [];
      const now = new Date();
      
      return games.filter(game => {
        const gameDate = new Date(game.date);
        return game.status === 'Scheduled' && gameDate > now;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error('Error getting upcoming games:', error);
      return [];
    }
  }

  async getPlayersInTeam(teamId: string): Promise<User[]> {
    try {
      const team = await this.getTeam(teamId);
      if (!team) return [];

      const users = await this.getStoredData<User[]>(this.USERS_KEY) || [];
      return users.filter(user => team.players.includes(user.id));
    } catch (error) {
      console.error('Error getting players in team:', error);
      return [];
    }
  }

  async logReminderSent(reminderLog: {
    gameId: string;
    teamId: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    recipientIds: string[];
    sentAt: string;
    type: string;
  }): Promise<void> {
    try {
      const logs = await this.getStoredData<typeof reminderLog[]>(this.REMINDER_LOGS_KEY) || [];
      
      const logEntry = {
        ...reminderLog,
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      
      logs.push(logEntry);
      await this.setStoredData(this.REMINDER_LOGS_KEY, logs);
    } catch (error) {
      console.error('Error logging reminder sent:', error);
      throw error;
    }
  }

  async getReminderLogs(gameId?: string, teamId?: string): Promise<any[]> {
    try {
      const logs = await this.getStoredData<any[]>(this.REMINDER_LOGS_KEY) || [];
      
      if (gameId || teamId) {
        return logs.filter(log => {
          const gameMatch = !gameId || log.gameId === gameId;
          const teamMatch = !teamId || log.teamId === teamId;
          return gameMatch && teamMatch;
        });
      }
      
      return logs;
    } catch (error) {
      console.error('Error getting reminder logs:', error);
      return [];
    }
  }

  // Enhanced Registration System Methods
  private TEAM_JOIN_REQUESTS_KEY = 'team_join_requests';
  private TEAM_CREATION_REQUESTS_KEY = 'team_creation_requests';

  async createTeamJoinRequest(request: Omit<TeamJoinRequest, 'id'>): Promise<TeamJoinRequest> {
    try {
      const requests = await this.getStoredData<TeamJoinRequest[]>(this.TEAM_JOIN_REQUESTS_KEY) || [];
      
      const newRequest: TeamJoinRequest = {
        ...request,
        id: `tjr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      
      requests.push(newRequest);
      await this.setStoredData(this.TEAM_JOIN_REQUESTS_KEY, requests);
      return newRequest;
    } catch (error) {
      console.error('Error creating team join request:', error);
      throw error;
    }
  }

  async createTeamCreationRequest(request: Omit<TeamCreationRequest, 'id'>): Promise<TeamCreationRequest> {
    try {
      const requests = await this.getStoredData<TeamCreationRequest[]>(this.TEAM_CREATION_REQUESTS_KEY) || [];
      
      const newRequest: TeamCreationRequest = {
        ...request,
        id: `tcr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      
      requests.push(newRequest);
      await this.setStoredData(this.TEAM_CREATION_REQUESTS_KEY, requests);
      return newRequest;
    } catch (error) {
      console.error('Error creating team creation request:', error);
      throw error;
    }
  }

  async getTeamJoinRequestsForCaptain(captainUserId: string): Promise<TeamJoinRequest[]> {
    try {
      const requests = await this.getStoredData<TeamJoinRequest[]>(this.TEAM_JOIN_REQUESTS_KEY) || [];
      const teams = await this.getStoredData<Team[]>(this.TEAMS_KEY) || [];
      
      // Find teams where the user is captain
      const captainTeams = teams.filter(team => team.captain === captainUserId);
      const captainTeamIds = captainTeams.map(team => team.id);
      
      // Return pending requests for captain's teams
      return requests.filter(request => 
        captainTeamIds.includes(request.teamId) && request.status === 'Pending'
      );
    } catch (error) {
      console.error('Error getting team join requests for captain:', error);
      return [];
    }
  }

  async getTeamCreationRequestsForAdmin(): Promise<TeamCreationRequest[]> {
    try {
      const requests = await this.getStoredData<TeamCreationRequest[]>(this.TEAM_CREATION_REQUESTS_KEY) || [];
      return requests.filter(request => request.status === 'Pending');
    } catch (error) {
      console.error('Error getting team creation requests for admin:', error);
      return [];
    }
  }

  async getTeamJoinRequestsForUser(userId: string): Promise<TeamJoinRequest[]> {
    try {
      const requests = await this.getStoredData<TeamJoinRequest[]>(this.TEAM_JOIN_REQUESTS_KEY) || [];
      return requests.filter(request => request.userId === userId);
    } catch (error) {
      console.error('Error getting team join requests for user:', error);
      return [];
    }
  }

  async getTeamCreationRequestsForUser(userId: string): Promise<TeamCreationRequest[]> {
    try {
      const requests = await this.getStoredData<TeamCreationRequest[]>(this.TEAM_CREATION_REQUESTS_KEY) || [];
      return requests.filter(request => request.userId === userId);
    } catch (error) {
      console.error('Error getting team creation requests for user:', error);
      return [];
    }
  }

  async getAllTeams(): Promise<Team[]> {
    try {
      return await this.getStoredData<Team[]>(this.TEAMS_KEY) || [];
    } catch (error) {
      console.error('Error getting all teams:', error);
      return [];
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.getStoredData<User[]>(this.USERS_KEY) || [];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getAllFreeAgentRegistrations(): Promise<FreeAgentRegistration[]> {
    try {
      return await this.getStoredData<FreeAgentRegistration[]>(this.FREE_AGENT_REGISTRATIONS_KEY) || [];
    } catch (error) {
      console.error('Error getting all free agent registrations:', error);
      return [];
    }
  }

  async getAllGames(): Promise<Game[]> {
    try {
      return await this.getStoredData<Game[]>(this.GAMES_KEY) || [];
    } catch (error) {
      console.error('Error getting all games:', error);
      return [];
    }
  }

  async createLeague(league: League): Promise<void> {
    try {
      const leagues = await this.getStoredData<League[]>(this.LEAGUES_KEY) || [];
      leagues.push(league);
      await this.setStoredData(this.LEAGUES_KEY, leagues);
    } catch (error) {
      console.error('Error creating league:', error);
      throw error;
    }
  }

  async createTeamDirectly(team: Team): Promise<void> {
    try {
      // Add team to storage
      const teams = await this.getStoredData<Team[]>(this.TEAMS_KEY) || [];
      teams.push(team);
      await this.setStoredData(this.TEAMS_KEY, teams);

      // Update captain's teams list
      const users = await this.getStoredData<User[]>(this.USERS_KEY) || [];
      const captain = users.find(u => u.id === team.captain);
      
      if (captain && !captain.teams.includes(team.id)) {
        captain.teams.push(team.id);
        await this.setStoredData(this.USERS_KEY, users);
      }
    } catch (error) {
      console.error('Error creating team directly:', error);
      throw error;
    }
  }

  async assignFreeAgentToTeam(freeAgentId: string, teamId: string): Promise<void> {
    try {
      const freeAgents = await this.getStoredData<FreeAgentRegistration[]>(this.FREE_AGENT_REGISTRATIONS_KEY) || [];
      const freeAgentIndex = freeAgents.findIndex(fa => fa.id === freeAgentId);
      
      if (freeAgentIndex === -1) {
        throw new Error('Free agent registration not found');
      }

      const freeAgent = freeAgents[freeAgentIndex];
      
      // Update free agent status
      freeAgent.status = 'Assigned';
      freeAgent.assignedTeamId = teamId;
      
      // Add user to team
      const teams = await this.getStoredData<Team[]>(this.TEAMS_KEY) || [];
      const team = teams.find(t => t.id === teamId);
      
      if (team && !team.players.includes(freeAgent.userId)) {
        team.players.push(freeAgent.userId);
        await this.setStoredData(this.TEAMS_KEY, teams);
      }

      await this.setStoredData(this.FREE_AGENT_REGISTRATIONS_KEY, freeAgents);
    } catch (error) {
      console.error('Error assigning free agent to team:', error);
      throw error;
    }
  }

  async rejectFreeAgent(freeAgentId: string): Promise<void> {
    try {
      const freeAgents = await this.getStoredData<FreeAgentRegistration[]>(this.FREE_AGENT_REGISTRATIONS_KEY) || [];
      const freeAgent = freeAgents.find(fa => fa.id === freeAgentId);
      
      if (!freeAgent) {
        throw new Error('Free agent registration not found');
      }

      freeAgent.status = 'Rejected';
      await this.setStoredData(this.FREE_AGENT_REGISTRATIONS_KEY, freeAgents);
    } catch (error) {
      console.error('Error rejecting free agent:', error);
      throw error;
    }
  }

  async approveTeamJoinRequest(requestId: string, reviewerId: string): Promise<void> {
    try {
      const requests = await this.getStoredData<TeamJoinRequest[]>(this.TEAM_JOIN_REQUESTS_KEY) || [];
      const request = requests.find(r => r.id === requestId);
      
      if (!request) {
        throw new Error('Team join request not found');
      }

      // Update request status
      request.status = 'Approved';
      request.reviewedAt = new Date().toISOString();
      request.reviewedBy = reviewerId;

      // Add user to team
      const teams = await this.getStoredData<Team[]>(this.TEAMS_KEY) || [];
      const team = teams.find(t => t.id === request.teamId);
      
      if (team && !team.players.includes(request.userId)) {
        team.players.push(request.userId);
        await this.setStoredData(this.TEAMS_KEY, teams);
      }

      // Update user's teams list
      const users = await this.getStoredData<User[]>(this.USERS_KEY) || [];
      const user = users.find(u => u.id === request.userId);
      
      if (user && !user.teams.includes(request.teamId)) {
        user.teams.push(request.teamId);
        await this.setStoredData(this.USERS_KEY, users);
      }

      await this.setStoredData(this.TEAM_JOIN_REQUESTS_KEY, requests);
    } catch (error) {
      console.error('Error approving team join request:', error);
      throw error;
    }
  }

  async rejectTeamJoinRequest(requestId: string, reviewerId: string): Promise<void> {
    try {
      const requests = await this.getStoredData<TeamJoinRequest[]>(this.TEAM_JOIN_REQUESTS_KEY) || [];
      const request = requests.find(r => r.id === requestId);
      
      if (!request) {
        throw new Error('Team join request not found');
      }

      request.status = 'Rejected';
      request.reviewedAt = new Date().toISOString();
      request.reviewedBy = reviewerId;

      await this.setStoredData(this.TEAM_JOIN_REQUESTS_KEY, requests);
    } catch (error) {
      console.error('Error rejecting team join request:', error);
      throw error;
    }
  }

  async approveTeamCreationRequest(requestId: string, reviewerId: string): Promise<Team> {
    try {
      const requests = await this.getStoredData<TeamCreationRequest[]>(this.TEAM_CREATION_REQUESTS_KEY) || [];
      const request = requests.find(r => r.id === requestId);
      
      if (!request) {
        throw new Error('Team creation request not found');
      }

      // Create the new team
      const newTeam: Team = {
        id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: request.teamName,
        leagueId: request.leagueId,
        players: [request.userId], // Creator becomes first player
        captain: request.userId,
        createdAt: new Date().toISOString(),
        isActive: true,
        description: request.teamDescription,
      };

      // Add team to storage
      const teams = await this.getStoredData<Team[]>(this.TEAMS_KEY) || [];
      teams.push(newTeam);
      await this.setStoredData(this.TEAMS_KEY, teams);

      // Update user's teams list
      const users = await this.getStoredData<User[]>(this.USERS_KEY) || [];
      const user = users.find(u => u.id === request.userId);
      
      if (user && !user.teams.includes(newTeam.id)) {
        user.teams.push(newTeam.id);
        await this.setStoredData(this.USERS_KEY, users);
      }

      // Update request status
      request.status = 'Approved';
      request.reviewedAt = new Date().toISOString();
      request.reviewedBy = reviewerId;
      await this.setStoredData(this.TEAM_CREATION_REQUESTS_KEY, requests);

      return newTeam;
    } catch (error) {
      console.error('Error approving team creation request:', error);
      throw error;
    }
  }

  async rejectTeamCreationRequest(requestId: string, reviewerId: string): Promise<void> {
    try {
      const requests = await this.getStoredData<TeamCreationRequest[]>(this.TEAM_CREATION_REQUESTS_KEY) || [];
      const request = requests.find(r => r.id === requestId);
      
      if (!request) {
        throw new Error('Team creation request not found');
      }

      request.status = 'Rejected';
      request.reviewedAt = new Date().toISOString();
      request.reviewedBy = reviewerId;

      await this.setStoredData(this.TEAM_CREATION_REQUESTS_KEY, requests);
    } catch (error) {
      console.error('Error rejecting team creation request:', error);
      throw error;
    }
  }

  async getTeamsInLeague(leagueId: string): Promise<Team[]> {
    try {
      const teams = await this.getStoredData<Team[]>(this.TEAMS_KEY) || [];
      return teams.filter(team => team.leagueId === leagueId);
    } catch (error) {
      console.error('Error getting teams in league:', error);
      return [];
    }
  }

  async getTeamsByLeague(leagueId: string): Promise<Team[]> {
    return this.getTeamsInLeague(leagueId);
  }

  async getGamesByLeague(leagueId: string): Promise<Game[]> {
    try {
      const games = await this.getStoredData<Game[]>(this.GAMES_KEY) || [];
      return games.filter(game => game.leagueId === leagueId);
    } catch (error) {
      console.error('Error getting games by league:', error);
      return [];
    }
  }

  async deleteGamesByLeague(leagueId: string): Promise<void> {
    try {
      const games = await this.getStoredData<Game[]>(this.GAMES_KEY) || [];
      const filteredGames = games.filter(game => game.leagueId !== leagueId);
      await this.setStoredData(this.GAMES_KEY, filteredGames);
    } catch (error) {
      console.error('Error deleting games by league:', error);
      throw error;
    }
  }

  async updateLeague(league: League): Promise<void> {
    try {
      const leagues = await this.getStoredData<League[]>(this.LEAGUES_KEY) || [];
      const index = leagues.findIndex(l => l.id === league.id);
      if (index >= 0) {
        leagues[index] = league;
        await this.setStoredData(this.LEAGUES_KEY, leagues);
      }
    } catch (error) {
      console.error('Error updating league:', error);
      throw error;
    }
  }

  async createGame(game: Game): Promise<void> {
    try {
      const games = await this.getStoredData<Game[]>(this.GAMES_KEY) || [];
      games.push(game);
      await this.setStoredData(this.GAMES_KEY, games);
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  }
}