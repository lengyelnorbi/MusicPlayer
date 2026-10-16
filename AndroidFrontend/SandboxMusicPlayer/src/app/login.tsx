import React from 'react';
import { useRouter } from 'expo-router';
import LoginScreen from '@/components/LoginScreen';
import { useMusicApp } from '@/context/MusicAppContext';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function LoginRoute() {
  const router = useRouter();
  const { refreshSession } = useMusicApp();
  return <View style={styles.root}><View style={styles.top}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable></View><LoginScreen onAuthenticated={async () => { await refreshSession(); router.back(); }} /></View>;
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: '#0b0b12' }, top: { paddingHorizontal: 20, paddingTop: 18 }, back: { color: '#c4b5fd', fontSize: 16, fontWeight: '700' } });
