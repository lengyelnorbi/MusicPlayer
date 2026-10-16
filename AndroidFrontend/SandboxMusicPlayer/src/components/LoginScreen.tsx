import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { loadStoredSession, loginWithPassword, logoutSession, type StoredSession } from '@/services/auth';

export default function LoginScreen({ onAuthenticated }: { onAuthenticated?: () => void | Promise<void> } = {}) {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<StoredSession | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    loadStoredSession()
      .then(value => { if (active) setSession(value); })
      .catch(() => { if (active) setError('Could not read the saved session from secure storage.'); })
      .finally(() => { if (active) setLoadingSaved(false); });
    return () => { active = false; };
  }, []);

  async function handleLogin() {
    setError('');
    setNotice('');
    if (!identity.trim() || !password) {
      setError('Enter your email address and password.');
      return;
    }
    setSubmitting(true);
    try {
      const saved = await loginWithPassword(identity, password);
      setSession(saved);
      await onAuthenticated?.();
      setPassword('');
      setNotice('Signed in. Your token is securely saved on this phone for later use.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign in. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setError('');
    try {
      await logoutSession();
      setSession(null);
      setNotice('Signed out and cleared the saved session on this phone.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not clear the saved session.');
    }
  }

  const displayName = session?.user?.username ?? session?.user?.Username ?? session?.user?.email ?? session?.user?.Email;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.logo}><Text style={styles.logoText}>♫</Text></View>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your music library</Text>

        {loadingSaved ? (
          <View style={styles.savedCard}><ActivityIndicator color="#8b5cf6" /><Text style={styles.muted}>Checking saved session…</Text></View>
        ) : session ? (
          <View style={styles.savedCard}>
            <View style={styles.statusDot} />
            <Text style={styles.savedTitle}>A saved session is available</Text>
            <Text style={styles.muted}>{displayName ? `Account: ${String(displayName)}` : 'Your access token is stored securely on this device.'}</Text>
            <Text style={styles.offlineNote}>Your session is saved securely on this phone. Offline access to music depends on locally cached content.</Text>
            <Pressable style={styles.linkButton} onPress={handleLogout}><Text style={styles.linkText}>Remove saved session</Text></Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              value={identity}
              onChangeText={setIdentity}
              placeholder="you@example.com"
              placeholderTextColor="#7c7c8a"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
              style={styles.input}
              editable={!submitting}
              returnKeyType="next"
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#7c7c8a"
              secureTextEntry
              textContentType="password"
              style={styles.input}
              editable={!submitting}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
            <Pressable style={[styles.primaryButton, submitting && styles.disabled]} onPress={handleLogin} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign in</Text>}
            </Pressable>
            <Text style={styles.smallPrint}>Sign in requires an internet connection. Your session will be saved securely on this phone.</Text>
          </View>
        )}

        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        {!!notice && <Text style={styles.notice}>{notice}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0b12' },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 36 },
  logo: { width: 68, height: 68, borderRadius: 22, backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 22 },
  logoText: { color: '#fff', fontSize: 38, fontWeight: '700' },
  title: { color: '#fff', fontSize: 30, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#a1a1b2', fontSize: 15, textAlign: 'center', marginTop: 8, marginBottom: 30 },
  form: { width: '100%' },
  label: { color: '#e4e4ec', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 14 },
  input: { color: '#fff', backgroundColor: '#171722', borderColor: '#303041', borderWidth: 1, borderRadius: 13, paddingHorizontal: 15, paddingVertical: 14, fontSize: 16 },
  primaryButton: { backgroundColor: '#7c3aed', borderRadius: 13, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.65 },
  smallPrint: { color: '#88889a', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 16 },
  savedCard: { backgroundColor: '#171722', borderColor: '#303041', borderWidth: 1, borderRadius: 18, padding: 20, alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#34d399' },
  savedTitle: { color: '#fff', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  muted: { color: '#b1b1c2', fontSize: 14, textAlign: 'center' },
  offlineNote: { color: '#a1a1b2', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 4 },
  linkButton: { padding: 8 },
  linkText: { color: '#c4b5fd', fontWeight: '700' },
  error: { color: '#fca5a5', backgroundColor: '#35191e', borderRadius: 10, padding: 12, marginTop: 18, lineHeight: 19 },
  notice: { color: '#a7f3d0', backgroundColor: '#123126', borderRadius: 10, padding: 12, marginTop: 18, lineHeight: 19 },
});
