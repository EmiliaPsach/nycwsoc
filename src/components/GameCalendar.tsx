// components/GameCalendar.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { Game, Team } from '../types';
import {
  cardStyles,
  headerStyles,
  textStyles,
  colors,
  spacing,
  typography,
} from '../styles';

const { width } = Dimensions.get('window');

interface GameCalendarProps {
  games: Game[];
  teams: Team[];
  currentMonth: Date;
  onNavigateMonth: (direction: 'prev' | 'next') => void;
  onGamePress: (gameId: string) => void;
  getTeamName: (teamId: string) => string;
  isUserTeam?: (teamId: string) => boolean;
}

export const GameCalendar: React.FC<GameCalendarProps> = ({
  games,
  teams,
  currentMonth,
  onNavigateMonth,
  onGamePress,
  getTeamName,
  isUserTeam = () => false,
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarVisible, setCalendarVisible] = useState(false);

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

  const CalendarGameItem = ({ game }: { game: Game }) => {
    const getShortTeamName = (name: string) => {
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
        onPress={() => onGamePress(game.id)}
      >
        <Text style={{
          fontSize: 9,
          color: colors.text.inverse,
          fontWeight: typography.weight.medium,
        }}>
          {game.time} {getShortTeamName(getTeamName(game.homeTeam))} vs {getShortTeamName(getTeamName(game.awayTeam))}
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

  const GameCard = ({ game }: { game: Game }) => (
    <TouchableOpacity 
      style={cardStyles.card}
      onPress={() => onGamePress(game.id)}
    >
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md}}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={[{fontSize: typography.size.sm, fontWeight: typography.weight.semiBold}, { color: colors.primary }]}>
            {game.status}
          </Text>
        </View>
        <Text style={[textStyles.small, {fontWeight: typography.weight.medium}]}>Week {game.week}</Text>
      </View>

      <View style={{flex: 1}}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm}}>
          <Text style={[{fontSize: typography.size.md, fontWeight: typography.weight.semiBold, color: colors.text.primary, flex: 1, textAlign: 'center'}, isUserTeam(game.homeTeam) && {color: colors.primary, fontWeight: typography.weight.bold}]}>
            {getTeamName(game.homeTeam)}
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
            {getTeamName(game.awayTeam)}
          </Text>
        </View>
        
        <Text style={[{fontSize: typography.size.md, color: colors.primary, fontWeight: typography.weight.semiBold, marginBottom: spacing.xs}]}>{game.time}</Text>
        <Text style={textStyles.caption}>📍 {game.location}</Text>
      </View>
    </TouchableOpacity>
  );

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
            onPress={() => onNavigateMonth('prev')}
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
            onPress={() => onNavigateMonth('next')}
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

  return renderCalendarView();
};