import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
      case 'Beginner': return '#34C759';
      case 'Intermediate': return '#FF9500';
      case 'Advanced': return '#FF3B30';
      case 'All Levels': return '#007AFF';
      default: return '#666';
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
        style={styles.leagueCard}
        onPress={() => {
          setSelectedLeague(league);
          setModalVisible(true);
        }}
      >
        <View style={styles.leagueHeader}>
          <Text style={styles.leagueName}>{league.name}</Text>
          <View style={[styles.skillBadge, { backgroundColor: getSkillLevelColor(league.skillLevel) }]}>
            <Text style={styles.skillText}>{league.skillLevel}</Text>
          </View>
        </View>

        <Text style={styles.leagueDescription}>{league.description}</Text>

        <View style={styles.leagueDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍 Location:</Text>
            <Text style={styles.detailValue}>{league.location}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🗓️ Schedule:</Text>
            <Text style={styles.detailValue}>{league.dayOfWeek}s at {league.time}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>🎯 Season:</Text>
            <Text style={styles.detailValue}>{league.season}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>💰 Price:</Text>
            <Text style={styles.detailValue}>${league.price}</Text>
          </View>
        </View>

        <View style={styles.leagueFooter}>
          <View style={styles.capacityInfo}>
            <Text style={styles.capacityText}>
              {league.currentTeams}/{league.maxTeams} teams
            </Text>
            {daysLeft > 0 && (
              <Text style={[styles.deadlineText, daysLeft <= 7 && styles.urgentDeadline]}>
                {daysLeft} days left to register
              </Text>
            )}
          </View>

          {registered ? (
            <View style={[styles.statusBadge, styles[`${registrationStatus}Status`]]}>
              <Text style={[styles.statusText, styles[`${registrationStatus}StatusText`]]}>
                {registrationStatus === 'Pending' ? 'Applied' : registrationStatus}
              </Text>
            </View>
          ) : daysLeft <= 0 ? (
            <View style={[styles.statusBadge, styles.expiredStatus]}>
              <Text style={[styles.statusText, styles.expiredStatusText]}>
                Registration Closed
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.joinButton}
              onPress={() => {
                setSelectedLeague(league);
                setModalVisible(true);
              }}
            >
              <Text style={styles.joinButtonText}>Join League</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading leagues...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Join Leagues</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search leagues..."
            value={searchText}
            onChangeText={setSearchText}
          />
          
          <View style={styles.filterRow}>
            <TextInput
              style={styles.filterInput}
              placeholder="Location"
              value={locationFilter}
              onChangeText={setLocationFilter}
            />
            <TextInput
              style={styles.filterInput}
              placeholder="Skill Level"
              value={skillFilter}
              onChangeText={setSkillFilter}
            />
            <TextInput
              style={styles.filterInput}
              placeholder="Day of Week"
              value={dayFilter}
              onChangeText={setDayFilter}
            />
          </View>
          
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredLeagues.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⚽</Text>
            <Text style={styles.emptyTitle}>No Leagues Found</Text>
            <Text style={styles.emptyText}>
              {searchText || locationFilter || skillFilter || dayFilter
                ? 'Try adjusting your filters'
                : 'Check back later for new leagues'}
            </Text>
            {(searchText || locationFilter || skillFilter || dayFilter) && (
              <TouchableOpacity style={styles.emptyButton} onPress={clearFilters}>
                <Text style={styles.emptyButtonText}>Clear Filters</Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedLeague && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedLeague.name}</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <Text style={styles.modalDescription}>
                    {selectedLeague.description}
                  </Text>

                  <View style={styles.modalDetails}>
                    <Text style={styles.modalDetailTitle}>League Details</Text>
                    
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Location:</Text>
                      <Text style={styles.modalDetailValue}>{selectedLeague.location}</Text>
                    </View>
                    
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Schedule:</Text>
                      <Text style={styles.modalDetailValue}>
                        {selectedLeague.dayOfWeek}s at {selectedLeague.time}
                      </Text>
                    </View>
                    
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Season:</Text>
                      <Text style={styles.modalDetailValue}>
                        {selectedLeague.season} ({formatDate(selectedLeague.startDate)} - {formatDate(selectedLeague.endDate)})
                      </Text>
                    </View>
                    
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Skill Level:</Text>
                      <Text style={styles.modalDetailValue}>{selectedLeague.skillLevel}</Text>
                    </View>
                    
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Price:</Text>
                      <Text style={styles.modalDetailValue}>${selectedLeague.price}</Text>
                    </View>
                    
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Teams:</Text>
                      <Text style={styles.modalDetailValue}>
                        {selectedLeague.currentTeams}/{selectedLeague.maxTeams}
                      </Text>
                    </View>
                    
                    <View style={styles.modalDetailRow}>
                      <Text style={styles.modalDetailLabel}>Registration Deadline:</Text>
                      <Text style={styles.modalDetailValue}>
                        {formatDate(selectedLeague.registrationDeadline)}
                      </Text>
                    </View>
                  </View>

                  {!isRegistered(selectedLeague.id) && getDaysUntilDeadline(selectedLeague.registrationDeadline) > 0 && (
                    <View style={styles.joinOptions}>
                      <Text style={styles.joinOptionsTitle}>How would you like to join?</Text>
                      
                      <TouchableOpacity
                        style={[styles.joinOptionButton, joinType === 'freeAgent' && styles.selectedJoinOption]}
                        onPress={() => setJoinType('freeAgent')}
                      >
                        <Text style={styles.joinOptionTitle}>Join as Free Agent</Text>
                        <Text style={styles.joinOptionDescription}>
                          We'll assign you to a team that needs players
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.joinOptionButton, joinType === 'team' && styles.selectedJoinOption]}
                        onPress={() => setJoinType('team')}
                      >
                        <Text style={styles.joinOptionTitle}>Register Existing Team</Text>
                        <Text style={styles.joinOptionDescription}>
                          Register your pre-formed team for this league
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.modalFooter}>
                  {isRegistered(selectedLeague.id) ? (
                    <Text style={styles.alreadyRegisteredText}>
                      You're already registered for this league
                    </Text>
                  ) : getDaysUntilDeadline(selectedLeague.registrationDeadline) <= 0 ? (
                    <Text style={styles.registrationClosedText}>
                      Registration period has ended
                    </Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.modalJoinButton}
                      onPress={() => handleJoinLeague(joinType)}
                    >
                      <Text style={styles.modalJoinButtonText}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  filterButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: '30%',
    fontSize: 14,
  },
  clearFiltersButton: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  clearFiltersText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  leagueCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leagueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  skillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  leagueDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  leagueDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  leagueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  capacityInfo: {
    flex: 1,
  },
  capacityText: {
    fontSize: 12,
    color: '#666',
  },
  deadlineText: {
    fontSize: 12,
    color: '#FF9500',
    marginTop: 2,
  },
  urgentDeadline: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  PendingStatus: {
    backgroundColor: '#FFF3CD',
  },
  PendingStatusText: {
    color: '#856404',
  },
  AssignedStatus: {
    backgroundColor: '#D4EDDA',
  },
  AssignedStatusText: {
    color: '#155724',
  },
  expiredStatus: {
    backgroundColor: '#F8D7DA',
  },
  expiredStatusText: {
    color: '#721C24',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalDetails: {
    marginBottom: 20,
  },
  modalDetailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modalDetailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  modalDetailLabel: {
    fontSize: 14,
    color: '#666',
    width: 120,
  },
  modalDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  joinOptions: {
    marginBottom: 20,
  },
  joinOptionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  joinOptionButton: {
    borderWidth: 2,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedJoinOption: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  joinOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  joinOptionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  modalJoinButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalJoinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alreadyRegisteredText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  registrationClosedText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default JoinLeaguesScreen;