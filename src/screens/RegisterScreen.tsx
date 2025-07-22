import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { 
  globalStyles, 
  buttonStyles, 
  formStyles, 
  textStyles,
  colors,
  spacing 
} from '../styles';

const RegisterScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    zipCode: '',
    phoneNumber: '',
    jerseySize: 'M' as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL',
    gender: 'Prefer not to say' as 'Woman' | 'Non-binary' | 'Prefer not to say',
    skillLevel: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const success = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        zipCode: formData.zipCode.trim() || undefined,
        phoneNumber: formData.phoneNumber.trim() || undefined,
        jerseySize: formData.jerseySize,
        gender: formData.gender,
        skillLevel: formData.skillLevel,
      });

      if (success) {
        Alert.alert('Success', 'Account created successfully!');
      } else {
        Alert.alert('Registration Failed', 'Unable to create account. Email may already exist.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={globalStyles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
        <View style={{alignItems: 'center', marginBottom: spacing.xxxl}}>
          <Text style={[textStyles.title, {color: colors.primary, marginBottom: spacing.sm}]}>Create Account</Text>
          <Text style={textStyles.subtitle}>Join the soccer community!</Text>
        </View>

        <View style={formStyles.form}>
          <View style={formStyles.inputContainer}>
            <Text style={formStyles.label}>Full Name *</Text>
            <TextInput
              style={formStyles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter your full name"
              autoCapitalize="words"
            />
          </View>

          <View style={formStyles.inputContainer}>
            <Text style={formStyles.label}>Email *</Text>
            <TextInput
              style={formStyles.input}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={formStyles.inputContainer}>
            <Text style={formStyles.label}>Password *</Text>
            <TextInput
              style={formStyles.input}
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={formStyles.inputContainer}>
            <Text style={formStyles.label}>Confirm Password *</Text>
            <TextInput
              style={formStyles.input}
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              placeholder="Confirm your password"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={formStyles.inputContainer}>
            <Text style={formStyles.label}>Zip Code</Text>
            <TextInput
              style={formStyles.input}
              value={formData.zipCode}
              onChangeText={(value) => handleInputChange('zipCode', value)}
              placeholder="Enter your zip code"
              keyboardType="numeric"
              maxLength={5}
            />
          </View>

          <View style={formStyles.inputContainer}>
            <Text style={formStyles.label}>Phone Number</Text>
            <TextInput
              style={formStyles.input}
              value={formData.phoneNumber}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={formStyles.inputContainer}>
            <Text style={formStyles.label}>Jersey Size</Text>
            <View style={formStyles.pickerContainer}>
              <Picker
                selectedValue={formData.jerseySize}
                onValueChange={(value) => handleInputChange('jerseySize', value)}
                style={{height: 50}}
              >
                <Picker.Item label="XS" value="XS" />
                <Picker.Item label="S" value="S" />
                <Picker.Item label="M" value="M" />
                <Picker.Item label="L" value="L" />
                <Picker.Item label="XL" value="XL" />
                <Picker.Item label="XXL" value="XXL" />
              </Picker>
            </View>
          </View>

          <View style={formStyles.inputContainer}>
            <Text style={formStyles.label}>Gender</Text>
            <View style={formStyles.pickerContainer}>
              <Picker
                selectedValue={formData.gender}
                onValueChange={(value) => handleInputChange('gender', value)}
                style={{height: 50}}
              >
                <Picker.Item label="Woman" value="Woman" />
                <Picker.Item label="Non-binary" value="Non-binary" />
                <Picker.Item label="Prefer not to say" value="Prefer not to say" />
              </Picker>
            </View>
          </View>

          <View style={formStyles.inputContainer}>
            <Text style={formStyles.label}>Skill Level</Text>
            <View style={formStyles.pickerContainer}>
              <Picker
                selectedValue={formData.skillLevel}
                onValueChange={(value) => handleInputChange('skillLevel', value)}
                style={{height: 50}}
              >
                <Picker.Item label="Beginner" value="Beginner" />
                <Picker.Item label="Intermediate" value="Intermediate" />
                <Picker.Item label="Advanced" value="Advanced" />
              </Picker>
            </View>
          </View>

          <TouchableOpacity 
            style={[buttonStyles.primary, loading && buttonStyles.disabled, {marginTop: spacing.xl}]} 
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={buttonStyles.primaryText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: spacing.xl}}>
          <Text style={[textStyles.body, {color: colors.text.secondary, marginRight: spacing.sm}]}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={textStyles.link}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};


export default RegisterScreen;