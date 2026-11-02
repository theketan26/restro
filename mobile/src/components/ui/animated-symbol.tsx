import React from 'react';
import { Platform, ViewStyle, StyleProp, ColorValue } from 'react-native';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import * as VectorIcons from '@expo/vector-icons';

export type IconLibraryName =
  | 'Ionicons'
  | 'Feather'
  | 'MaterialIcons'
  | 'MaterialCommunityIcons'
  | 'FontAwesome'
  | 'AntDesign'
  | 'Entypo'
  | 'SimpleLineIcons'
  | 'Octicons';

export interface AnimatedSymbolProps {
  name: string; // SF Symbol name for iOS
  fallbackLibrary?: IconLibraryName;
  fallbackName: string; // Icon name for the @expo/vector-icons fallback
  size?: number;
  tintColor?: ColorValue;
  animationSpec?: SymbolViewProps['animationSpec'];
  style?: StyleProp<ViewStyle>;
}

export function AnimatedSymbol({
  name,
  fallbackLibrary = 'Ionicons',
  fallbackName,
  size = 24,
  tintColor,
  animationSpec,
  style,
  ...props
}: AnimatedSymbolProps) {
  if (Platform.OS === 'ios') {
    // SFSymbol type is cast to any here to satisfy typescript compile union checks
    return (
      <SymbolView
        name={name as any}
        size={size}
        tintColor={tintColor}
        animationSpec={animationSpec}
        style={style}
        {...props}
      />
    );
  }

  // Fallback for Android and Web
  const IconComponent = (VectorIcons as any)[fallbackLibrary];
  if (!IconComponent) {
    return null;
  }

  return (
    <IconComponent
      name={fallbackName}
      size={size}
      color={tintColor}
      style={style}
      {...props}
    />
  );
}
