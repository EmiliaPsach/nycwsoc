// utils/csvExport.ts
import { Share, Platform, Alert } from 'react-native';
import { User, Team, League } from '../types';

interface CSVExportConfig {
  filename: string;
  title: string;
  confirmMessage: string;
}

class CSVExporter {
  private escapeCSVField(field: string | undefined | null): string {
    if (!field) return '';
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
  }

  private async shareCSV(csvContent: string, config: CSVExportConfig): Promise<void> {
    try {
      await Share.share({
        message: csvContent,
        title: config.title,
        ...(Platform.OS === 'ios' && {
          url: `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`,
        }),
      }, {
        ...(Platform.OS === 'android' && {
          dialogTitle: config.title,
        }),
      });
    } catch (error) {
      console.error('Error sharing CSV:', error);
      throw new Error('Could not export CSV file');
    }
  }

  async exportPlayers(
    players: User[], 
    teams: Team[], 
    options: { searchText?: string } = {}
  ): Promise<void> {
    const { searchText = '' } = options;
    const timestamp = new Date().toISOString().split('T')[0];
    
    const config: CSVExportConfig = {
      filename: `players_export_${timestamp}.csv`,
      title: `Export Players Data (${players.length} players)`,
      confirmMessage: searchText.trim() !== '' 
        ? `Export ${players.length} filtered players to CSV?`
        : `Export all ${players.length} players to CSV?`
    };

    // Show confirmation
    return new Promise((resolve, reject) => {
      Alert.alert(
        'Export Players',
        config.confirmMessage,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('Export cancelled')) },
          { text: 'Export', onPress: async () => {
            try {
              const csvContent = this.generatePlayersCSV(players, teams);
              await this.shareCSV(csvContent, config);
              resolve();
            } catch (error) {
              reject(error);
            }
          }}
        ]
      );
    });
  }

  async exportTeams(
    teams: Team[], 
    leagues: League[], 
    allUsers: User[],
    options: { searchText?: string } = {}
  ): Promise<void> {
    const { searchText = '' } = options;
    const timestamp = new Date().toISOString().split('T')[0];
    
    const config: CSVExportConfig = {
      filename: `teams_export_${timestamp}.csv`,
      title: `Export Teams Data (${teams.length} teams)`,
      confirmMessage: searchText.trim() !== '' 
        ? `Export ${teams.length} filtered teams to CSV?`
        : `Export all ${teams.length} teams to CSV?`
    };

    return new Promise((resolve, reject) => {
      Alert.alert(
        'Export Teams',
        config.confirmMessage,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('Export cancelled')) },
          { text: 'Export', onPress: async () => {
            try {
              const csvContent = this.generateTeamsCSV(teams, leagues, allUsers);
              await this.shareCSV(csvContent, config);
              resolve();
            } catch (error) {
              reject(error);
            }
          }}
        ]
      );
    });
  }

  async exportLeagues(
    leagues: League[], 
    teams: Team[],
    options: { searchText?: string } = {}
  ): Promise<void> {
    const { searchText = '' } = options;
    const timestamp = new Date().toISOString().split('T')[0];
    
    const config: CSVExportConfig = {
      filename: `leagues_export_${timestamp}.csv`,
      title: `Export Leagues Data (${leagues.length} leagues)`,
      confirmMessage: searchText.trim() !== '' 
        ? `Export ${leagues.length} filtered leagues to CSV?`
        : `Export all ${leagues.length} leagues to CSV?`
    };

    return new Promise((resolve, reject) => {
      Alert.alert(
        'Export Leagues',
        config.confirmMessage,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => reject(new Error('Export cancelled')) },
          { text: 'Export', onPress: async () => {
            try {
              const csvContent = this.generateLeaguesCSV(leagues, teams);
              await this.shareCSV(csvContent, config);
              resolve();
            } catch (error) {
              reject(error);
            }
          }}
        ]
      );
    });
  }

  private generatePlayersCSV(players: User[], teams: Team[]): string {
    const headers = [
      'Name',
      'Email',
      'Phone Number',
      'Skill Level',
      'Jersey Size',
      'Gender',
      'Zip Code',
      'Teams',
      'Team Count',
      'Captain Of',
      'Joined Date',
      'Role'
    ];

    const csvRows = [headers.join(',')];

    for (const player of players) {
      const playerTeams = teams.filter(team => team.players.includes(player.id));
      const teamNames = playerTeams.map(team => team.name).join('; ');
      const captainTeams = playerTeams
        .filter(team => team.captain === player.id)
        .map(team => team.name)
        .join('; ');

      const row = [
        this.escapeCSVField(player.name),
        this.escapeCSVField(player.email),
        this.escapeCSVField(player.phoneNumber),
        this.escapeCSVField(player.skillLevel),
        this.escapeCSVField(player.jerseySize),
        this.escapeCSVField(player.gender),
        this.escapeCSVField(player.zipCode),
        this.escapeCSVField(teamNames),
        playerTeams.length.toString(),
        this.escapeCSVField(captainTeams),
        new Date(player.createdAt).toLocaleDateString(),
        this.escapeCSVField(player.role || 'player')
      ];

      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  private generateTeamsCSV(teams: Team[], leagues: League[], allUsers: User[]): string {
    const headers = [
      'Team Name',
      'League',
      'Description',
      'Player Count',
      'Players',
      'Captain',
      'Captain Email',
      'Created Date',
      'Is Active',
      'League Start Date',
      'League End Date'
    ];

    const csvRows = [headers.join(',')];

    for (const team of teams) {
      const league = leagues.find(l => l.id === team.leagueId);
      const captain = allUsers.find(u => u.id === team.captain);
      const players = allUsers.filter(u => team.players.includes(u.id));
      const playerNames = players.map(p => p.name).join('; ');

      const row = [
        this.escapeCSVField(team.name),
        this.escapeCSVField(league?.name || 'Unknown League'),
        this.escapeCSVField(team.description),
        team.players.length.toString(),
        this.escapeCSVField(playerNames),
        this.escapeCSVField(captain?.name || 'No Captain'),
        this.escapeCSVField(captain?.email || ''),
        new Date(team.createdAt).toLocaleDateString(),
        team.isActive ? 'Yes' : 'No',
        league ? new Date(league.startDate).toLocaleDateString() : '',
        league ? new Date(league.endDate).toLocaleDateString() : ''
      ];

      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  private generateLeaguesCSV(leagues: League[], teams: Team[]): string {
    const headers = [
      'League Name',
      'Description',
      'Skill Level',
      'Day of Week',
      'Time',
      'Location',
      'Regular Price',
      'Early Price',
      'Registration Deadline',
      'Start Date',
      'End Date',
      'Status',
      'Team Count',
      'Total Players',
      'Is Active',
      'Created Date'
    ];

    const csvRows = [headers.join(',')];

    for (const league of leagues) {
      const leagueTeams = teams.filter(team => team.leagueId === league.id && team.isActive);
      const totalPlayers = leagueTeams.reduce((sum, team) => sum + team.players.length, 0);
      const status = this.getLeagueStatus(league);

      const row = [
        this.escapeCSVField(league.name),
        this.escapeCSVField(league.description),
        this.escapeCSVField(league.skillLevel),
        this.escapeCSVField(league.dayOfWeek),
        this.escapeCSVField(league.time),
        this.escapeCSVField(league.location),
        league.regularPrice.toString(),
        league.earlyPrice.toString(),
        new Date(league.registrationDeadline).toLocaleDateString(),
        new Date(league.startDate).toLocaleDateString(),
        new Date(league.endDate).toLocaleDateString(),
        this.escapeCSVField(status),
        leagueTeams.length.toString(),
        totalPlayers.toString(),
        league.isActive ? 'Yes' : 'No',
        new Date(league.createdAt).toLocaleDateString()
      ];

      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  private getLeagueStatus(league: League): string {
    const now = new Date();
    const registrationDeadline = new Date(league.registrationDeadline);
    const startDate = new Date(league.startDate);
    const endDate = new Date(league.endDate);

    if (!league.isActive) return 'Inactive';
    if (now < registrationDeadline) return 'Registration Open';
    if (now < startDate) return 'Pre-Season';
    if (now <= endDate) return 'Active';
    return 'Completed';
  }
}

export const csvExporter = new CSVExporter();