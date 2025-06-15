import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../constants/colors';

interface CreateChoreModalProps {
  visible: boolean;
  choreName: string;
  nameError: string;
  onClose: () => void;
  onCreateChore: () => void;
  onNameChange: (text: string) => void;
}

export default function CreateChoreModal({
  visible,
  choreName,
  nameError,
  onClose,
  onCreateChore,
  onNameChange,
}: CreateChoreModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
        <View style={[
          styles.modalContent,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
          }
        ]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Create New Chore</Text>
          
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                borderColor: nameError ? '#ef4444' : colors.inputBorder,
                color: colors.text,
              },
              nameError ? styles.inputError : null
            ]}
            value={choreName}
            onChangeText={onNameChange}
            placeholder="Enter chore name"
            placeholderTextColor={colors.text}
            autoFocus
            onSubmitEditing={onCreateChore}
          />

          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.text,
                }
              ]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.createButton,
                {
                  backgroundColor: colors.createButton,
                  borderColor: colors.text,
                }
              ]}
              onPress={onCreateChore}
            >
              <Text style={[styles.createButtonText, { color: colors.createButtonText }]}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  input: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 12,
    marginTop: 0,
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
  createButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});