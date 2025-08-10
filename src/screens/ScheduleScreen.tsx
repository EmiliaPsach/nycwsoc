import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { Game, Team } from '../types';
import { GameCalendar } from '../components/GameCalendar';
import {
  globalStyles,
  cardStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  colors,
  spacing,
  typography,
  statusStyles,
  screenConfig
} from '../styles';

const { width } = Dimensions.get('window');

type ViewMode = 'list' | 'calendar';

const ScheduleScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dataStore = new DataStore();

  const loadData = async () => {
    if (!user) return;

    try {
      const userGames = await dataStore.getGamesForUser(user.id);
      const userTeams = await dataStore.getTeamsForUser(user.id);
      
      // Sort games by date
      const sortedGames = userGames.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setGames(sortedGames);
      setTeams(userTeams);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load schedule data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getTeamName = async (teamId: string): Promise<string> => {
    const team = await dataStore.getTeam(teamId);
    return team?.name || 'Unknown Team';
  };

  const formatGameDate = (date: string, time: string) => {
    const gameDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (gameDate.toDateString() === today.toDateString()) {
      return `Today at ${time}`;
    } else if (gameDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${time}`;
    } else {
      return `${gameDate.toLocaleDateString()} at ${time}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return colors.status.scheduled;
      case 'In Progress': return colors.status.inProgress;
      case 'Completed': return colors.status.completed;
      case 'Cancelled': return colors.status.cancelled;
      default: return colors.text.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Scheduled': return '📅';
      case 'In Progress': return '⚽';
      case 'Completed': return '✅';
      case 'Cancelled': return '❌';
      default: return '📅';
    }
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getGamesForDate = (date: Date) => {
    return games.filter(game => {
      const gameDate = new Date(game.date);
      return gameDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const GameCard = ({ game }: { game: Game }) => {
    const [homeTeamName, setHomeTeamName] = useState('');
    const [awayTeamName, setAwayTeamName] = useState('');

    useEffect(() => {
      const loadTeamNames = async () => {
        const homeName = await getTeamName(game.homeTeam);
        const awayName = await getTeamName(game.awayTeam);
        setHomeTeamName(homeName);
        setAwayTeamName(awayName);
      };
      loadTeamNames();
    }, [game]);

    const isUserTeam = (teamId: string) => {
      return teams.some(team => team.id === teamId);
    };

    return (
      <TouchableOpacity 
        style={cardStyles.card}
        onPress={() => navigation.navigate('GameDetail', { gameId: game.id })}
      >
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={{marginRight: spacing.xs, fontSize: typography.size.md}}>{getStatusIcon(game.status)}</Text>
            <Text style={[{fontSize: typography.size.sm, fontWeight: typography.weight.semiBold}, { color: getStatusColor(game.status) }]}>
              {game.status}
            </Text>
          </View>
          <Text style={[textStyles.small, {fontWeight: typography.weight.medium}]}>Week {game.week}</Text>
        </View>

        <View style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm}}>
            <Text style={[{fontSize: typography.size.md, fontWeight: typography.weight.semiBold, color: colors.text.primary, flex: 1, textAlign: 'center'}, isUserTeam(game.homeTeam) && {color: colors.primary, fontWeight: typography.weight.bold}]}>
              {homeTeamName}
            </Text>
            <View style={{marginHorizontal: spacing.sm}}>
              {game.homeScore !== undefined && game.awayScore !== undefined ? (
                <Text style={{fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.primary}}>
                  {game.homeScore} - {game.awayScore}
                </Text>
              ) : (
                <Text style={textStyles.caption}>vs</Text>
              )}
            </View>
            <Text style={[{fontSize: typography.size.md, fontWeight: typography.weight.semiBold, color: colors.text.primary, flex: 1, textAlign: 'center'}, isUserTeam(game.awayTeam) && {color: colors.primary, fontWeight: typography.weight.bold}]}>
              {awayTeamName}
            </Text>
          </View>
          
          <Text style={[{fontSize: typography.size.md, color: colors.primary, fontWeight: typography.weight.semiBold, marginBottom: spacing.xs}]}>{formatGameDate(game.date, game.time)}</Text>
          <Text style={textStyles.caption}>📍 {game.location}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const CalendarGameItem = ({ game }: { game: Game }) => {
    const [homeTeamName, setHomeTeamName] = useState('');
    const [awayTeamName, setAwayTeamName] = useState('');

    useEffect(() => {
      const loadTeamNames = async () => {
        const homeName = await getTeamName(game.homeTeam);
        const awayName = await getTeamName(game.awayTeam);
        setHomeTeamName(homeName);
        setAwayTeamName(awayName);
      };
      loadTeamNames();
    }, [game]);

    const isUserTeam = (teamId: string) => {
      return teams.some(team => team.id === teamId);
    };

    const getShortTeamName = (name: string) => {
      // Get first 3 characters or abbreviation
      return name.length > 8 ? name.substring(0, 6) + '...' : name;
    };

    return (
      <TouchableOpacity
        style={{
          backgroundColor: colors.primary,
          borderRadius: 4,
          padding: 2,
          marginBottom: 2,
          minHeight: 16,
        }}
        onPress={() => navigation.navigate('GameDetail', { gameId: game.id })}
      >
        <Text style={{
          fontSize: 9,
          color: colors.text.inverse,
          fontWeight: typography.weight.medium,
        }}>
          {game.time} {getShortTeamName(homeTeamName)} vs {getShortTeamName(awayTeamName)}
        </Text>
      </TouchableOpacity>
    );
  };

  const CalendarDay = ({ date, isCurrentMonth }: { date: Date; isCurrentMonth: boolean }) => {
    const dayGames = getGamesForDate(date);
    const isToday = date.toDateString() === new Date().toDateString();

    return (
      <View
        style={{
          width: (width - spacing.xl * 2) / 7,
          minHeight: 80,
          borderWidth: 0.5,
          borderColor: colors.border.light,
          backgroundColor: isToday ? colors.background.card : colors.background.card,
          padding: 2,
          opacity: isCurrentMonth ? 1 : 0.3,
        }}
      >
        <Text style={{
          fontSize: typography.size.xs,
          fontWeight: isToday ? typography.weight.bold : typography.weight.medium,
          color: isToday ? colors.primary : colors.text.primary,
          textAlign: 'center',
          marginBottom: 2,
        }}>
          {date.getDate()}
        </Text>
        
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {dayGames.slice(0, 3).map((game, index) => (
            <CalendarGameItem key={game.id} game={game} />
          ))}
          {dayGames.length > 3 && (
            <TouchableOpacity
              style={{
                backgroundColor: colors.text.secondary,
                borderRadius: 2,
                padding: 1,
                alignItems: 'center',
              }}
              onPress={() => {
                setSelectedDate(date);
                setCalendarVisible(true);
              }}
            >
              <Text style={{
                fontSize: 8,
                color: colors.text.inverse,
                fontWeight: typography.weight.medium,
              }}>
                +{dayGames.length - 3} more
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderCalendarView = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      const prevMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), -firstDay + i + 1);
      days.push(
        <CalendarDay key={`prev-${i}`} date={prevMonthDate} isCurrentMonth={false} />
      );
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      days.push(
        <CalendarDay key={day} date={date} isCurrentMonth={true} />
      );
    }

    // Add empty cells for days after the last day of the month to complete the grid
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    for (let i = firstDay + daysInMonth; i < totalCells; i++) {
      const nextMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i - firstDay - daysInMonth + 1);
      days.push(
        <CalendarDay key={`next-${i}`} date={nextMonthDate} isCurrentMonth={false} />
      );
    }

    return (
      <View style={{ paddingHorizontal: spacing.xl }}>
        {/* Calendar Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.lg,
          backgroundColor: colors.background.card,
          borderRadius: 12,
          padding: spacing.md,
        }}>
          <TouchableOpacity
            onPress={() => navigateMonth('prev')}
            style={{
              padding: spacing.sm,
              borderRadius: 8,
              backgroundColor: colors.background.main,
            }}
          >
            <Text style={{ fontSize: typography.size.lg, color: colors.primary }}>‹</Text>
          </TouchableOpacity>
          
          <Text style={{
            fontSize: typography.size.lg,
            fontWeight: typography.weight.bold,
            color: colors.text.primary,
          }}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          
          <TouchableOpacity
            onPress={() => navigateMonth('next')}
            style={{
              padding: spacing.sm,
              borderRadius: 8,
              backgroundColor: colors.background.main,
            }}
          >
            <Text style={{ fontSize: typography.size.lg, color: colors.primary }}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day labels */}
        <View style={{
          flexDirection: 'row',
          marginBottom: spacing.sm,
        }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <View key={day} style={{ width: (width - spacing.xl * 2) / 7, alignItems: 'center' }}>
              <Text style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.semiBold,
                color: colors.text.secondary,
              }}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={{
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: colors.background.card,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}>
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
          }}>
            {days}
          </View>
        </View>

        {/* Legend */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.background.card,
          borderRadius: 8,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: spacing.lg }}>
            <View style={{
              width: 16,
              height: 8,
              borderRadius: 2,
              backgroundColor: colors.primary,
              marginRight: spacing.xs,
            }} />
            <Text style={textStyles.small}>Games</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              backgroundColor: colors.background.disabled,
              marginRight: spacing.xs,
              borderWidth: 1,
              borderColor: colors.primary,
            }} />
            <Text style={textStyles.small}>Today</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderGamesByDate = () => {
    const gamesByDate = games.reduce((acc, game) => {
      const dateKey = new Date(game.date).toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(game);
      return acc;
    }, {} as { [key: string]: Game[] });

    return Object.keys(gamesByDate).map(dateKey => {
      const date = new Date(dateKey);
      const dateGames = gamesByDate[dateKey];
      
      return (
        <View key={dateKey} style={{marginBottom: spacing.xl}}>
          <Text style={[headerStyles.sectionTitle, {marginLeft: spacing.xl, marginRight: spacing.xl, marginBottom: spacing.sm, marginTop: spacing.sm, fontSize: typography.size.lg, fontWeight: typography.weight.semiBold}]}>
            {date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          {dateGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </View>
      );
    });
  };

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading schedule...</Text>
      </View>
    );
  }

  return (
    <View style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]}>
      <View style={headerStyles.header}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}>
          <Text style={headerStyles.headerTitle}>Schedule</Text>
          
          {/* View Toggle */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: colors.background.card,
            borderRadius: 8,
            padding: 2,
          }}>
            <TouchableOpacity
              onPress={() => setViewMode('list')}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: 6,
                backgroundColor: viewMode === 'list' ? colors.primary : 'transparent',
              }}
            >
              <Text style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.medium,
                color: viewMode === 'list' ? colors.text.inverse : colors.text.secondary,
              }}>
                List
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('calendar')}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: 6,
                backgroundColor: viewMode === 'calendar' ? colors.primary : 'transparent',
              }}
            >
              <Text style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.medium,
                color: viewMode === 'calendar' ? colors.text.inverse : colors.text.secondary,
              }}>
                Calendar
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          <View style={{alignItems: 'center'}}>
            <Text style={[{fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.primary}]}>{games.length}</Text>
            <Text style={[textStyles.small, {marginTop: 2}]}>Total Games</Text>
          </View>
          <View style={{alignItems: 'center'}}>
            <Text style={[{fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.primary}]}>
              {games.filter(g => g.status === 'Scheduled').length}
            </Text>
            <Text style={[textStyles.small, {marginTop: 2}]}>Upcoming</Text>
          </View>
          <View style={{alignItems: 'center'}}>
            <Text style={[{fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: colors.primary}]}>
              {games.filter(g => g.status === 'Completed').length}
            </Text>
            <Text style={[textStyles.small, {marginTop: 2}]}>Played</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{flex: 1}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {games.length === 0 ? (
          <View style={globalStyles.emptyState}>
            <Text style={{fontSize: 64, marginBottom: spacing.lg}}>📅</Text>
            <Text style={[textStyles.title, {marginBottom: spacing.sm, fontSize: typography.size.xl}]}>No Games Scheduled</Text>
            <Text style={[globalStyles.emptyText, {lineHeight: typography.size.md * typography.lineHeight.relaxed}]}>
              Join a league to start playing games!
            </Text>
            <TouchableOpacity 
              style={[buttonStyles.primary, {paddingHorizontal: spacing.xxl, paddingVertical: spacing.md}]}
              onPress={() => navigation.navigate('Leagues')}
            >
              <Text style={buttonStyles.primaryText}>Join a League</Text>
            </TouchableOpacity>
          </View>
        ) : (
          viewMode === 'list' ? renderGamesByDate() : (
            <GameCalendar
              games={games}
              teams={teams}
              currentMonth={currentMonth}
              onNavigateMonth={navigateMonth}
              onGamePress={(gameId) => navigation.navigate('GameDetail', { gameId })}
              getTeamName={async (teamId) => {
                const team = await dataStore.getTeam(teamId);
                return team?.name || 'Unknown Team';
              }}
              isUserTeam={(teamId) => teams.some(team => team.id === teamId)}
            />
          )
        )}
      </ScrollView>

      {/* Modal for showing games on selected date */}
      <Modal
        visible={calendarVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: colors.background.card,
            borderRadius: 16,
            padding: spacing.xl,
            margin: spacing.xl,
            maxHeight: '80%',
            width: '90%',
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.lg,
            }}>
              <Text style={{
                fontSize: typography.size.lg,
                fontWeight: typography.weight.bold,
                color: colors.text.primary,
              }}>
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
              <TouchableOpacity onPress={() => setCalendarVisible(false)}>
                <Text style={{
                  fontSize: typography.size.xl,
                  color: colors.text.secondary,
                }}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              {getGamesForDate(selectedDate).map(game => (
                <GameCard key={game.id} game={game} />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ScheduleScreen;