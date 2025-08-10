import { League, Team, ScheduleGame } from '../types';

export interface ScheduleStats {
  totalGames: number;
  gamesPerTeam: { [teamId: string]: number };
  byeWeeksPerTeam: { [teamId: string]: number };
  maxGamesPerTeam: number;
  minGamesPerTeam: number;
}

export class GameScheduler {
  private league: League;
  private teams: Team[];
  private availableFields: number;
  private gameStartTimes: string[];
  private seasonWeeks: number;
  private gamesPerWeek: number;
  private maxTeamsPerWeek: number;

  constructor(league: League, teams: Team[]) {
    this.league = league;
    this.teams = teams.filter(team => team.isActive);
    this.availableFields = league.availableFields || 1;
    this.gameStartTimes = league.gameStartTimes || [league.time];
    this.seasonWeeks = league.seasonWeeks || 12;
    this.gamesPerWeek = this.availableFields * this.gameStartTimes.length;
    this.maxTeamsPerWeek = this.gamesPerWeek * 2;
  }

  /**
   * Generate a complete season schedule using round-robin with optimal bye week distribution
   */
  generateSeasonSchedule(): ScheduleGame[] {
    if (this.teams.length < 2) {
      return [];
    }

    const schedule: ScheduleGame[] = [];
    const teamIds = this.teams.map(team => team.id);
    
    // Generate matchups - for small number of teams, repeat rounds to fill season
    const allMatchups = this.generateExtendedMatchups(teamIds);
    
    // Distribute matchups across weeks with even bye week distribution
    const weeklySchedule = this.distributeMatchupsAcrossWeeks(allMatchups, teamIds);
    
    // Assign fields and times
    weeklySchedule.forEach((weekGames, weekIndex) => {
      weekGames.forEach((matchup, gameIndex) => {
        const fieldNumber = Math.floor(gameIndex / this.gameStartTimes.length) + 1;
        const timeSlot = gameIndex % this.gameStartTimes.length;
        
        schedule.push({
          homeTeamId: matchup.home,
          awayTeamId: matchup.away,
          week: weekIndex + 1,
          startTime: this.gameStartTimes[timeSlot],
          fieldNumber: fieldNumber
        });
      });
    });

    return schedule;
  }

  /**
   * Generate extended matchups to fill the season properly
   */
  private generateExtendedMatchups(teamIds: string[]): Array<{home: string, away: string}> {
    const singleRoundMatchups = this.generateRoundRobinMatchups(teamIds);
    const totalSlotsAvailable = this.seasonWeeks * this.gamesPerWeek;
    
    // If we don't have enough matchups to fill the season, repeat rounds
    let allMatchups: Array<{home: string, away: string}> = [...singleRoundMatchups];
    
    while (allMatchups.length < totalSlotsAvailable && singleRoundMatchups.length > 0) {
      // Add another round, alternating home/away from previous rounds
      const nextRound = singleRoundMatchups.map(matchup => ({
        home: matchup.away, // Swap home/away for fairness
        away: matchup.home
      }));
      
      allMatchups = [...allMatchups, ...nextRound];
    }
    
    // Trim to fit exactly in available slots if needed
    return allMatchups.slice(0, totalSlotsAvailable);
  }

