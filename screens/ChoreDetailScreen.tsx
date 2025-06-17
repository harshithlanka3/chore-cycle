import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState, useEffect } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DeletePersonModal from '../components/DeletePersonModal';
import LeaveChoreModal from '../components/LeaveChoreModal';
import { colors } from '../constants/colors';
import { useChoresContext } from '../contexts/ChoresContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { Person, Chore } from '../hooks/useChores';

const { width: screenWidth } = Dimensions.get('window');

interface ChoreDetailScreenProps {
  choreId: string;
}

export default function ChoreDetailScreen({ choreId }: ChoreDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const { chores, getChoreById, removePersonFromChore, advanceQueue, leaveChore } = useChoresContext();
  const { user } = useAuth();
  const { navigateToHome } = useNavigation();
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isLeaveModalVisible, setIsLeaveModalVisible] = useState(false);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [loading, setLoading] = useState(false);
  const [chore, setChore] = useState<Chore | undefined>(getChoreById(choreId));
  const flatListRef = useRef<FlatList>(null);

  // Update chore data whenever chores array changes
  useEffect(() => {
    const updatedChore = getChoreById(choreId);
    setChore(updatedChore);
  }, [chores, choreId, getChoreById]);

  // If chore is removed (user left or chore deleted), navigate home
  useEffect(() => {
    if (!chore) {
      // Small delay to ensure any pending updates are processed
      const timer = setTimeout(() => {
        const finalCheck = getChoreById(choreId);
        if (!finalCheck) {
          navigateToHome();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chore, choreId, getChoreById, navigateToHome]);

  if (!chore) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + 8 }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.homeButton}
              onPress={() => navigateToHome()}
            >
              <Ionicons name="home" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Chore Not Found</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.errorText, { color: colors.text }]}>Chore not found</Text>
        </View>
      </View>
    );
  }

  const isOwner = chore.owner_id === user?.id;
  const isMember = chore.shared_with.includes(user?.id || '');

  const handleDeletePerson = (person: Person) => {
    setPersonToDelete(person);
    setIsDeleteModalVisible(true);
  };

  const confirmDeletePerson = async () => {
    if (personToDelete) {
      try {
        setLoading(true);
        await removePersonFromChore(chore.id, personToDelete.id);
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || 'Failed to remove person. Please try again.';
        Alert.alert('Error', errorMessage);
      } finally {
        setLoading(false);
      }
    }
    setIsDeleteModalVisible(false);
    setPersonToDelete(null);
  };

  const handleLeaveChore = () => {
    if (isOwner) {
      Alert.alert(
        'Cannot Leave',
        'As the owner, you cannot leave this chore. You can delete the chore instead.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsLeaveModalVisible(true);
  };

  const confirmLeaveChore = async () => {
    setIsLeaveModalVisible(false);
    try {
      setLoading(true);
      await leaveChore(chore.id);
      navigateToHome();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to leave chore. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cancelLeaveChore = () => {
    setIsLeaveModalVisible(false);
  };

  const handleAdvanceQueue = async () => {
    try {
      setLoading(true);
      await advanceQueue(chore.id);
      // The chore will be updated via WebSocket, so we don't need to manually update here
      // Just scroll to the new current person after a short delay
      setTimeout(() => {
        const updatedChore = getChoreById(choreId);
        if (updatedChore && updatedChore.people.length > 0) {
          flatListRef.current?.scrollToIndex({ 
            index: updatedChore.currentPersonIndex, 
            animated: true, 
            viewPosition: 0.5
          });
        }
      }, 200);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to advance queue. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleHomePress = () => {
    navigateToHome();
  };

  const renderPerson = ({ item, index }: { item: Person; index: number }) => {
    const isCurrent = index === chore.currentPersonIndex;
    const isUser = !!item.user_id;
    const isCurrentUser = item.user_id === user?.id;
    
    return (
      <View style={[
        styles.personCard,
        {
          backgroundColor: isCurrent ? colors.primary : colors.cardBackground,
          borderColor: isCurrent ? colors.secondary : colors.cardBorder,
          shadowColor: colors.shadow,
        }
      ]}>
        {isOwner && (
            <TouchableOpacity
                style={[
                styles.deletePersonButton,
                {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                }
                ]}
                onPress={() => handleDeletePerson(item)}
                activeOpacity={0.7}
                disabled={loading}
            >
                <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
            )}
        
        <View style={styles.personContent}>
          {isCurrent && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>CURRENT</Text>
            </View>
          )}
          
          {/* User indicator */}
          {isUser && (
            <View style={styles.userBadge}>
              <Ionicons 
                name={isCurrentUser ? "person" : "people"} 
                size={12} 
                color={isCurrent ? '#fff' : colors.primary} 
              />
              <Text style={[
                styles.userBadgeText, 
                { color: isCurrent ? '#fff' : colors.primary }
              ]}>
                {isCurrentUser ? 'You' : 'User'}
              </Text>
            </View>
          )}
          
          <Text style={[
            styles.personName, 
            { color: isCurrent ? '#fff' : colors.text }
          ]} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-circle" size={80} color={colors.primary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No people in this chore yet</Text>
      <Text style={[styles.emptyDescription, { color: colors.secondaryText }]}>
        People can join this chore using the chore ID!
      </Text>
    </View>
  );

  const getItemLayout = (_: any, index: number) => ({
    length: 192,
    offset: 192 * index,
    index,
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={handleHomePress}
          >
            <Ionicons name="home" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.headerTitle}>{chore.name}</Text>
        
        <View style={styles.headerRight}>
          {isMember && !isOwner ? (
            <TouchableOpacity 
              style={styles.leaveButton}
              onPress={handleLeaveChore}
              disabled={loading}
            >
              <Ionicons name="exit-outline" size={20} color="#fff" />
              <Text style={styles.leaveButtonText}>Leave</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.content}>
        {/* Ownership/membership indicator */}
        <View style={styles.membershipInfo}>
          <Ionicons 
            name={isOwner ? "person" : "people"} 
            size={16} 
            color={isOwner ? colors.primary : colors.createButton} 
          />
          <Text style={[
            styles.membershipText, 
            { color: isOwner ? colors.primary : colors.createButton }
          ]}>
            You are the {isOwner ? 'owner' : 'member'} of this chore
          </Text>
        </View>

        {chore.people.length > 0 && (
          <TouchableOpacity
            style={[
              styles.advanceButton, 
              { 
                backgroundColor: colors.primary,
                opacity: loading ? 0.6 : 1
              }
            ]}
            onPress={handleAdvanceQueue}
            disabled={loading}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.advanceButtonText}>Next Person</Text>
          </TouchableOpacity>
        )}

        {chore.people.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.queueContainer}>
            <Text style={[styles.queueTitle, { color: colors.text }]}>People Queue</Text>
            <FlatList
              ref={flatListRef}
              data={chore.people}
              renderItem={renderPerson}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              getItemLayout={getItemLayout}
              initialScrollIndex={Math.min(chore.currentPersonIndex, Math.max(0, chore.people.length - 2))}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  flatListRef.current?.scrollToIndex({
                    index: Math.min(info.index, chore.people.length - 1),
                    animated: false,
                    viewPosition: 0.5,
                  });
                }, 100);
              }}
            />
          </View>
        )}
      </View>

      <DeletePersonModal
        visible={isDeleteModalVisible}
        personName={personToDelete?.name || ''}
        onConfirm={confirmDeletePerson}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setPersonToDelete(null);
        }}
      />

      <LeaveChoreModal
        visible={isLeaveModalVisible}
        onConfirm={confirmLeaveChore}
        onCancel={cancelLeaveChore}
        choreName={chore.name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerLeft: {
    width: 70, // Fixed width to accommodate home button
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 70, // Same width as headerLeft for balance
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  homeButton: {
    padding: 6,
    borderRadius: 6,
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  leaveButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  membershipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 8,
  },
  membershipText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  advanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  advanceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  queueContainer: {
    flex: 1,
  },
  queueTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 100,
    alignItems: 'center',
  },
  personCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    position: 'relative',
    width: 180,
    height: 180,
  },
  deletePersonButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
  },
  personContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  currentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 8,
  },
  userBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  personName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});