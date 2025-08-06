import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  Team, 
  League, 
  Game, 
  Poll, 
  Notification, 
  FreeAgentRegistration, 
  TeamRegistration 
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
      }
    ];

    const sampleTeams: Team[] = [
      {
        id: 'team1',
        name: 'Brooklyn Thunder',
        leagueId: 'league1',
        players: ['user1'],
        captain: 'user1',
        createdAt: new Date().toISOString(),
        isActive: true,
        description: 'A competitive team focused on skill development and fun!'
      },
      {
        id: 'team2',
        name: 'Manhattan United',
        leagueId: 'league1',
        players: ['user2'],
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
        season: 'Fall 2024',
        maxTeams: 8,
        maxPlayersPerTeam: 15,
        currentTeams: 6,
        regularPrice: 150,
        earlyPrice: 120,
        description: 'Competitive 11v11 league in Central Park with experienced referees.',
        registrationDeadline: '2024-12-15',
        earlyBirdDeadline: '2024-12-01',
        startDate: '2025-01-06',
        endDate: '2025-03-30',
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
        season: 'Fall 2024',
        maxTeams: 6,
        maxPlayersPerTeam: 12,
        currentTeams: 4,
        regularPrice: 120,
        earlyPrice: 100,
        description: 'Perfect for newcomers to soccer! Focus on learning and having fun.',
        registrationDeadline: '2024-12-10',
        earlyBirdDeadline: '2024-12-01',
        startDate: '2025-01-08',
        endDate: '2025-03-26',
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
        season: 'Winter 2025',
        maxTeams: 10,
        maxPlayersPerTeam: 18,
        currentTeams: 3,
        regularPrice: 200,
        earlyPrice: 180,
        description: 'High-level competition for experienced players.',
        registrationDeadline: '2024-12-20',
        earlyBirdDeadline: '2024-12-01',
        startDate: '2025-01-10',
        endDate: '2025-04-04',
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];

    const sampleGames: Game[] = [
      {
        id: 'game1',
        homeTeam: 'team1',
        awayTeam: 'team2',
        date: '2025-01-12',
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
        date: '2025-01-19',
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

    // Store sample data
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
    const user = await this.getUser(userId);
    if (!user) return [];
    
    const teams = await this.getStoredData<Team[]>(this.TEAMS_KEY) || [];
    return teams.filter(t => user.teams.includes(t.id) && t.isActive);
  }

  async getPlayersInTeam(teamId: string): Promise<User[]> {
    const team = await this.getTeam(teamId);
    if (!team) return [];

    const users = await this.getStoredData<User[]>(this.USERS_KEY) || [];
    return users.filter(u => team.players.includes(u.id) && u.isActive);
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
}