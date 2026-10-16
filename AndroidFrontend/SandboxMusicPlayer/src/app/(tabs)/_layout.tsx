import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useMusicApp } from '@/context/MusicAppContext';
import { HamburgerMenu } from '@/components/HamburgerMenu';

export default function TabsLayout() {
  const router = useRouter();
  const { mode, setMenuOpen } = useMusicApp();
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Open menu" onPress={() => setMenuOpen(true)} style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
          <View style={styles.brandBlock}>
            <Text style={styles.brand}>My Music</Text>
            <Text style={styles.subtitle}>Your library, your way</Text>
          </View>
          <View style={[styles.modeBadge, mode === 'offline' && styles.offlineBadge]}>
            <View style={[styles.dot, mode === 'offline' && styles.offlineDot]} />
            <Text style={styles.modeText}>{mode.toUpperCase()}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open sign in" onPress={() => router.push('/login')} style={styles.accountButton}>
            <Text style={styles.accountIcon}>♙</Text>
          </Pressable>
        </View>
      </SafeAreaView>
      <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#0b0b12' }, tabBarStyle: { backgroundColor: '#14131d', borderTopColor: '#252033' }, tabBarActiveTintColor: '#ddd6fe', tabBarInactiveTintColor: '#858397', tabBarLabelStyle: { fontWeight: '700' } }}>
        <Tabs.Screen name="index" options={{ title: 'Musics' }} />
        <Tabs.Screen name="playlists" options={{ title: 'Playlists' }} />
      </Tabs>
      <HamburgerMenu onLogin={() => router.push('/login')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0b12' }, safeTop: { backgroundColor: '#0b0b12' },
  header: { minHeight: 68, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#211d2e' },
  menuButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#1a1725', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#302943' },
  menuIcon: { color: '#ddd6fe', fontSize: 21, fontWeight: '800' }, brandBlock: { flex: 1 }, brand: { color: '#fff', fontSize: 18, fontWeight: '900' }, subtitle: { color: '#858397', fontSize: 11, marginTop: 2 },
  modeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#14291f', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 20 }, offlineBadge: { backgroundColor: '#302044' }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34d399' }, offlineDot: { backgroundColor: '#c4b5fd' }, modeText: { color: '#d1fae5', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  accountButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#272039', alignItems: 'center', justifyContent: 'center' }, accountIcon: { color: '#ddd6fe', fontSize: 21 },
});
