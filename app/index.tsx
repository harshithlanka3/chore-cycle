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
  Modal,
} from 'react-native';
import ChoreCard from '../components/ChoreCard';
import CreateChoreModal from '../components/CreateChoreModal';
import DeleteChoreModal from '../components/DeleteChoreModal';
import EmptyState from '../components/EmptyState';
import { colors } from '../constants/colors';
import { useChoresContext } from '../contexts/ChoresContext';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { chores, loading, error, createChore, deleteChore, refreshChores, joinChore } = useChoresContext();
  const { user, logout } = useAuth();
  
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
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
      setIsCreateModalVisible(false);
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

  const handleModalCancel = () => {
    setChoreName('');
    setChoreId('');
    setNameError('');
    setIdError('');
    setIsCreateModalVisible(false);
  };

  const handleLogoutPress = () => {
    setIsLogoutModalVisible(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalVisible(false);
    logout();
  };

  const cancelLogout = () => {
    setIsLogoutModalVisible(false);
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

        {/* Add Chore Button */}
        <TouchableOpacity
          style={[
            styles.addButton,
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

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: '#ef4444',
              borderColor: '#ef4444',
              shadowColor: colors.shadow,
            }
          ]}
          onPress={handleLogoutPress}
        >
          <Ionicons name="log-out" size={28} color="#fff" />
        </TouchableOpacity>

        <CreateChoreModal
          visible={isCreateModalVisible}
          choreName={choreName}
          choreId={choreId}
          nameError={nameError}
          idError={idError}
          onClose={handleModalCancel}
          onCreateChore={handleCreateChore}
          onJoinChore={handleJoinChore}
          onNameChange={handleNameChange}
          onIdChange={handleIdChange}
        />

        <DeleteChoreModal
          visible={isDeleteModalVisible}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />

        {/* Logout Confirmation Modal */}
        <Modal
          visible={isLogoutModalVisible}
          transparent
          animationType="fade"
          onRequestClose={cancelLogout}
        >
          <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
            <View style={[
              styles.modalContent,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
              }
            ]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Logout</Text>
              <Text style={[styles.modalMessage, { color: colors.secondaryText }]}>
                Are you sure you want to logout?
              </Text>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      backgroundColor: colors.primary,
                      borderColor: colors.text,
                    }
                  ]}
                  onPress={cancelLogout}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.logoutConfirmButton,
                    {
                      borderColor: colors.text,
                    }
                  ]}
                  onPress={confirmLogout}
                >
                  <Text style={styles.logoutConfirmButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  addButton: {
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
  logoutButton: {
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  logoutConfirmButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});