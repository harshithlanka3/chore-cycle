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
  Alert,
} from 'react-native';
import AddPersonModal from '../../components/AddPersonModal';
import DeletePersonModal from '../../components/DeletePersonModal';
import { colors } from '../../constants/colors';
import { useChoresContext } from '../../contexts/ChoresContext';
import { Person } from '../../hooks/useChores';

const { width: screenWidth } = Dimensions.get('window');

export default function ChoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getChoreById, addPersonToChore, removePersonFromChore, advanceQueue } = useChoresContext();
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [personName, setPersonName] = useState('');
  const [nameError, setNameError] = useState('');
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const chore = getChoreById(id);

  if (!chore) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Chore not found</Text>
      </SafeAreaView>
    );
  }

  const handleAddPerson = async () => {
    if (!personName.trim()) {
      setNameError('Person name is required');
      return;
    }

    try {
      setLoading(true);
      await addPersonToChore(chore.id, personName);
      setPersonName('');
      setNameError('');
      setIsAddModalVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to add person. Please try again.');
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
        Alert.alert('Error', 'Failed to remove person. Please try again.');
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
      Alert.alert('Error', 'Failed to advance queue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPerson = ({ item, index }: { item: Person; index: number }) => {
    // Use currentPersonIndex instead of current_person_index
    const isCurrent = index === chore.currentPersonIndex;
    
    return (
      <View style={[
        styles.personCard,
        {
          backgroundColor: isCurrent ? colors.primary : colors.cardBackground,
          borderColor: isCurrent ? colors.secondary : colors.cardBorder,
          shadowColor: colors.shadow,
        }
      ]}>
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
    length: 192, // Height of card (180) + margin (12)
    offset: 192 * index,
    index,
  });

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
              <Ionicons name="home" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
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

        <AddPersonModal
          visible={isAddModalVisible}
          personName={personName}
          nameError={nameError}
          onClose={() => {
            setPersonName('');
            setNameError('');
            setIsAddModalVisible(false);
          }}
          onAddPerson={handleAddPerson}
          onNameChange={(text) => {
            setPersonName(text);
            if (nameError && text.trim()) {
              setNameError('');
            }
          }}
        />

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

// Keep your existing styles...
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  homeButton: {
    marginLeft: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
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
    marginBottom: 12,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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