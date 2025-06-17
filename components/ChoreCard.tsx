import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../constants/colors';
import { Chore } from '../hooks/useChores';
import * as Clipboard from 'expo-clipboard';

interface ChoreCardProps {
  item: Chore;
  itemWidth: number;
  marginRight: number;
  marginBottom: number;
  onDelete: (id: string) => void;
  onPress: () => void;
  currentUserId: string;
}

export default function ChoreCard({ 
  item, 
  itemWidth, 
  marginRight, 
  marginBottom, 
  onDelete,
  onPress,
  currentUserId
}: ChoreCardProps) {
  
  const handleCardPress = () => {
    onPress();
  };

  const handleDeletePress = (e: any) => {
    e.stopPropagation();
    onDelete(item.id);
  };

  const handleCopyId = async (e: any) => {
    e.stopPropagation();
    await Clipboard.setStringAsync(item.id);
  };

  // Safely handle currentPerson with proper validation
  const currentPerson = (item.people && item.people.length > 0 && 
                        typeof item.currentPersonIndex === 'number' && 
                        item.currentPersonIndex >= 0 && 
                        item.currentPersonIndex < item.people.length) 
                        ? item.people[item.currentPersonIndex] 
                        : null;
  
  const isOwner = item.owner_id === currentUserId;

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
      {/* Top row: Copy ID and Delete buttons */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[
            styles.copyButton,
            {
              backgroundColor: colors.primary,
            }
          ]}
          onPress={handleCopyId}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="copy" size={14} color="#fff" />
        </TouchableOpacity>
        
        {isOwner && (
          <TouchableOpacity
            style={[
              styles.deleteButton,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              }
            ]}
            onPress={handleDeletePress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.choreContent}>
        <Text style={[styles.choreName, { color: colors.text }]} numberOfLines={2}>
          {item.name || 'Unnamed Chore'}
        </Text>
        
        {/* Ownership indicator */}
        <View style={styles.ownershipContainer}>
          <Ionicons 
            name={isOwner ? "person" : "people"} 
            size={12} 
            color={isOwner ? colors.primary : colors.createButton} 
          />
          <Text style={[
            styles.ownershipText, 
            { color: isOwner ? colors.primary : colors.createButton }
          ]}>
            {isOwner ? 'Owner' : 'Member'}
          </Text>
        </View>
        
        {currentPerson && (
          <View style={styles.currentPersonContainer}>
            <Text style={[styles.currentPersonLabel, { color: colors.secondaryText }]}>
              Current:
            </Text>
            <Text style={[styles.currentPersonName, { color: colors.primary }]} numberOfLines={1}>
              {currentPerson.name || 'Unknown'}
            </Text>
          </View>
        )}
        
        <Text style={[styles.peopleCount, { color: colors.secondaryText }]}>
          {(item.people?.length || 0)} {(item.people?.length || 0) === 1 ? 'person' : 'people'}
        </Text>

        {/* Truncated ID display */}
        <Text style={[styles.choreId, { color: colors.secondaryText }]} numberOfLines={1}>
          ID: {item.id ? item.id.substring(0, 8) + '...' : 'No ID'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    zIndex: 10,
  },
  copyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingTop: 20, // Account for top buttons
  },
  choreName: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 6,
  },
  ownershipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ownershipText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
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
  choreId: {
    fontSize: 10,
    fontWeight: '400',
    marginTop: 4,
    fontFamily: 'monospace',
  },
});