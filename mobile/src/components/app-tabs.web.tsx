import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useDeviceConnection } from '@/hooks/use-device-connection';

import { AnimatedSymbol } from './ui/animated-symbol';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const { connectedDevice } = useDeviceConnection();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      {connectedDevice ? (
        <TabList asChild>
          <CustomTabList>
            <TabTrigger name="home" href="/" asChild>
              <TabButton iconName="house.fill" fallbackName="home">Home</TabButton>
            </TabTrigger>
            <TabTrigger name="account" href="/account" asChild>
              <TabButton iconName="person.crop.circle.fill" fallbackName="person-circle">Account</TabButton>
            </TabTrigger>
            <TabTrigger name="settings" href="/settings" asChild>
              <TabButton iconName="gearshape.fill" fallbackName="settings">Settings</TabButton>
            </TabTrigger>
          </CustomTabList>
        </TabList>
      ) : null}
    </Tabs>
  );
}

export function TabButton({ children, isFocused, iconName, fallbackName, ...props }: TabTriggerSlotProps & { iconName: string; fallbackName: string }) {
  const theme = useTheme();
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={[styles.tabButtonView, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
        <AnimatedSymbol
          name={iconName}
          fallbackName={isFocused ? fallbackName : `${fallbackName}-outline`}
          size={16}
          tintColor={isFocused ? theme.text : theme.textSecondary}
        />
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          Stackrise Mobile
        </ThemedText>

        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