  /**
   * Generate round-robin matchups where each team plays every other team once
   */
  private generateRoundRobinMatchups(teamIds: string[]): Array<{home: string, away: string}> {
    const matchups: Array<{home: string, away: string}> = [];
    
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        // Alternate home/away to balance
        if (matchups.length % 2 === 0) {
          matchups.push({ home: teamIds[i], away: teamIds[j] });
        } else {
          matchups.push({ home: teamIds[j], away: teamIds[i] });
        }
      }
    }
    
    return matchups;
  }

  /**
   * Distribute matchups across weeks with optimal bye week distribution
   */
  private distributeMatchupsAcrossWeeks(
    matchups: Array<{home: string, away: string}>, 
    teamIds: string[]
  ): Array<Array<{home: string, away: string}>> {
    const weeklySchedule: Array<Array<{home: string, away: string}>> = [];
    const remainingMatchups = [...matchups];
    const teamLastPlayedWeek: { [teamId: string]: number } = {};
    const teamByeWeeks: { [teamId: string]: number } = {};
    
    // Initialize bye week counters
    teamIds.forEach(teamId => {
      teamByeWeeks[teamId] = 0;
      teamLastPlayedWeek[teamId] = 0;
    });

    for (let week = 1; week <= this.seasonWeeks; week++) {
      const weekGames: Array<{home: string, away: string}> = [];
      const playingThisWeek = new Set<string>();
      
      // Try to schedule games for this week
      let gamesScheduled = 0;
      let attempts = 0;
      const maxAttempts = remainingMatchups.length * 2;
      
      while (gamesScheduled < this.gamesPerWeek && remainingMatchups.length > 0 && attempts < maxAttempts) {
        attempts++;
        
        // Find best matchup for this week
        const bestMatchupIndex = this.findBestMatchupForWeek(
          remainingMatchups, 
          playingThisWeek, 
          teamLastPlayedWeek, 
          week
        );
        
        if (bestMatchupIndex !== -1) {
          const matchup = remainingMatchups.splice(bestMatchupIndex, 1)[0];
          weekGames.push(matchup);
          playingThisWeek.add(matchup.home);
          playingThisWeek.add(matchup.away);
          teamLastPlayedWeek[matchup.home] = week;
          teamLastPlayedWeek[matchup.away] = week;
          gamesScheduled++;
        } else {
          // No valid matchup found for this week
          break;
        }
      }
      
      // Count bye weeks for teams not playing
      teamIds.forEach(teamId => {
        if (!playingThisWeek.has(teamId)) {
          teamByeWeeks[teamId]++;
        }
      });
      
      weeklySchedule.push(weekGames);
    }
    
    return weeklySchedule;
  }

  /**
   * Find the best matchup for a given week considering rest periods and bye week balance
   */
  private findBestMatchupForWeek(
    availableMatchups: Array<{home: string, away: string}>,
    playingThisWeek: Set<string>,
    teamLastPlayedWeek: { [teamId: string]: number },
    currentWeek: number
  ): number {
    let bestIndex = -1;
    let bestScore = -1;
    
    availableMatchups.forEach((matchup, index) => {
      const { home, away } = matchup;
      
      // Skip if either team is already playing this week
      if (playingThisWeek.has(home) || playingThisWeek.has(away)) {
        return;
      }
      
      // Calculate score for this matchup (higher is better)
      let score = 0;
      
      // Prefer teams that haven't played recently
      const homeRestWeeks = currentWeek - teamLastPlayedWeek[home];
      const awayRestWeeks = currentWeek - teamLastPlayedWeek[away];
      score += homeRestWeeks + awayRestWeeks;
      
      // Add randomization to prevent always picking the same teams first
      score += Math.random() * 2;
      
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    
    return bestIndex;
  }

  /**
   * Calculate statistics for a generated schedule
   */
  getScheduleStats(schedule: ScheduleGame[]): ScheduleStats {
    const gamesPerTeam: { [teamId: string]: number } = {};
    const teamWeeksPlaying: { [teamId: string]: Set<number> } = {};
    
    // Initialize counters
    this.teams.forEach(team => {
      gamesPerTeam[team.id] = 0;
      teamWeeksPlaying[team.id] = new Set();
    });
    
    // Count games and playing weeks for each team
    schedule.forEach(game => {
      gamesPerTeam[game.homeTeamId]++;
      gamesPerTeam[game.awayTeamId]++;
      teamWeeksPlaying[game.homeTeamId].add(game.week);
      teamWeeksPlaying[game.awayTeamId].add(game.week);
    });
    
    // Calculate bye weeks
    const byeWeeksPerTeam: { [teamId: string]: number } = {};
    this.teams.forEach(team => {
      byeWeeksPerTeam[team.id] = this.seasonWeeks - teamWeeksPlaying[team.id].size;
    });
    
    const gamesCounts = Object.values(gamesPerTeam);
    
    return {
      totalGames: schedule.length,
      gamesPerTeam,
      byeWeeksPerTeam,
      maxGamesPerTeam: Math.max(...gamesCounts),
      minGamesPerTeam: Math.min(...gamesCounts)
    };
  }

  /**
   * Validate if a schedule can be generated with current parameters
   */
  validateSchedulingParameters(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (this.teams.length < 2) {
      issues.push('Need at least 2 teams to create a schedule');
    }
    
    if (this.availableFields < 1) {
      issues.push('Need at least 1 field available');
    }
    
    if (this.gameStartTimes.length < 1) {
      issues.push('Need at least 1 game start time');
    }
    
    if (this.seasonWeeks < 1) {
      issues.push('Season must be at least 1 week long');
    }
    
    // For validation, we just need to ensure basic constraints are met
    // The extended matching algorithm will handle filling the season appropriately
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}