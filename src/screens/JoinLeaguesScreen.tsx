import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { League, FreeAgentRegistration } from '../types';
import {
  globalStyles,
  cardStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  formStyles,
  modalStyles,
  colors,
  spacing,
  typography,
  borderRadius,
  statusStyles
} from '../styles';

const JoinLeaguesScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [filteredLeagues, setFilteredLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [joinType, setJoinType] = useState<'team' | 'freeAgent'>('freeAgent');
  const [registrations, setRegistrations] = useState<FreeAgentRegistration[]>([]);
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const dataStore = new DataStore();

  const loadData = async () => {
    if (!user) return;

    try {
      const allLeagues = await dataStore.getLeagues();
      const userRegistrations = await dataStore.getFreeAgentRegistrationsForUser(user.id);
      
      setLeagues(allLeagues);
      setFilteredLeagues(allLeagues);
      setRegistrations(userRegistrations);
    } catch (error) {
      console.error('Error loading leagues:', error);
      Alert.alert('Error', 'Failed to load leagues');
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

  const applyFilters = useCallback(() => {
    let filtered = leagues;

    if (searchText) {
      filtered = filtered.filter(league =>
        league.name.toLowerCase().includes(searchText.toLowerCase()) ||
        league.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (locationFilter) {
      filtered = filtered.filter(league =>
        league.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (skillFilter) {
      filtered = filtered.filter(league =>
        league.skillLevel.toLowerCase() === skillFilter.toLowerCase() ||
        league.skillLevel === 'All Levels'
      );
    }

    if (dayFilter) {
      filtered = filtered.filter(league =>
        league.dayOfWeek.toLowerCase() === dayFilter.toLowerCase()
      );
    }

    setFilteredLeagues(filtered);
  }, [leagues, searchText, locationFilter, skillFilter, dayFilter]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const clearFilters = () => {
    setSearchText('');
    setLocationFilter('');
    setSkillFilter('');
    setDayFilter('');
    setFilteredLeagues(leagues);
  };

  const isRegistered = (leagueId: string) => {
    return registrations.some(reg => reg.leagueId === leagueId);
  };

  const getRegistrationStatus = (leagueId: string) => {
    const registration = registrations.find(reg => reg.leagueId === leagueId);
    return registration?.status || null;
  };

  const handleJoinLeague = async (type: 'team' | 'freeAgent') => {
    if (!selectedLeague || !user) return;

    try {
      if (type === 'freeAgent') {
        await dataStore.createFreeAgentRegistration(user.id, selectedLeague.id);
        Alert.alert(
          'Success!',
          `You've registered as a free agent for ${selectedLeague.name}. You'll be notified when assigned to a team.`
        );
      } else {
        Alert.alert(
          'Team Registration',
          'Team registration feature coming soon! Contact league organizers directly.'
        );
      }

      setModalVisible(false);
      setSelectedLeague(null);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error joining league:', error);
      Alert.alert('Error', 'Failed to join league. Please try again.');
    }
  };

  const getSkillLevelColor = (skillLevel: string) => {
    switch (skillLevel) {
      case 'Beginner': return colors.secondary;
      case 'Intermediate': return colors.warning;
      case 'Advanced': return colors.danger;
      case 'All Levels': return colors.primary;
      default: return colors.text.secondary;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilDeadline = (deadlineString: string) => {
    const deadline = new Date(deadlineString);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const LeagueCard = ({ league }: { league: League }) => {
    const daysLeft = getDaysUntilDeadline(league.registrationDeadline);
    const registered = isRegistered(league.id);
    const registrationStatus = getRegistrationStatus(league.id);

    return (
      <TouchableOpacity 
        style={cardStyles.card}
        onPress={() => {
          setSelectedLeague(league);
          setModalVisible(true);
        }}
      >
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm}}>
          <Text style={[textStyles.title, {fontSize: typography.size.lg, flex: 1}]}>{league.name}</Text>
          <View style={[statusStyles.badge, { backgroundColor: getSkillLevelColor(league.skillLevel) }]}>
            <Text style={[statusStyles.badgeText, {color: colors.text.inverse, textTransform: 'none'}]}>{league.skillLevel}</Text>
          </View>
        </View>

        <Text style={[textStyles.body, {color: colors.text.secondary, lineHeight: typography.size.sm * typography.lineHeight.relaxed, marginBottom: spacing.md}]}>{league.description}</Text>

        <View style={{marginBottom: spacing.md}}>
          <View style={{flexDirection: 'row', marginBottom: spacing.xs}}>
            <Text style={[textStyles.caption, {width: 100}]}>📍 Location:</Text>
            <Text style={[textStyles.body, {fontWeight: typography.weight.medium, flex: 1}]}>{league.location}</Text>
          </View>
          <View style={{flexDirection: 'row', marginBottom: spacing.xs}}>
            <Text style={[textStyles.caption, {width: 100}]}>🗓️ Schedule:</Text>
            <Text style={[textStyles.body, {fontWeight: typography.weight.medium, flex: 1}]}>{league.dayOfWeek}s at {league.time}</Text>
          </View>
          <View style={{flexDirection: 'row', marginBottom: spacing.xs}}>
            <Text style={[textStyles.caption, {width: 100}]}>🎯 Season:</Text>
            <Text style={[textStyles.body, {fontWeight: typography.weight.medium, flex: 1}]}>{league.season}</Text>
          </View>
          <View style={{flexDirection: 'row', marginBottom: spacing.xs}}>
            <Text style={[textStyles.caption, {width: 100}]}>💰 Price:</Text>
            <Text style={[textStyles.body, {fontWeight: typography.weight.medium, flex: 1}]}>${league.price}</Text>
          </View>
        </View>

        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
          <View style={{flex: 1}}>
            <Text style={textStyles.small}>
              {league.currentTeams}/{league.maxTeams} teams
            </Text>
            {daysLeft > 0 && (
              <Text style={[textStyles.small, {color: colors.warning, marginTop: 2}, daysLeft <= 7 && {color: colors.danger, fontWeight: typography.weight.bold}]}>
                {daysLeft} days left to register
              </Text>
            )}
          </View>

          {registered ? (
            <View style={[statusStyles.badge, registrationStatus === 'Pending' ? {backgroundColor: '#FFF3CD'} : registrationStatus === 'Assigned' ? {backgroundColor: '#D4EDDA'} : {}]}>
              <Text style={[statusStyles.badgeText, {textTransform: 'none'}, registrationStatus === 'Pending' ? {color: '#856404'} : registrationStatus === 'Assigned' ? {color: '#155724'} : {}]}>
                {registrationStatus === 'Pending' ? 'Applied' : registrationStatus}
              </Text>
            </View>
          ) : daysLeft <= 0 ? (
            <View style={[statusStyles.badge, {backgroundColor: '#F8D7DA'}]}>
              <Text style={[statusStyles.badgeText, {color: '#721C24', textTransform: 'none'}]}>
                Registration Closed
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={buttonStyles.small}
              onPress={() => {
                setSelectedLeague(league);
                setModalVisible(true);
              }}
            >
              <Text style={buttonStyles.smallText}>Join League</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading leagues...</Text>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>
      <View style={[headerStyles.header, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]}>
        <Text style={headerStyles.headerTitle}>Join Leagues</Text>
        <TouchableOpacity
          style={buttonStyles.small}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={buttonStyles.smallText}>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={{backgroundColor: colors.background.card, padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border.medium}}>
          <TextInput
            style={[formStyles.input, {marginBottom: spacing.md}]}
            placeholder="Search leagues..."
            value={searchText}
            onChangeText={setSearchText}
          />
          
          <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md}}>
            <TextInput
              style={[formStyles.input, {width: '30%', fontSize: typography.size.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm}]}
              placeholder="Location"
              value={locationFilter}
              onChangeText={setLocationFilter}
            />
            <TextInput
              style={[formStyles.input, {width: '30%', fontSize: typography.size.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm}]}
              placeholder="Skill Level"
              value={skillFilter}
              onChangeText={setSkillFilter}
            />
            <TextInput
              style={[formStyles.input, {width: '30%', fontSize: typography.size.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm}]}
              placeholder="Day of Week"
              value={dayFilter}
              onChangeText={setDayFilter}
            />
          </View>
          
          <TouchableOpacity style={{alignSelf: 'center', paddingVertical: spacing.sm}} onPress={clearFilters}>
            <Text style={[textStyles.link, {fontSize: typography.size.sm}]}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={{flex: 1}}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredLeagues.length === 0 ? (
          <View style={globalStyles.emptyState}>
            <Text style={{fontSize: 64, marginBottom: spacing.lg}}>⚽</Text>
            <Text style={[textStyles.title, {marginBottom: spacing.sm, fontSize: typography.size.xl}]}>No Leagues Found</Text>
            <Text style={[globalStyles.emptyText, {lineHeight: typography.size.md * typography.lineHeight.relaxed}]}>
              {searchText || locationFilter || skillFilter || dayFilter
                ? 'Try adjusting your filters'
                : 'Check back later for new leagues'}
            </Text>
            {(searchText || locationFilter || skillFilter || dayFilter) && (
              <TouchableOpacity style={[buttonStyles.primary, {paddingHorizontal: spacing.xxl, paddingVertical: spacing.md}]} onPress={clearFilters}>
                <Text style={buttonStyles.primaryText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredLeagues.map(league => (
            <LeagueCard key={league.id} league={league} />
          ))
        )}
      </ScrollView>

      {/* League Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.container, {borderRadius: spacing.xl, width: '90%', maxHeight: '80%'}]}>
            {selectedLeague && (
              <>
                <View style={[modalStyles.header, {padding: spacing.xl}]}>
                  <Text style={[modalStyles.title, {flex: 1}]}>{selectedLeague.name}</Text>
                  <TouchableOpacity
                    style={modalStyles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={[textStyles.body, {fontSize: typography.size.lg, color: colors.text.secondary}]}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={{padding: spacing.xl}}>
                  <Text style={[textStyles.body, {color: colors.text.secondary, lineHeight: typography.size.md * typography.lineHeight.relaxed, marginBottom: spacing.xl}]}>
                    {selectedLeague.description}
                  </Text>

                  <View style={{marginBottom: spacing.xl}}>
                    <Text style={[textStyles.title, {fontSize: typography.size.lg, marginBottom: spacing.md}]}>League Details</Text>
                    
                    <View style={{flexDirection: 'row', marginBottom: spacing.sm}}>
                      <Text style={[textStyles.caption, {width: 120}]}>Location:</Text>
                      <Text style={[textStyles.body, {fontWeight: typography.weight.medium, flex: 1}]}>{selectedLeague.location}</Text>
                    </View>
                    
                    <View style={{flexDirection: 'row', marginBottom: spacing.sm}}>
                      <Text style={[textStyles.caption, {width: 120}]}>Schedule:</Text>
                      <Text style={[textStyles.body, {fontWeight: typography.weight.medium, flex: 1}]}>
                        {selectedLeague.dayOfWeek}s at {selectedLeague.time}
                      </Text>
                    </View>
                    
                    <View style={{flexDirection: 'row', marginBottom: spacing.sm}}>
                      <Text style={[textStyles.caption, {width: 120}]}>Season:</Text>
                      <Text style={[textStyles.body, {fontWeight: typography.weight.medium, flex: 1}]}>
                        {selectedLeague.season} ({formatDate(selectedLeague.startDate)} - {formatDate(selectedLeague.endDate)})
                      </Text>
                    </View>
                    
                    <View style={{flexDirection: 'row', marginBottom: spacing.sm}}>
                      <Text style={[textStyles.caption, {width: 120}]}>Skill Level:</Text>
                      <Text style={[textStyles.body, {fontWeight: typography.weight.medium, flex: 1}]}>{selectedLeague.skillLevel}</Text>
                    </View>
                    
                    <View style={{flexDirection: 'row', marginBottom: spacing.sm}}>
                      <Text style={[textStyles.caption, {width: 120}]}>Price:</Text>
                      <Text style={[textStyles.body, {fontWeight: typography.weight.medium, flex: 1}]}>${selectedLeague.price}</Text>
                    </View>
                    
                    <View style={{flexDirection: 'row', marginBottom: spacing.sm}}>
                      <Text style={[textStyles.caption, {width: 120}]}>Teams:</Text>
                      <Text style={[textStyles.body, {fontWeight: typography.weight.medium, flex: 1}]}>
                        {selectedLeague.currentTeams}/{selectedLeague.maxTeams}
                      </Text>
                    </View>
                    
                    <View style={{flexDirection: 'row', marginBottom: spacing.sm}}>
                      <Text style={[textStyles.caption, {width: 120}]}>Registration Deadline:</Text>
                      <Text style={[textStyles.body, {fontWeight: typography.weight.medium, flex: 1}]}>
                        {formatDate(selectedLeague.registrationDeadline)}
                      </Text>
                    </View>
                  </View>

                  {!isRegistered(selectedLeague.id) && getDaysUntilDeadline(selectedLeague.registrationDeadline) > 0 && (
                    <View style={{marginBottom: spacing.xl}}>
                      <Text style={[textStyles.body, {fontWeight: typography.weight.bold, marginBottom: spacing.md}]}>How would you like to join?</Text>
                      
                      <TouchableOpacity
                        style={[{
                          borderWidth: 2,
                          borderColor: colors.border.medium,
                          borderRadius: borderRadius.md,
                          padding: spacing.lg,
                          marginBottom: spacing.md,
                        }, joinType === 'freeAgent' && {
                          borderColor: colors.primary,
                          backgroundColor: '#F0F8FF',
                        }]}
                        onPress={() => setJoinType('freeAgent')}
                      >
                        <Text style={[textStyles.body, {fontWeight: typography.weight.bold, marginBottom: spacing.xs}]}>Join as Free Agent</Text>
                        <Text style={[textStyles.caption, {lineHeight: typography.size.sm * typography.lineHeight.normal}]}>
                          We'll assign you to a team that needs players
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[{
                          borderWidth: 2,
                          borderColor: colors.border.medium,
                          borderRadius: borderRadius.md,
                          padding: spacing.lg,
                          marginBottom: spacing.md,
                        }, joinType === 'team' && {
                          borderColor: colors.primary,
                          backgroundColor: '#F0F8FF',
                        }]}
                        onPress={() => setJoinType('team')}
                      >
                        <Text style={[textStyles.body, {fontWeight: typography.weight.bold, marginBottom: spacing.xs}]}>Register Existing Team</Text>
                        <Text style={[textStyles.caption, {lineHeight: typography.size.sm * typography.lineHeight.normal}]}>
                          Register your pre-formed team for this league
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>

                <View style={[modalStyles.footer, {padding: spacing.xl}]}>
                  {isRegistered(selectedLeague.id) ? (
                    <Text style={[textStyles.body, {color: colors.text.secondary, textAlign: 'center', fontStyle: 'italic'}]}>
                      You're already registered for this league
                    </Text>
                  ) : getDaysUntilDeadline(selectedLeague.registrationDeadline) <= 0 ? (
                    <Text style={[textStyles.body, {color: colors.danger, textAlign: 'center', fontWeight: typography.weight.semiBold}]}>
                      Registration period has ended
                    </Text>
                  ) : (
                    <TouchableOpacity
                      style={[buttonStyles.primary, {borderRadius: borderRadius.md}]}
                      onPress={() => handleJoinLeague(joinType)}
                    >
                      <Text style={buttonStyles.primaryText}>
                        {joinType === 'freeAgent' ? 'Join as Free Agent' : 'Register Team'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};


export default JoinLeaguesScreen;