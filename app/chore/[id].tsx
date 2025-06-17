import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Share,
} from 'react-native';
import AddPersonModal from '../../components/AddPersonModal';
import DeletePersonModal from '../../components/DeletePersonModal';
import { colors } from '../../constants/colors';
import { useChoresContext } from '../../contexts/ChoresContext';
import { useAuth } from '../../contexts/AuthContext';
import { Person } from '../../hooks/useChores';

const { width: screenWidth } = Dimensions.get('window');

export default function ChoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getChoreById, addPersonToChore, removePersonFromChore, advanceQueue, leaveChore } = useChoresContext();
  const { user } = useAuth();
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [email, setEmail] = useState(''); // Changed from username to email
  const [nameError, setNameError] = useState('');
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const chore = getChoreById(id);

  if (!chore) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.primary} />
          <Text style={[styles.errorText, { color: colors.text }]}>Chore not found</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddPerson = async () => {
    if (!email.trim()) {
      setNameError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setNameError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await addPersonToChore(chore.id, email.trim().toLowerCase());
      setEmail('');
      setNameError('');
      setIsAddModalVisible(false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNameError('User not found');
      } else if (err.response?.status === 400) {
        setNameError('User is already part of this chore');
      } else {
        setNameError('Failed to add person. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePerson = (person: Person) => {
    setPersonToDelete(person);
    setIsDeleteModalVisible(true);
  };

  const confirmDeletePerson = async () => {
    if (personToDelete) {
      try {
        setLoading(true);
        await removePersonFromChore(chore.id, personToDelete.id);
      } catch (err) {
        console.error('Failed to remove person');
      } finally {
        setLoading(false);
      }
    }
    setIsDeleteModalVisible(false);
    setPersonToDelete(null);
  };

  const handleAdvanceQueue = async () => {
    try {
      setLoading(true);
      await advanceQueue(chore.id);
      // Scroll to show the new current person
      if (chore.people.length > 0) {
        const nextIndex = (chore.currentPersonIndex + 1) % chore.people.length;
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ 
            index: nextIndex, 
            animated: true, 
            viewPosition: 0.5
          });
        }, 100);
      }
    } catch (err) {
      console.error('Failed to advance queue');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveChore = async () => {
    try {
      setLoading(true);
      await leaveChore(chore.id);
      router.back();
    } catch (err) {
      console.error('Failed to leave chore');
    } finally {
      setLoading(false);
    }
  };

  const handleShareChore = async () => {
    try {
      await Share.share({
        message: `Join my chore "${chore.name}"! Use this ID: ${chore.id}`,
        title: 'Join Chore',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderPerson = ({ item, index }: { item: Person; index: number }) => {
    const isCurrent = index === chore.currentPersonIndex;
    const isCurrentUser = user && item.user_id === user.id; // Changed from item.name === user.username
    const canRemove = user && (chore.createdBy === user.id || isCurrentUser);
    
    return (
      <View style={[
        styles.personCard,
        {
          backgroundColor: isCurrent ? colors.primary : colors.cardBackground,
          borderColor: isCurrent ? colors.secondary : colors.cardBorder,
          shadowColor: colors.shadow,
        }
      ]}>
        {canRemove && (
          <TouchableOpacity
            style={[
              styles.deletePersonButton,
              {
                backgroundColor: colors.deleteButton,
                borderColor: colors.deleteBorder,
              }
            ]}
            onPress={() => handleDeletePerson(item)}
            activeOpacity={0.7}
            disabled={loading}
          >
            <Ionicons name="close" size={16} color={colors.text} />
          </TouchableOpacity>
        )}
        
        <View style={styles.personContent}>
          {isCurrent && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>CURRENT</Text>
            </View>
          )}
          <Text style={[
            styles.personName, 
            { color: isCurrent ? '#fff' : colors.text }
          ]} numberOfLines={2}>
            {item.name}
            {isCurrentUser && ' (You)'}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-circle" size={80} color={colors.primary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No people added yet</Text>
      <Text style={[styles.emptyDescription, { color: colors.secondaryText }]}>
        Add people to this chore to start rotating responsibilities!
      </Text>
    </View>
  );

  const getItemLayout = (_: any, index: number) => ({
    length: 192,
    offset: 192 * index,
    index,
  });

  const isCreator = user && chore.createdBy === user.id;
  const isParticipant = user && chore.people.some(p => p.user_id === user.id); // Changed from p.name === user.username
  const currentPerson = chore.people.length > 0 ? chore.people[chore.currentPersonIndex] : null;

  return (
    <>
      <Stack.Screen
        options={{
          title: chore.name,
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerTitleAlign: 'center',
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity 
              style={styles.homeButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleShareChore}
              >
                <Ionicons name="share" size={24} color="#fff" />
              </TouchableOpacity>
              {isParticipant && !isCreator && (
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={handleLeaveChore}
                  disabled={loading}
                >
                  <Ionicons name="exit" size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          {/* Chore Info Section */}
          <View style={styles.choreInfoContainer}>
            <Text style={[styles.choreTitle, { color: colors.text }]}>{chore.name}</Text>
            {chore.createdByName && (
              <Text style={[styles.createdByText, { color: colors.secondaryText }]}>
                Created by {chore.createdByName}
              </Text>
            )}
            {currentPerson && (
              <View style={styles.currentPersonInfo}>
                <Text style={[styles.currentPersonLabel, { color: colors.secondaryText }]}>
                  Current turn:
                </Text>
                <Text style={[styles.currentPersonName, { color: colors.primary }]}>
                  {currentPerson.name}
                  {user && currentPerson.user_id === user.id && ' (You)'}
                </Text>
              </View>
            )}
          </View>

          {/* Advance Button */}
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

          {/* People List */}
          {chore.people.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.queueContainer}>
              <Text style={[styles.queueTitle, { color: colors.text }]}>
                People Queue ({chore.people.length})
              </Text>
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

        {/* Add Person FAB */}
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
              shadowColor: colors.shadow,
              opacity: loading ? 0.6 : 1
            }
          ]}
          onPress={() => setIsAddModalVisible(true)}
          disabled={loading}
        >
          <Ionicons name="person-add" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Add Person Modal */}
        <AddPersonModal
          visible={isAddModalVisible}
          email={email} // Changed from username
          nameError={nameError}
          onClose={() => {
            setEmail('');
            setNameError('');
            setIsAddModalVisible(false);
          }}
          onAddPerson={handleAddPerson}
          onEmailChange={(text) => { // Changed from onUsernameChange
            setEmail(text);
            if (nameError && text.trim()) {
              setNameError('');
            }
          }}
        />

        {/* Delete Person Modal */}
        <DeletePersonModal
          visible={isDeleteModalVisible}
          personName={personToDelete?.name || ''}
          onConfirm={confirmDeletePerson}
          onCancel={() => {
            setIsDeleteModalVisible(false);
            setPersonToDelete(null);
          }}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    marginLeft: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginRight: 16,
    padding: 4,
  },
  choreInfoContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  choreTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  createdByText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  currentPersonInfo: {
    alignItems: 'center',
  },
  currentPersonLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  currentPersonName: {
    fontSize: 18,
    fontWeight: '600',
  },
  advanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  advanceButtonText: {
    color: '#fff',
    fontSize: 18,
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
    width: screenWidth - 64, // Full width minus padding
    maxWidth: 300,
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
    paddingRight: 40, // Account for delete button
  },
  currentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  personName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
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
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    borderWidth: 2,
  },
});