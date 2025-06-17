import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
  ActivityIndicator,
  Text,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChoreCard from '../components/ChoreCard';
import CreateChoreModal from '../components/CreateChoreModal';
import JoinChoreModal from '../components/JoinChoreModal';
import DeleteChoreModal from '../components/DeleteChoreModal';
import LogoutModal from '../components/LogoutModal';
import EmptyState from '../components/EmptyState';
import { colors } from '../constants/colors';
import { useChoresContext } from '../contexts/ChoresContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';

export default function HomeScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { chores, loading, error, createChore, joinChore, deleteChore, refreshChores } = useChoresContext();
  const { logout, user } = useAuth();
  const { navigateToChore } = useNavigation();
  
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
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

  const handleLogout = () => {
    console.log('Logout button clicked - showing modal');
    setIsLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    console.log('Logout confirmed');
    setIsLogoutModalVisible(false);
    try {
      console.log('Calling logout function...');
      await logout();
      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const cancelLogout = () => {
    console.log('Logout cancelled');
    setIsLogoutModalVisible(false);
  };

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
    } catch (err: any) {
      console.error('Create chore error:', err.response?.data?.detail || 'Failed to create chore. Please try again.');
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
      console.log('Successfully joined the chore!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to join chore. Please check the ID and try again.';
      setIdError(errorMessage);
    }
  };

  const handleDeleteChore = (id: string) => {
    const chore = chores.find(c => c.id === id);
    if (chore && chore.owner_id !== user?.id) {
        console.log('Permission Denied', 'Only the chore owner can delete this chore.');
        return;
    }
    setChoreToDelete(id);
    setIsDeleteModalVisible(true);
    };

  const confirmDelete = async () => {
    if (choreToDelete) {
      try {
        await deleteChore(choreToDelete);
      } catch (err) {
        console.error('Delete chore error:', 'Failed to delete chore. Please try again.');
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

  const handleCreateNameChange = (text: string) => {
    setChoreName(text);
    if (nameError && text.trim()) {
      setNameError('');
    }
  };

  const handleJoinIdChange = (text: string) => {
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
      console.error('Refresh error:', 'Failed to refresh chores.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCardPress = (choreId: string) => {
    navigateToChore(choreId);
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
        onPress={() => handleCardPress(item.id)}
        currentUserId={user?.id || ''}
      />
    );
  };

  const renderEmptyComponent = () => (
    <EmptyState width={screenWidth - 32} />
  );

  // Show loading spinner on initial load
  if (loading && chores.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading chores...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error && chores.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          {/* Empty view for balance */}
        </View>
        <Text style={styles.headerTitle}>Chore Cycle</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.logoutIconButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

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

      {/* Two FABs: Create and Join */}
      <TouchableOpacity
        style={[
          styles.createFab,
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

      <TouchableOpacity
        style={[
          styles.joinFab,
          {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            shadowColor: colors.shadow,
          }
        ]}
        onPress={() => setIsJoinModalVisible(true)}
      >
        <Ionicons name="enter" size={24} color="#fff" />
      </TouchableOpacity>

      <CreateChoreModal
        visible={isCreateModalVisible}
        choreName={choreName}
        nameError={nameError}
        onClose={handleCreateCancel}
        onCreateChore={handleCreateChore}
        onNameChange={handleCreateNameChange}
      />

      <JoinChoreModal
        visible={isJoinModalVisible}
        choreId={choreId}
        idError={idError}
        onClose={handleJoinCancel}
        onJoinChore={handleJoinChore}
        onIdChange={handleJoinIdChange}
      />

      <DeleteChoreModal
        visible={isDeleteModalVisible}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <LogoutModal
        visible={isLogoutModalVisible}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
        userName={user?.name}
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
    width: 50, // Fixed width for balance
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
    width: 50, // Same width as headerLeft
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  logoutIconButton: {
    padding: 6,
    borderRadius: 6,
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
  createFab: {
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
  joinFab: {
    position: 'absolute',
    bottom: 24,
    right: 88,
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