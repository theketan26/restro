import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Modal from '@/components/Modal';
import { useDeviceConnection } from '@/hooks/use-device-connection';
import { httpClient } from '@/infrastructure/http/axios-client';
import { updateStoredUserProfile } from '@/services/connection-store';

import { useTheme } from '@/hooks/use-theme';

import { DeviceConnection } from '@/components/device-connection';

export default function AccountScreen() {
  const { connectedDevice } = useDeviceConnection();
  const theme = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    if (connectedDevice) {
      setName(connectedDevice.user_name || '');
      setEmail(connectedDevice.user_email || '');
      fetchUserFromBackend(connectedDevice.base_url, connectedDevice.user_email || '');
    }
  }, [connectedDevice]);

  const fetchUserFromBackend = async (baseUrl: string, userEmail: string) => {
    if (!userEmail) return;
    try {
      setLoadingUser(true);
      const res = await httpClient.get(`${baseUrl}/api/users`, {
        params: { search: userEmail },
      });
      const usersList = res.data?.data?.users;
      if (Array.isArray(usersList) && usersList.length > 0) {
        const found = usersList.find((u: any) => u.email.toLowerCase() === userEmail.toLowerCase()) || usersList[0];
        setUserId(found.id);
        setName(found.name || connectedDevice?.user_name || '');
        setEmail(found.email || connectedDevice?.user_email || '');
      }
    } catch (err) {
      console.log('Error fetching user record from desktop:', err);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Validation Error', 'Full Name and Email Address are required.');
      return;
    }

    if (!connectedDevice) {
      Alert.alert('Connection Error', 'No active desktop device connected.');
      return;
    }

    setErrorMsg(null);
    setSavingProfile(true);

    try {
      if (userId) {
        await httpClient.put(`${connectedDevice.base_url}/api/users/${userId}`, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
        });
      }

      await updateStoredUserProfile(name.trim(), email.trim().toLowerCase());
      Alert.alert('Profile Saved', 'Your account details have been updated successfully.');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to update profile details.';
      setErrorMsg(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Password Error', 'Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password Error', 'Passwords do not match.');
      return;
    }

    setUpdatingPassword(true);
    try {
      if (userId && connectedDevice) {
        await httpClient.put(`${connectedDevice.base_url}/api/users/${userId}`, {
          password: newPassword,
        });
      }
      Alert.alert('Password Updated', 'Your password has been updated.');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const userRole = (connectedDevice?.user_role || 'USER').toUpperCase();
  const avatarLetter = (name || connectedDevice?.user_name || 'U').charAt(0).toUpperCase();

  if (!connectedDevice) {
    return <DeviceConnection />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
        <Text style={[styles.pageTitle, { color: theme.text }]}>Account</Text>

        {/* Profile Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.profileHeaderRow}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>{avatarLetter}</Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, { color: theme.text }]}>{name || connectedDevice?.user_name || 'User'}</Text>
              <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{email || connectedDevice?.user_email || 'user@stackrise.local'}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{userRole}</Text>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active Account</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Personal Details Form */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Personal Information</Text>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Update your display name and contact email.</Text>

          {loadingUser ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} />
          ) : (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Jane Doe"
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              />

              <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="username@example.com"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              />

              <Text style={[styles.label, { color: theme.text }]}>Role</Text>
              <TextInput
                value={userRole}
                editable={false}
                style={[styles.input, styles.inputDisabled, { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.textSecondary }]}
              />
              <Text style={[styles.fieldHint, { color: theme.textSecondary }]}>
                Roles can only be altered by an administrator in the Desktop Users section.
              </Text>

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorBoxText}>{errorMsg}</Text>
                </View>
              ) : null}

              <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Profile Details</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Security / Password section */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Security & Credentials</Text>
          <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
            Keep your account secure by updating your authentication password periodically.
          </Text>

          <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.primary }]} onPress={() => setShowPasswordModal(true)}>
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Change Password</Text>
          </TouchableOpacity>
        </View>

        {/* Password Modal */}
        <Modal visible={showPasswordModal} onRequestClose={() => setShowPasswordModal(false)}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#071313', marginBottom: 8 }}>Change Password</Text>
          <Text style={{ fontSize: 13, color: '#4F6371', marginBottom: 14 }}>
            Enter your new password below.
          </Text>

          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            placeholderTextColor="#7C8994"
            secureTextEntry
            style={styles.modalInput}
          />

          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor="#7C8994"
            secureTextEntry
            style={styles.modalInput}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
            <TouchableOpacity onPress={() => setShowPasswordModal(false)} style={{ padding: 10 }}>
              <Text style={{ color: '#4F6371', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleChangePassword} style={styles.modalSubmitBtn} disabled={updatingPassword}>
              {updatingPassword ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Update</Text>
              )}
            </TouchableOpacity>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF3E5',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF3E5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#071313',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D3D4C0',
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0A2947',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#071313',
  },
  profileEmail: {
    fontSize: 13,
    color: '#4F6371',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  roleBadge: {
    backgroundColor: '#FE7F2D',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  activeBadgeText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#071313',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#4F6371',
    marginTop: 4,
    marginBottom: 14,
  },
  formGroup: {
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#071313',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D3D4C0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#071313',
  },
  inputDisabled: {
    backgroundColor: '#E9EDF1',
    color: '#4F6371',
  },
  fieldHint: {
    fontSize: 11,
    color: '#7C8994',
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  errorBoxText: {
    color: '#991B1B',
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: '#0A2947',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#0A2947',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  secondaryButtonText: {
    color: '#0A2947',
    fontWeight: '700',
    fontSize: 14,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D3D4C0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    color: '#071313',
  },
  modalSubmitBtn: {
    backgroundColor: '#0A2947',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});
