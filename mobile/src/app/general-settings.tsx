import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppThemeMode } from '@/context/ThemeContext';
import { useTheme } from '@/hooks/use-theme';

interface GeneralSettingsScreenProps {
  onBack?: () => void;
}

export default function GeneralSettingsScreen({ onBack }: GeneralSettingsScreenProps = {}) {
  const router = useRouter();
  const { themeMode, setThemeMode } = useAppThemeMode();
  const theme = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={[styles.backButtonText, { color: theme.primary }]}>‹ Settings</Text>
        </TouchableOpacity>

        <Text style={[styles.pageTitle, { color: theme.text }]}>General Settings</Text>

        {/* Appearance Section */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>Appearance & Theme</Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Color Theme Mode</Text>
          <Text style={[styles.cardSub, { color: theme.textSecondary }]}>
            Choose your preferred color theme for the mobile app interface.
          </Text>

          <View style={styles.themeSelectorRow}>
            {/* Light Mode Selector */}
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                themeMode === 'light' && styles.themeOptionActiveLight,
              ]}
              onPress={() => setThemeMode('light')}
            >
              <Text style={styles.themeOptionIcon}>☀️</Text>
              <Text style={[styles.themeOptionText, { color: theme.text }, themeMode === 'light' && styles.themeOptionTextActive]}>
                Light Mode
              </Text>
              {themeMode === 'light' && (
                <View style={styles.activeCheckBadge}>
                  <Text style={styles.activeCheckText}>✓ Active</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Dark Mode Selector */}
            <TouchableOpacity
              style={[
                styles.themeOption,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                themeMode === 'dark' && styles.themeOptionActiveDark,
              ]}
              onPress={() => setThemeMode('dark')}
            >
              <Text style={styles.themeOptionIcon}>🌙</Text>
              <Text style={[styles.themeOptionText, { color: theme.text }, themeMode === 'dark' && styles.themeOptionTextActive]}>
                Dark Mode
              </Text>
              {themeMode === 'dark' && (
                <View style={styles.activeCheckBadge}>
                  <Text style={styles.activeCheckText}>✓ Active</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingVertical: 4,
    paddingRight: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  themeSelectorRow: {
    gap: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  themeOptionActiveLight: {
    borderColor: '#0A2947',
    backgroundColor: '#FFF2E6',
  },
  themeOptionActiveDark: {
    borderColor: '#FE7F2D',
    backgroundColor: '#212225',
  },
  themeOptionIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  themeOptionText: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  themeOptionTextActive: {
    fontWeight: '800',
  },
  activeCheckBadge: {
    backgroundColor: '#FE7F2D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activeCheckText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
