import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { createLocalMusicDatabase } from '@/services/sqliteExport';

export default function CreateSqliteDatabaseButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleCreate = async () => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    setIsError(false);
    try {
      const result = await createLocalMusicDatabase();
      const total = Object.values(result.counts).reduce((sum, count) => sum + count, 0);
      setMessage(`SQLite database updated on this device. ${total} records copied.\n${Object.entries(result.counts).map(([table, count]) => `${table}: ${count}`).join(' · ')}`);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Could not create the SQLite database.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable accessibilityRole="button" disabled={busy} onPress={handleCreate} style={({ pressed }) => [styles.button, pressed && !busy && styles.pressed, busy && styles.disabled]}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sync local database</Text>}
      </Pressable>
      {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, isError && styles.error]}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: 8, marginVertical: 12 },
  button: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: '#db2777', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  message: { color: '#166534', fontSize: 13, lineHeight: 19 },
  error: { color: '#b91c1c' },
});
