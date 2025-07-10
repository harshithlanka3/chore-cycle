import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '../constants/colors';

interface JoinChoreModalProps {
  visible: boolean;
  choreId: string;
  idError: string;
  onClose: () => void;
  onJoinChore: () => void;
  onIdChange: (text: string) => void;
}

export default function JoinChoreModal({
  visible,
  choreId,
  idError,
  onClose,
  onJoinChore,
  onIdChange,
}: JoinChoreModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
        <View style={[
          styles.content,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
          }
        ]}>
          <Text style={[styles.title, { color: colors.text }]}>Join Existing Chore</Text>

          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: colors.text }]}>Chore ID</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.input,
                  borderColor: idError ? '#ef4444' : colors.inputBorder,
                  color: colors.text,
                }
              ]}
              placeholder="Enter chore ID"
              placeholderTextColor={colors.secondaryText}
              value={choreId}
              onChangeText={onIdChange}
              autoFocus
              onSubmitEditing={onJoinChore}
            />
            {idError ? (
              <Text style={styles.errorText}>{idError}</Text>
            ) : null}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: colors.createButton,
                  borderColor: colors.inputBorder,
                }
              ]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.createButtonText }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.submitButton,
                { 
                  backgroundColor: colors.createButton,
                  borderColor: colors.inputBorder,
                }
              ]}
              onPress={onJoinChore}
            >
              <Text style={[styles.submitButtonText, { color: colors.createButtonText }]}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
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
  },
  submitButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});