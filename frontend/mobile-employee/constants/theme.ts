/**
 * Modern Theme colors for Employee Mobile App
 * Using professional red color scheme for employee interface
 */

import { Platform } from 'react-native';

const tintColorLight = '#dc2626'; // Red-600
const tintColorDark = '#ef4444'; // Red-500

export const Colors = {
  light: {
    text: '#1f2937',
    textSecondary: '#6b7280',
    background: '#ffffff',
    backgroundSecondary: '#f9fafb',
    tint: tintColorLight,
    icon: '#6b7280',
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorLight,
    primary: '#dc2626',
    primaryLight: '#fef2f2',
    primaryDark: '#b91c1c',
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    error: '#ef4444',
    errorLight: '#fee2e2',
    border: '#e5e7eb',
    card: '#ffffff',
    shadow: '#00000010',
    overlay: '#00000050',
  },
  dark: {
    text: '#f9fafb',
    textSecondary: '#d1d5db',
    background: '#111827',
    backgroundSecondary: '#1f2937',
    tint: tintColorDark,
    icon: '#9ca3af',
    tabIconDefault: '#6b7280',
    tabIconSelected: tintColorDark,
    primary: '#ef4444',
    primaryLight: '#1f2937',
    primaryDark: '#dc2626',
    success: '#22c55e',
    successLight: '#064e3b',
    warning: '#fbbf24',
    warningLight: '#451a03',
    error: '#f87171',
    errorLight: '#7f1d1d',
    border: '#374151',
    card: '#1f2937',
    shadow: '#00000030',
    overlay: '#00000070',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
