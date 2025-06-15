import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import ChoreCard from '../components/ChoreCard';
import CreateChoreModal from '../components/CreateChoreModal';
import DeleteChoreModal from '../components/DeleteChoreModal';
import EmptyState from '../components/EmptyState';
import { colors } from '../constants/colors';
import { useChores } from '../hooks/useChores';

export default function HomeScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { chores, createChore, deleteChore } = useChores();
  
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [choreName, setChoreName] = useState('');
  const [nameError, setNameError] = useState('');
  const [choreToDelete, setChoreToDelete] = useState<string | null>(null);

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

  const handleCreateChore = () => {
    if (!choreName.trim()) {
      setNameError('Chore name is required');
      return;
    }

    createChore(choreName);
    setChoreName('');
    setNameError('');
    setIsCreateModalVisible(false);
  };

  const handleDeleteChore = (id: string) => {
    setChoreToDelete(id);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (choreToDelete) {
      deleteChore(choreToDelete);
    }
    setIsDeleteModalVisible(false);
    setChoreToDelete(null);
  };

  const cancelDelete = () => {
    setIsDeleteModalVisible(false);
    setChoreToDelete(null);
  };

  const handleCancel = () => {
    setChoreName('');
    setNameError('');
    setIsCreateModalVisible(false);
  };

  const handleNameChange = (text: string) => {
    setChoreName(text);
    if (nameError && text.trim()) {
      setNameError('');
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
      />
    );
  };

  const renderEmptyComponent = () => (
    <EmptyState width={screenWidth - 32} />
  );

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
          />
        </View>

        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: colors.secondary,
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
          onClose={handleCancel}
          onCreateChore={handleCreateChore}
          onNameChange={handleNameChange}
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