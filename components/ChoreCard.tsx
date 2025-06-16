import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { Chore } from '../hooks/useChores';

interface ChoreCardProps {
  item: Chore;
  itemWidth: number;
  marginRight: number;
  marginBottom: number;
  onDelete: (id: string) => void;
}

export default function ChoreCard({ 
  item, 
  itemWidth, 
  marginRight, 
  marginBottom, 
  onDelete 
}: ChoreCardProps) {
  
  const handleCardPress = () => {
    router.push(`/chore/${item.id}`);
  };

  const handleDeletePress = (e: any) => {
    e.stopPropagation();
    onDelete(item.id);
  };

  // Use currentPersonIndex instead of current_person_index
  const currentPerson = item.people.length > 0 ? item.people[item.currentPersonIndex] : null;

  return (
    <TouchableOpacity 
      style={[
        styles.choreCard, 
        { 
          width: itemWidth, 
          marginRight, 
          marginBottom,
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
          shadowColor: colors.shadow,
        }
      ]}
      onPress={handleCardPress}
      activeOpacity={0.8}
    >
      <TouchableOpacity
        style={[
          styles.deleteButton,
          {
            backgroundColor: colors.deleteButton,
            borderColor: colors.deleteBorder,
          }
        ]}
        onPress={handleDeletePress}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={16} color={colors.text} />
      </TouchableOpacity>
      
      <View style={styles.choreContent}>
        <Text style={[styles.choreName, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        
        {currentPerson && (
          <View style={styles.currentPersonContainer}>
            <Text style={[styles.currentPersonLabel, { color: colors.secondaryText }]}>
              Current:
            </Text>
            <Text style={[styles.currentPersonName, { color: colors.primary }]} numberOfLines={1}>
              {currentPerson.name}
            </Text>
          </View>
        )}
        
        <Text style={[styles.peopleCount, { color: colors.secondaryText }]}>
          {item.people.length} {item.people.length === 1 ? 'person' : 'people'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// Keep your existing styles...
const styles = StyleSheet.create({
  choreCard: {
    borderRadius: 16,
    padding: 16,
    aspectRatio: 1,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
    position: 'relative',
    borderWidth: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
  },
  choreContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  choreName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  currentPersonContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  currentPersonLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  currentPersonName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  peopleCount: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});