import { League, ScheduleGame } from '../types';

export interface GameDate {
  gameId: string;
  date: string;
  time: string;
}

/**
 * Calculate actual calendar dates for scheduled games based on league start date
 */
export function calculateGameDates(league: League, schedule: ScheduleGame[]): GameDate[] {
  const gameDates: GameDate[] = [];
  const startDate = new Date(league.startDate);
  const dayOfWeekMap = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  
  const targetDayOfWeek = dayOfWeekMap[league.dayOfWeek];
  
  // Find the first occurrence of the target day of week on or after start date
  let currentDate = new Date(startDate);
  while (currentDate.getDay() !== targetDayOfWeek) {
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Group games by week
  const gamesByWeek: { [week: number]: ScheduleGame[] } = {};
  schedule.forEach(game => {
    if (!gamesByWeek[game.week]) {
      gamesByWeek[game.week] = [];
    }
    gamesByWeek[game.week].push(game);
  });
  
  // Calculate dates for each week
  const weeks = Object.keys(gamesByWeek).map(Number).sort((a, b) => a - b);
  
  weeks.forEach(week => {
    // Calculate the date for this week (week 1 = first game date, week 2 = 7 days later, etc.)
    const weekDate = new Date(currentDate);
    weekDate.setDate(currentDate.getDate() + ((week - 1) * 7));
    
    // Format date as YYYY-MM-DD
    const formattedDate = weekDate.toISOString().split('T')[0];
    
    // Add all games for this week
    gamesByWeek[week].forEach(game => {
      const gameId = `${game.homeTeamId}_${game.awayTeamId}_w${game.week}`;
      
      gameDates.push({
        gameId,
        date: formattedDate,
        time: game.startTime
      });
    });
  });
  
  return gameDates;
}

/**
 * Get the next N weeks of dates for a given day of the week
 */
export function getNextGameDates(startDate: Date, dayOfWeek: string, numberOfWeeks: number): Date[] {
  const dates: Date[] = [];
  const dayOfWeekMap = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  
  const targetDayOfWeek = dayOfWeekMap[dayOfWeek as keyof typeof dayOfWeekMap];
  
  // Find the first occurrence of the target day of week on or after start date
  let currentDate = new Date(startDate);
  while (currentDate.getDay() !== targetDayOfWeek) {
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Add the first date
  dates.push(new Date(currentDate));
  
  // Add subsequent weeks
  for (let i = 1; i < numberOfWeeks; i++) {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + (i * 7));
    dates.push(nextDate);
  }
  
  return dates;
}

/**
 * Format time string consistently
 */
export function formatTime(timeString: string): string {
  // Handle various time formats and normalize to "H:MM AM/PM" format
  const time = timeString.trim();
  
  // If already in correct format, return as is
  if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(time)) {
    return time.toUpperCase();
  }
  
  // Try to parse 24-hour format
  const match24Hour = time.match(/^(\d{1,2}):(\d{2})$/);
  if (match24Hour) {
    const hours = parseInt(match24Hour[1]);
    const minutes = match24Hour[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    return `${displayHours}:${minutes} ${ampm}`;
  }
  
  // If we can't parse it, return as is
  return time;
}

/**
 * Calculate total season duration in days
 */
export function calculateSeasonDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if a given date falls within the league season
 */
export function isDateInSeason(date: Date, league: League): boolean {
  const startDate = new Date(league.startDate);
  const endDate = new Date(league.endDate);
  return date >= startDate && date <= endDate;
}

/**
 * Get week number for a given date within a season
 */
export function getWeekNumber(gameDate: Date, seasonStartDate: Date): number {
  const timeDiff = gameDate.getTime() - seasonStartDate.getTime();
  const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  return Math.floor(daysDiff / 7) + 1;
}