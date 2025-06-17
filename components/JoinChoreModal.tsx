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
      <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
        <View style={[
          styles.modalContent,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
          }
        ]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Join Chore</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Enter the chore ID to join an existing chore
          </Text>
          
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.input,
                borderColor: idError ? '#ef4444' : colors.inputBorder,
                color: colors.text,
              },
              idError ? styles.inputError : null
            ]}
            value={choreId}
            onChangeText={onIdChange}
            placeholder="Enter chore ID"
            placeholderTextColor={colors.secondaryText}
            autoFocus
            onSubmitEditing={onJoinChore}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {idError ? <Text style={styles.errorText}>{idError}</Text> : null}

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
                styles.joinButton,
                {
                  backgroundColor: colors.createButton,
                  borderColor: colors.text,
                }
              ]}
              onPress={onJoinChore}
            >
              <Text style={[styles.joinButtonText, { color: colors.createButtonText }]}>Join</Text>
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
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  input: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    fontFamily: 'monospace',
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
  joinButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});