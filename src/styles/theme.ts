import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const colors = {
  primary: '#007AFF',
  secondary: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9500',
  
  text: {
    primary: '#333',
    secondary: '#666',
    tertiary: '#999',
    inverse: '#fff',
  },
  
  background: {
    main: '#f8f9fa',
    card: '#fff',
    overlay: 'rgba(0, 0, 0, 0.5)',
    disabled: 'rgba(0, 0, 0, 0.1)',
  },
  
  border: {
    light: '#ddd',
    medium: '#e1e5e9',
    dark: '#ccc',
  },
  
  status: {
    scheduled: '#007AFF',
    inProgress: '#FF9500',
    completed: '#34C759',
    cancelled: '#FF3B30',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 50,
};

export const typography = {
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 22,
    xxxl: 28,
    xxxxl: 32,
  },
  
  weight: {
    normal: '400',
    medium: '500',
    semiBold: '600',
    bold: 'bold',
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 50,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const layout = {
  screen: {
    width,
    height,
  },
  
  headerHeight: 60,
  tabBarHeight: 80,
  
  hitSlop: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  },
};