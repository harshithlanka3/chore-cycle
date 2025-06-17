import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
  ActivityIndicator,
  Text,
  RefreshControl,
} from 'react-native';
import ChoreCard from '../components/ChoreCard';
import CreateChoreModal from '../components/CreateChoreModal';
import DeleteChoreModal from '../components/DeleteChoreModal';
import JoinChoreModal from '../components/JoinChoreModal';
import EmptyState from '../components/EmptyState';
import { colors } from '../constants/colors';
import { useChoresContext } from '../contexts/ChoresContext';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { chores, loading, error, createChore, deleteChore, refreshChores, joinChore } = useChoresContext();
  const { user, logout } = useAuth();
  
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [choreName, setChoreName] = useState('');
  const [choreId, setChoreId] = useState('');
  const [nameError, setNameError] = useState('');
  const [idError, setIdError] = useState('');
  const [choreToDelete, setChoreToDelete] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate number of columns based on screen width
  const getNumColumns = () => {
    if (screenWidth < 480) return 2;
    if (screenWidth < 768) return 3;
    if (screenWidth < 1024) return 4;
    if (screenWidth < 1200) return 5;
    if (screenWidth < 1600) return 6;
    return 7;
  };

  const numColumns = getNumColumns();
  const gap = 12;
  const itemWidth = (screenWidth - 32 - (numColumns - 1) * gap) / numColumns;

  const handleCreateChore = async () => {
    if (!choreName.trim()) {
      setNameError('Chore name is required');
      return;
    }

    try {
      await createChore(choreName);
      setChoreName('');
      setNameError('');
      setIsCreateModalVisible(false);
    } catch (err) {
      setNameError('Failed to create chore. Please try again.');
    }
  };

  const handleJoinChore = async () => {
    if (!choreId.trim()) {
      setIdError('Chore ID is required');
      return;
    }

    try {
      await joinChore(choreId.trim());
      setChoreId('');
      setIdError('');
      setIsJoinModalVisible(false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setIdError('Chore not found');
      } else if (err.response?.status === 400) {
        setIdError('You are already part of this chore');
      } else {
        setIdError('Failed to join chore. Please try again.');
      }
    }
  };

  const handleDeleteChore = (id: string) => {
    setChoreToDelete(id);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (choreToDelete) {
      try {
        await deleteChore(choreToDelete);
      } catch (err) {
        console.error('Failed to delete chore');
      }
    }
    setIsDeleteModalVisible(false);
    setChoreToDelete(null);
  };

  const cancelDelete = () => {
    setIsDeleteModalVisible(false);
    setChoreToDelete(null);
  };

  const handleCreateCancel = () => {
    setChoreName('');
    setNameError('');
    setIsCreateModalVisible(false);
  };

  const handleJoinCancel = () => {
    setChoreId('');
    setIdError('');
    setIsJoinModalVisible(false);
  };

  const handleNameChange = (text: string) => {
    setChoreName(text);
    if (nameError && text.trim()) {
      setNameError('');
    }
  };

  const handleIdChange = (text: string) => {
    setChoreId(text);
    if (idError && text.trim()) {
      setIdError('');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshChores();
    } catch (err) {
      console.error('Failed to refresh chores');
    } finally {
      setRefreshing(false);
    }
  };

  const renderChore = ({ item, index }: { item: any; index: number }) => {
    const isLastInRow = (index + 1) % numColumns === 0;
    const marginRight = isLastInRow ? 0 : gap;

    return (
      <ChoreCard
        item={item}
        itemWidth={itemWidth}
        marginRight={marginRight}
        marginBottom={gap}
        onDelete={handleDeleteChore}
        currentUser={user}
      />
    );
  };

  const renderEmptyComponent = () => (
    <EmptyState width={screenWidth - 32} />
  );

  // Show loading spinner on initial load
  if (loading && chores.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading chores...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error && chores.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.primary} />
          <Text style={[styles.errorText, { color: colors.text }]}>Connection Error</Text>
          <Text style={[styles.errorSubtext, { color: colors.secondaryText }]}>
            Make sure your backend is running
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={refreshChores}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setIsJoinModalVisible(true)}
              >
                <Ionicons name="enter" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={logout}
              >
                <Ionicons name="log-out" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <FlatList
            data={chores}
            renderItem={renderChore}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            key={numColumns}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        </View>

        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
              shadowColor: colors.shadow,
            }
          ]}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>

        <CreateChoreModal
          visible={isCreateModalVisible}
          choreName={choreName}
          nameError={nameError}
          onClose={handleCreateCancel}
          onCreateChore={handleCreateChore}
          onNameChange={handleNameChange}
        />

        <JoinChoreModal
          visible={isJoinModalVisible}
          choreId={choreId}
          idError={idError}
          onClose={handleJoinCancel}
          onJoinChore={handleJoinChore}
          onIdChange={handleIdChange}
        />

        <DeleteChoreModal
          visible={isDeleteModalVisible}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
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
  listContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
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