import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

interface LeaveChoreModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  choreName?: string;
}

export default function LeaveChoreModal({
  visible,
  onConfirm,
  onCancel,
  choreName,
}: LeaveChoreModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
        <View style={[
          styles.modalContent,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
          }
        ]}>
          <View style={styles.iconContainer}>
            <Ionicons name="exit-outline" size={48} color={colors.primary} />
          </View>
          
          <Text style={[styles.modalTitle, { color: colors.text }]}>Leave Chore</Text>
          <Text style={[styles.leaveMessage, { color: colors.secondaryText }]}>
            Are you sure you want to leave {choreName ? `"${choreName}"` : 'this chore'}? You will be removed from the queue.
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
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.leaveConfirmButton,
                {
                  backgroundColor: '#ef4444',
                  borderColor: colors.text,
                }
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.leaveConfirmButtonText}>Leave</Text>
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
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  leaveMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
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
  leaveConfirmButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  leaveConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});