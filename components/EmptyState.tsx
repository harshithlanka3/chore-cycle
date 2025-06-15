import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

interface EmptyStateProps {
  width: number;
}

export default function EmptyState({ width }: EmptyStateProps) {
  return (
    <View style={[styles.emptyState, { width }]}>
      <Ionicons name="list-circle" size={80} color={colors.primary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No chores yet</Text>
      <Text style={[styles.emptyDescription, { color: colors.secondaryText }]}>
        Create your first chore to get started!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: 400,
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