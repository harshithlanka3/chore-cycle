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
  Animated,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
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
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [loading, setLoading] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const fabAnimation = useRef(new Animated.Value(0)).current;

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

  const toggleFabMenu = () => {
    const toValue = fabMenuOpen ? 0 : 1;
    setFabMenuOpen(!fabMenuOpen);
    
    Animated.spring(fabAnimation, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleCopyChoreId = async () => {
    try {
      await Clipboard.setStringAsync(chore.id);
      setFabMenuOpen(false);
      Animated.spring(fabAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

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

  const handleAddPersonPress = () => {
    setFabMenuOpen(false);
    Animated.spring(fabAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    setIsAddModalVisible(true);
  };

  const handleLeaveChorePress = () => {
    setFabMenuOpen(false);
    Animated.spring(fabAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    handleLeaveChore();
  };

  const renderPerson = ({ item, index }: { item: Person; index: number }) => {
    const isCurrent = index === chore.currentPersonIndex;
    const isCurrentUser = user && item.user_id === user.id;
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
  const isParticipant = user && chore.people.some(p => p.user_id === user.id);
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

        {/* FAB Menu Overlay */}
        {fabMenuOpen && (
          <TouchableOpacity 
            style={styles.fabOverlay} 
            activeOpacity={1} 
            onPress={toggleFabMenu}
          />
        )}

        {/* Vertical FAB Container */}
        <View style={styles.fabContainer}>
          {(() => {
            const fabSpacing = 20; // Adjust this value to change spacing between FABs
            
            const fabItems = [
              // Copy ID FAB (always visible)
              {
                key: 'copy',
                label: 'Copy ID',
                icon: 'copy',
                backgroundColor: colors.secondary,
                onPress: handleCopyChoreId,
              },
              // Add Person FAB (always visible)
              {
                key: 'add',
                label: 'Add Person',
                icon: 'person-add',
                backgroundColor: colors.createButton,
                onPress: handleAddPersonPress,
              },
              // Leave Chore FAB (conditional)
              ...(isParticipant && !isCreator ? [{
                key: 'leave',
                label: 'Leave',
                icon: 'exit',
                backgroundColor: '#ef4444',
                onPress: handleLeaveChorePress,
              }] : []),
            ];

            return fabItems.map((item, index) => (
              <Animated.View
                key={item.key}
                style={[
                  styles.subFab,
                  {
                    transform: [
                      {
                        translateY: fabAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -(fabItems.length - index) * fabSpacing],
                        }),
                      },
                      {
                        scale: fabAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                    ],
                    opacity: fabAnimation,
                  },
                ]}
              >
                <Text style={[styles.subFabLabel, { color: colors.text }]}>{item.label}</Text>
                <TouchableOpacity
                  style={[
                    styles.subFabButton,
                    { backgroundColor: item.backgroundColor }
                  ]}
                  onPress={item.onPress}
                >
                  <Ionicons name={item.icon as any} size={24} color="#fff" />
                </TouchableOpacity>
              </Animated.View>
            ));
          })()}

          {/* Main FAB */}
          <Animated.View
            style={[
              styles.fab,
              {
                transform: [
                  {
                    rotate: fabAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '45deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.fabButton,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  shadowColor: colors.shadow,
                  opacity: loading ? 0.6 : 1
                }
              ]}
              onPress={toggleFabMenu}
              disabled={loading}
            >
              <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Add Person Modal */}
        <AddPersonModal
          visible={isAddModalVisible}
          email={email}
          nameError={nameError}
          onClose={() => {
            setEmail('');
            setNameError('');
            setIsAddModalVisible(false);
          }}
          onAddPerson={handleAddPerson}
          onEmailChange={(text) => {
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
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
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
    width: screenWidth - 64,
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
  fabOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1001,
  },
  fab: {
    zIndex: 1002,
  },
  fabButton: {
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
  subFab: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  subFabButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  subFabLabel: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textAlign: 'center',
    minWidth: 60,
  },
});