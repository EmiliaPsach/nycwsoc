import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DataStore } from '../services/DataStore';
import { User } from '../types';
import {
  globalStyles,
  headerStyles,
  textStyles,
  buttonStyles,
  formStyles,
  modalStyles,
  colors,
  spacing,
  typography,
  borderRadius
} from '../styles';

const ProfileScreen = () => {
  const { user, logout, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);
  const dataStore = new DataStore();

  useEffect(() => {
    if (user) {
      setEditedUser(user);
    }
  }, [user]);

  const handleSave = async () => {
    if (!editedUser) return;

    setLoading(true);
    try {
      await dataStore.updateUser(editedUser);
      setUser(editedUser);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  const handleLogout = () => {
    setConfirmLogoutVisible(true);
  };

  const confirmLogout = () => {
    logout();
    setConfirmLogoutVisible(false);
  };

  if (!user || !editedUser) {
    return (
      <View style={globalStyles.loadingContainer}>
        <Text style={globalStyles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const ProfileField = ({
    label,
    value,
    onChangeText,
    placeholder,
    options,
    multiline = false,
    keyboardType = 'default',
  }: {
    label: string;
    value?: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    options?: string[];
    multiline?: boolean;
    keyboardType?: 'default' | 'email-address' | 'phone-pad';
  }) => (
    <View style={formStyles.inputContainer}>
      <Text style={formStyles.label}>{label}</Text>
      {isEditing ? (
        options ? (
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm}}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  {
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.sm,
                    borderWidth: 1,
                    borderColor: colors.border.light,
                    borderRadius: borderRadius.full,
                    backgroundColor: colors.background.card,
                  },
                  value === option && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => onChangeText(option)}
              >
                <Text
                  style={[
                    {
                      fontSize: typography.size.sm,
                      color: colors.text.secondary,
                      fontWeight: typography.weight.medium,
                    },
                    value === option && {
                      color: colors.text.inverse,
                      fontWeight: typography.weight.semiBold,
                    },
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TextInput
            style={[formStyles.input, multiline && {height: 80, textAlignVertical: 'top'}]}
            value={value || ''}
            onChangeText={onChangeText}
            placeholder={placeholder}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
            keyboardType={keyboardType}
          />
        )
      ) : (
        <Text style={[textStyles.body, {paddingVertical: spacing.md, paddingHorizontal: spacing.lg, backgroundColor: colors.background.main, borderRadius: borderRadius.sm}]}>{value || 'Not specified'}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={globalStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[headerStyles.header, {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}]}>
        <Text style={headerStyles.headerTitle}>Profile</Text>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          {isEditing ? (
            <>
              <TouchableOpacity
                style={[buttonStyles.small, {backgroundColor: colors.text.secondary, marginRight: spacing.sm}]}
                onPress={handleCancel}
              >
                <Text style={buttonStyles.smallText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.small, {backgroundColor: colors.secondary}]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={buttonStyles.smallText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={buttonStyles.small}
              onPress={() => setIsEditing(true)}
            >
              <Text style={buttonStyles.smallText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={{flex: 1}} showsVerticalScrollIndicator={false}>
        <View style={{alignItems: 'center', padding: spacing.xxxl, backgroundColor: colors.background.card}}>
          <View style={{width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md}}>
            <Text style={{color: colors.text.inverse, fontSize: typography.size.xxl, fontWeight: typography.weight.bold}}>
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </Text>
          </View>
          <Text style={[textStyles.title, {fontSize: typography.size.xl, marginBottom: spacing.xs}]}>{user.name}</Text>
          <Text style={textStyles.subtitle}>{user.email}</Text>
        </View>

        <View style={{backgroundColor: colors.background.card, marginTop: spacing.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl}}>
          <Text style={[textStyles.title, {fontSize: typography.size.lg, marginBottom: spacing.xl}]}>Personal Information</Text>

          <ProfileField
            label="Full Name"
            value={editedUser.name}
            onChangeText={(text) => setEditedUser({ ...editedUser, name: text })}
            placeholder="Enter your full name"
          />

          <ProfileField
            label="Email"
            value={editedUser.email}
            onChangeText={(text) => setEditedUser({ ...editedUser, email: text })}
            placeholder="Enter your email"
            keyboardType="email-address"
          />

          <ProfileField
            label="Phone Number"
            value={editedUser.phoneNumber}
            onChangeText={(text) =>
              setEditedUser({ ...editedUser, phoneNumber: text })
            }
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />

          <ProfileField
            label="Zip Code"
            value={editedUser.zipCode}
            onChangeText={(text) =>
              setEditedUser({ ...editedUser, zipCode: text })
            }
            placeholder="Enter your zip code"
          />
        </View>

        <View style={{backgroundColor: colors.background.card, marginTop: spacing.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl}}>
          <Text style={[textStyles.title, {fontSize: typography.size.lg, marginBottom: spacing.xl}]}>Soccer Preferences</Text>

          <ProfileField
            label="Skill Level"
            value={editedUser.skillLevel}
            onChangeText={(text) =>
              setEditedUser({
                ...editedUser,
                skillLevel: text as User['skillLevel'],
              })
            }
            placeholder="Select your skill level"
            options={['Beginner', 'Intermediate', 'Advanced']}
          />

          <ProfileField
            label="Jersey Size"
            value={editedUser.jerseySize}
            onChangeText={(text) =>
              setEditedUser({
                ...editedUser,
                jerseySize: text as User['jerseySize'],
              })
            }
            placeholder="Select your jersey size"
            options={['XS', 'S', 'M', 'L', 'XL', 'XXL']}
          />

          <ProfileField
            label="Gender"
            value={editedUser.gender}
            onChangeText={(text) =>
              setEditedUser({ ...editedUser, gender: text as User['gender'] })
            }
            placeholder="Select your gender"
            options={['Woman', 'Non-binary', 'Prefer not to say']}
          />
        </View>

        <View style={{backgroundColor: colors.background.card, marginTop: spacing.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl}}>
          <Text style={[textStyles.title, {fontSize: typography.size.lg, marginBottom: spacing.xl}]}>Account Information</Text>
          
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.light}}>
            <Text style={[textStyles.body, {color: colors.text.secondary}]}>Member Since:</Text>
            <Text style={[textStyles.body, {fontWeight: typography.weight.medium}]}>
              {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.light}}>
            <Text style={[textStyles.body, {color: colors.text.secondary}]}>Teams:</Text>
            <Text style={[textStyles.body, {fontWeight: typography.weight.medium}]}>
              {user.teams.length} {user.teams.length === 1 ? 'team' : 'teams'}
            </Text>
          </View>
          
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.light}}>
            <Text style={[textStyles.body, {color: colors.text.secondary}]}>Status:</Text>
            <Text style={[textStyles.body, {fontWeight: typography.weight.semiBold, color: colors.secondary}]}>
              {user.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={{backgroundColor: colors.background.card, marginTop: spacing.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl}}>
          <Text style={[textStyles.title, {fontSize: typography.size.lg, marginBottom: spacing.xl}]}>Actions</Text>
          
          <TouchableOpacity 
            style={{paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border.light}}
            onPress={() => Alert.alert('Contact Support', 'Please email support@nycwsoc.com for assistance.')}
          >
            <Text style={[textStyles.body, {color: colors.primary, fontWeight: typography.weight.medium}]}>Contact Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border.light}}
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy details would be shown here.')}
          >
            <Text style={[textStyles.body, {color: colors.primary, fontWeight: typography.weight.medium}]}>Privacy Policy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border.light}}
            onPress={() => Alert.alert('Terms of Service', 'Terms of service would be shown here.')}
          >
            <Text style={[textStyles.body, {color: colors.primary, fontWeight: typography.weight.medium}]}>Terms of Service</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{paddingVertical: spacing.lg, paddingHorizontal: spacing.lg}}
            onPress={handleLogout}
          >
            <Text style={[textStyles.body, {color: colors.danger, fontWeight: typography.weight.semiBold}]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmLogoutVisible}
        onRequestClose={() => setConfirmLogoutVisible(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.container, {alignItems: 'center'}]}>
            <Text style={modalStyles.title}>Sign Out</Text>
            <Text style={[textStyles.body, {color: colors.text.secondary, textAlign: 'center', marginBottom: spacing.xxl, lineHeight: typography.size.md * typography.lineHeight.relaxed}]}>
              Are you sure you want to sign out of your account?
            </Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', width: '100%'}}>
              <TouchableOpacity
                style={[{flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: borderRadius.sm, alignItems: 'center', backgroundColor: colors.background.disabled, marginRight: spacing.sm}]}
                onPress={() => setConfirmLogoutVisible(false)}
              >
                <Text style={[textStyles.body, {color: colors.text.secondary, fontWeight: typography.weight.semiBold}]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[{flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: borderRadius.sm, alignItems: 'center', backgroundColor: colors.danger, marginLeft: spacing.sm}]}
                onPress={confirmLogout}
              >
                <Text style={[textStyles.body, {color: colors.text.inverse, fontWeight: typography.weight.semiBold}]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};


export default ProfileScreen;