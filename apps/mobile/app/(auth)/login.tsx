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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setIsSubmitting(false);

    if (error) {
      Alert.alert('Could not sign in', error.message);
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
              title="Welcome back"
              subtitle="Sign in and pick up the conversation where you left it."
            />
          </View>

          <View style={styles.form}>
            {!hasMobileSupabaseEnv ? (
              <Text style={styles.envWarning}>Add mobile Supabase env vars before signing in.</Text>
            ) : null}
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
              onSubmitEditing={handleLogin}
              placeholder="Your password"
              returnKeyType="done"
              secureTextEntry
              textContentType="password"
              value={password}
            />
            <PrimaryButton disabled={!hasMobileSupabaseEnv} loading={isSubmitting} onPress={handleLogin}>
              Sign in
            </PrimaryButton>
            <Link href="/signup" style={styles.link}>
              Create an account
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
    gap: 16,
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
