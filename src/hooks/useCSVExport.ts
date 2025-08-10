// hooks/useCSVExport.ts
import { useState } from 'react';
import { csvExporter } from '../utils/csvExport';
import { User, Team, League, Game } from '../types';

interface UseCSVExportReturn {
  isExporting: boolean;
  exportPlayers: (players: User[], teams: Team[], options?: { searchText?: string }) => Promise<void>;
  exportTeams: (teams: Team[], leagues: League[], allUsers: User[], options?: { searchText?: string }) => Promise<void>;
  exportLeagues: (leagues: League[], teams: Team[], options?: { searchText?: string }) => Promise<void>;
  exportGames: (games: Game[], teams: Team[], leagues: League[], options?: { searchText?: string }) => Promise<void>;
}

export const useCSVExport = (): UseCSVExportReturn => {
  const [isExporting, setIsExporting] = useState(false);

  const exportPlayers = async (
    players: User[], 
    teams: Team[], 
    options: { searchText?: string } = {}
  ): Promise<void> => {
    if (isExporting || players.length === 0) return;
    
    try {
      setIsExporting(true);
      await csvExporter.exportPlayers(players, teams, options);
    } catch (error) {
      if (error instanceof Error && error.message !== 'Export cancelled') {
        console.error('Export failed:', error);
        // Error alert is handled in the csvExporter
      }
    } finally {
      setIsExporting(false);
    }
  };

  const exportTeams = async (
    teams: Team[], 
    leagues: League[], 
    allUsers: User[], 
    options: { searchText?: string } = {}
  ): Promise<void> => {
    if (isExporting || teams.length === 0) return;
    
    try {
      setIsExporting(true);
      await csvExporter.exportTeams(teams, leagues, allUsers, options);
    } catch (error) {
      if (error instanceof Error && error.message !== 'Export cancelled') {
        console.error('Export failed:', error);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const exportLeagues = async (
    leagues: League[], 
    teams: Team[], 
    options: { searchText?: string } = {}
  ): Promise<void> => {
    if (isExporting || leagues.length === 0) return;
    
    try {
      setIsExporting(true);
      await csvExporter.exportLeagues(leagues, teams, options);
    } catch (error) {
      if (error instanceof Error && error.message !== 'Export cancelled') {
        console.error('Export failed:', error);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const exportGames = async (
    games: Game[],
    teams: Team[],
    leagues: League[],
    options: { searchText?: string } = {}
  ): Promise<void> => {
    if (isExporting || games.length === 0) return;
    
    try {
      setIsExporting(true);
      await csvExporter.exportGames(games, teams, leagues, options);
    } catch (error) {
      if (error instanceof Error && error.message !== 'Export cancelled') {
        console.error('Export failed:', error);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportPlayers,
    exportTeams,
    exportLeagues,
    exportGames,
  };
};