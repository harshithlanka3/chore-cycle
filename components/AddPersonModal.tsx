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

interface AddPersonModalProps {
  visible: boolean;
  email: string; // Changed from username to email
  nameError: string;
  onClose: () => void;
  onAddPerson: () => void;
  onEmailChange: (text: string) => void; // Changed from onUsernameChange
}

export default function AddPersonModal({
  visible,
  email,
  nameError,
  onClose,
  onAddPerson,
  onEmailChange,
}: AddPersonModalProps) {
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
          <Text style={[styles.modalTitle, { color: colors.text }]}>Add Person</Text>
          <Text style={[styles.modalSubtitle, { color: colors.secondaryText }]}>
            Enter the email of a registered user
          </Text>
          
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
            value={email}
            onChangeText={onEmailChange}
            placeholder="Enter email"
            placeholderTextColor={colors.secondaryText}
            autoFocus
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={onAddPerson}
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
                styles.addButton,
                {
                  backgroundColor: colors.createButton,
                  borderColor: colors.text,
                }
              ]}
              onPress={onAddPerson}
            >
              <Text style={[styles.addButtonText, { color: colors.createButtonText }]}>Add</Text>
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
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
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
  addButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});