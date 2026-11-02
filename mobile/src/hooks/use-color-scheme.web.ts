import { useAppThemeMode } from '@/context/ThemeContext';

export function useColorScheme() {
  const { themeMode } = useAppThemeMode();
  return themeMode;
}
