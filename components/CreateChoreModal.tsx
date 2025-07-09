import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { colors } from '../constants/colors';

interface CreateChoreModalProps {
  visible: boolean;
  choreName: string;
  choreId: string;
  nameError: string;
  idError: string;
  onClose: () => void;
  onCreateChore: () => void;
  onJoinChore: () => void;
  onNameChange: (text: string) => void;
  onIdChange: (text: string) => void;
}

export default function CreateChoreModal({
  visible,
  choreName,
  choreId,
  nameError,
  idError,
  onClose,
  onCreateChore,
  onJoinChore,
  onNameChange,
  onIdChange,
}: CreateChoreModalProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  const handleSubmit = () => {
    if (activeTab === 'create') {
      onCreateChore();
    } else {
      onJoinChore();
    }
  };

  const handleClose = () => {
    setActiveTab('create'); // Reset to create tab when closing
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
        <View style={[
          styles.content,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
          }
        ]}>
          {/* Tab Headers */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                { borderBottomColor: activeTab === 'create' ? colors.primary : colors.cardBorder }
              ]}
              onPress={() => setActiveTab('create')}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'create' ? colors.primary : colors.secondaryText }
              ]}>
                Create Chore
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                { borderBottomColor: activeTab === 'join' ? colors.primary : colors.cardBorder }
              ]}
              onPress={() => setActiveTab('join')}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === 'join' ? colors.primary : colors.secondaryText }
              ]}>
                Join Chore
              </Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            {activeTab === 'create' ? 'Create New Chore' : 'Join Existing Chore'}
          </Text>

          {/* Content based on active tab */}
          {activeTab === 'create' ? (
            <View style={styles.formContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Chore Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.input,
                    borderColor: nameError ? '#ef4444' : colors.inputBorder,
                    color: colors.text,
                  }
                ]}
                placeholder="Enter chore name"
                placeholderTextColor={colors.secondaryText}
                value={choreName}
                onChangeText={onNameChange}
                autoFocus
              />
              {nameError ? (
                <Text style={styles.errorText}>{nameError}</Text>
              ) : null}
            </View>
          ) : (
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
              />
              {idError ? (
                <Text style={styles.errorText}>{idError}</Text>
              ) : null}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: colors.createButton,
                  borderColor: colors.inputBorder,
                }
              ]}
              onPress={handleClose}
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
              onPress={handleSubmit}
            >
              <Text style={[styles.submitButtonText, { color: colors.createButtonText }]}>
                {activeTab === 'create' ? 'Create' : 'Join'}
              </Text>
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
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