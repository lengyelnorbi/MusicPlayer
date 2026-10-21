import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  loadStoredSession,
  loginWithPassword,
  logoutSession,
  type StoredSession,
} from "@/services/auth";
import { colors } from "@/theme";
import { loginScreenStyles as styles } from "@/components/styles/LoginScreen.styles";

export default function LoginScreen(
  { onAuthenticated }: { onAuthenticated?: () => void | Promise<void> } = {},
) {
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<StoredSession | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    loadStoredSession()
      .then((value) => {
        if (active) setSession(value);
      })
      .catch(() => {
        if (active) {
          setError("Could not read the saved session from secure storage.");
        }
      })
      .finally(() => {
        if (active) setLoadingSaved(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleLogin() {
    setError("");
    setNotice("");

    if (!identity.trim() || !password) {
      setError("Enter your email address and password.");
      return;
    }

    setSubmitting(true);

    try {
      const saved = await loginWithPassword(identity, password);
      setSession(saved);
      await onAuthenticated?.();
      setPassword("");
      setNotice(
        "Signed in. Your token is securely saved on this phone for later use.",
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to sign in. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    setError("");

    try {
      await logoutSession();
      setSession(null);
      setNotice("Signed out and cleared the saved session on this phone.");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not clear the saved session.",
      );
    }
  }

  const displayName =
    session?.user?.username ??
    session?.user?.Username ??
    session?.user?.email ??
    session?.user?.Email;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logo}>
          <Text style={styles.logoText}>♫</Text>
        </View>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your music library</Text>

        {loadingSaved ? (
          <View style={styles.savedCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.muted}>Checking saved session…</Text>
          </View>
        ) : session ? (
          <View style={styles.savedCard}>
            <View style={styles.statusDot} />
            <Text style={styles.savedTitle}>
              A saved session is available
            </Text>
            <Text style={styles.muted}>
              {displayName
                ? `Account: ${String(displayName)}`
                : "Your access token is stored securely on this device."}
            </Text>
            <Text style={styles.offlineNote}>
              Your session is saved securely on this phone. Offline access to
              music depends on locally cached content.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void handleLogout()}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>Remove saved session</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              value={identity}
              onChangeText={setIdentity}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
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
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              textContentType="password"
              style={styles.input}
              editable={!submitting}
              returnKeyType="go"
              onSubmitEditing={() => void handleLogin()}
            />

            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={() => void handleLogin()}
              style={({ pressed }) => [
                styles.primaryButton,
                submitting && styles.disabled,
                pressed && !submitting && styles.disabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.primaryButtonText}>Sign in</Text>
              )}
            </Pressable>

            <Text style={styles.smallPrint}>
              Sign in requires an internet connection. Your session will be
              saved securely on this phone.
            </Text>
          </View>
        )}

        {!!error && (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        )}

        {!!notice && <Text style={styles.notice}>{notice}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}