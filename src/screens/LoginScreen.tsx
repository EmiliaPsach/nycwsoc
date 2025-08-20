import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { 
  globalStyles, 
  buttonStyles, 
  formStyles, 
  textStyles,
  colors,
  spacing,
  screenConfig
} from '../styles';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const success = await login(email.trim(), password);
      if (!success) {
        Alert.alert('Login Failed', 'Invalid email or password');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('alex@example.com');
    setPassword('demo');
  };

  const handleAdminLogin = () => {
    setEmail('admin@nycwsoc.com');
    setPassword('admin');
  };

  return (
    <KeyboardAvoidingView 
      style={[globalStyles.container, { paddingTop: screenConfig.topPadding }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={globalStyles.scrollContainer}>
        <View style={{ alignItems: 'center', marginBottom: spacing.xxxxl }}>
          <Text style={[textStyles.title, { color: colors.primary, marginBottom: spacing.sm }]}>
            ⚽ NYCWSOC
          </Text>
          <Text style={textStyles.subtitle}>Welcome back!</Text>
        </View>

        <View style={formStyles.form}>
          <View style={formStyles.inputContainer}>
            <Text style={formStyles.label}>Email</Text>
            <TextInput
              style={formStyles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={formStyles.inputContainer}>
            <Text style={formStyles.label}>Password</Text>
            <TextInput
              style={formStyles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity 
            style={[buttonStyles.primary, loading && buttonStyles.disabled, { marginBottom: spacing.md }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={buttonStyles.primaryText}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[buttonStyles.secondary, { marginBottom: spacing.md }]} 
            onPress={handleDemoLogin}
          >
            <Text style={buttonStyles.secondaryText}>
              Use Demo Account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={buttonStyles.secondary} 
            onPress={handleAdminLogin}
          >
            <Text style={buttonStyles.secondaryText}>
              Use Admin Account
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[textStyles.body, { color: colors.text.secondary, marginRight: spacing.sm }]}>
            Don't have an account?
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={textStyles.link}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};


export default LoginScreen;