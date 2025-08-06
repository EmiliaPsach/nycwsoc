export interface User {
  id: string;
  email: string;
  name: string;
  zipCode?: string;
  jerseySize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  gender?: 'Woman' | 'Non-binary' | 'Prefer not to say';
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  teams: string[];
  createdAt: string;
  isActive: boolean;
  phoneNumber?: string;
}

export interface Team {
  id: string;
  name: string;
  leagueId: string;
  players: string[];
  captain: string;
  createdAt: string;
  isActive: boolean;
  description?: string;
}

export interface League {
  id: string;
  name: string;
  location: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  time: string;
  season: string;
  maxTeams: number;
  maxPlayersPerTeam: number;
  currentTeams: number;
  regularPrice: number;
  earlyPrice: number;
  description: string;
  registrationDeadline: string;
  earlyBirdDeadline: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  location: string;
  leagueId: string;
  week: number;
  homeScore?: number;
  awayScore?: number;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface Poll {
  id: string;
  gameId: string;
  teamId: string;
  responses: { [playerId: string]: 'Yes' | 'No' | 'Maybe' };
  createdAt: string;
  reminderSent: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'game_reminder' | 'poll_reminder' | 'league_update' | 'team_update';
  read: boolean;
  createdAt: string;
  relatedGameId?: string;
  relatedTeamId?: string;
}

export interface TeamRegistration {
  id: string;
  teamId: string;
  leagueId: string;
  playersRegistered: string[];
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface FreeAgentRegistration {
  id: string;
  userId: string;
  leagueId: string;
  status: 'Pending' | 'Assigned' | 'Rejected';
  assignedTeamId?: string;
  createdAt: string;
}

export type NavigationParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Schedule: undefined;
  Leagues: undefined;
  Profile: undefined;
  TeamDetail: { teamId: string };
  GameDetail: { gameId: string; teamId?: string };
};