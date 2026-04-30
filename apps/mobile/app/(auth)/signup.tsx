import { Link } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Field, PrimaryButton, Screen, ScreenTitle } from '@/components/frankie-ui';
import { colors } from '@/constants/frankie-theme';
import { hasMobileSupabaseEnv, supabase } from '@/lib/supabase';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup() {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing details', 'Fill out your name, email, and password.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Re-enter the password confirmation.');
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });
    setIsSubmitting(false);

    if (error) {
      Alert.alert('Could not create account', error.message);
      return;
    }

    if (!data.session) {
      Alert.alert('Check your email', 'Confirm your email, then come back to sign in.');
    }
  }

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        keyboardVerticalOffset={12}
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.keyboard}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.wordmark}>Frankie Fit</Text>
            <ScreenTitle
              title="Start with Frankie"
              subtitle="Create your account, then we will collect the coaching context that matters."
            />
          </View>

          <View style={styles.form}>
            {!hasMobileSupabaseEnv ? (
              <Text style={styles.envWarning}>Add mobile Supabase env vars before signing up.</Text>
            ) : null}
            <Field
              label="Name"
              onChangeText={setFullName}
              placeholder="Michael"
              returnKeyType="next"
              value={fullName}
            />
            <Field
              autoComplete="email"
              keyboardType="email-address"
              label="Email"
              onChangeText={setEmail}
              placeholder="you@example.com"
              returnKeyType="next"
              textContentType="emailAddress"
              value={email}
            />
            <Field
              label="Password"
              onChangeText={setPassword}
              placeholder="Create a password"
              returnKeyType="next"
              secureTextEntry
              textContentType="newPassword"
              value={password}
            />
            <Field
              label="Confirm password"
              onChangeText={setConfirmPassword}
              onSubmitEditing={handleSignup}
              placeholder="Repeat password"
              returnKeyType="done"
              secureTextEntry
              textContentType="newPassword"
              value={confirmPassword}
            />
            <PrimaryButton disabled={!hasMobileSupabaseEnv} loading={isSubmitting} onPress={handleSignup}>
              Create account
            </PrimaryButton>
            <Link href="/login" style={styles.link}>
              I already have an account
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 24,
  },
  wordmark: {
    color: colors.accentStrong,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 22,
  },
  form: {
    gap: 14,
    paddingBottom: 12,
  },
  envWarning: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    color: colors.accentStrong,
    fontSize: 15,
    fontWeight: '700',
    paddingTop: 6,
    textAlign: 'center',
  },
});
