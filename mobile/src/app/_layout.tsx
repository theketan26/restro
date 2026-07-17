import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { QueryProvider } from '@/components/query-provider';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  return (
    <QueryProvider>
      <AnimatedSplashOverlay />
      <AppTabs />
    </QueryProvider>
  );
}
