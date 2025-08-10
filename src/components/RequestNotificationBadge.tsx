// components/RequestNotificationBadge.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { colors, spacing, typography } from '../styles';

interface RequestNotificationBadgeProps {
  onPress: () => void;
  type: 'captain' | 'admin';
}

const RequestNotificationBadge: React.FC<RequestNotificationBadgeProps> = ({ onPress, type }) => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const dataStore = new DataStore();

  useEffect(() => {
    if (!user) return;

    const loadRequestCount = async () => {
      try {
        if (type === 'captain') {
          const requests = await dataStore.getTeamJoinRequestsForCaptain(user.id);
          setCount(requests.length);
        } else if (type === 'admin' && (user.role === 'admin' || user.role === 'super_admin')) {
          const requests = await dataStore.getTeamCreationRequestsForAdmin();
          setCount(requests.length);
        }
      } catch (error) {
        console.error('Error loading request count:', error);
      }
    };

    loadRequestCount();

    // Refresh every 30 seconds
    const interval = setInterval(loadRequestCount, 30000);
    return () => clearInterval(interval);
  }, [user, type]);

  if (count === 0) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 20,
        marginRight: spacing.sm,
      }}
    >
      <Text
        style={{
          color: colors.text.inverse,
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semiBold,
          marginRight: spacing.xs,
        }}
      >
        {type === 'captain' ? '👥' : '⚡'}
      </Text>
      <Text
        style={{
          color: colors.text.inverse,
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semiBold,
        }}
      >
        {count} pending
      </Text>
    </TouchableOpacity>
  );
};

export default RequestNotificationBadge;