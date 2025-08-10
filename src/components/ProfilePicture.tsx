// components/ProfilePicture.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, shadows } from '../styles';

interface ProfilePictureProps {
  user: {
    name: string;
    profilePicture?: string;
  };
  size?: number;
  onPress?: () => void;
  showEditIcon?: boolean;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  user,
  size = 80,
  onPress,
  showEditIcon = false,
}) => {
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const renderContent = () => {
    if (user.profilePicture) {
      return (
        <Image
          source={{ uri: user.profilePicture }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          resizeMode="cover"
        />
      );
    }

    // Default to initials
    return (
      <View
        style={[
          styles.initialsContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text
          style={[
            styles.initialsText,
            {
              fontSize: size * 0.35, // Scale font size with container
            },
          ]}
        >
          {getInitials(user.name)}
        </Text>
      </View>
    );
  };

  const content = (
    <View style={{ position: 'relative' }}>
      {renderContent()}
      {showEditIcon && (
        <View
          style={[
            styles.editIcon,
            {
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: size * 0.15,
              bottom: 0,
              right: 0,
            },
          ]}
        >
          <Text
            style={[
              styles.editIconText,
              {
                fontSize: size * 0.15,
              },
            ]}
          >
            📷
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.border.light,
  },
  initialsContainer: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border.light,
    ...shadows.card,
  },
  initialsText: {
    color: colors.text.inverse,
    fontWeight: typography.weight.bold,
  },
  editIcon: {
    position: 'absolute',
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.button,
  },
  editIconText: {
    textAlign: 'center',
  },
});

export default ProfilePicture;