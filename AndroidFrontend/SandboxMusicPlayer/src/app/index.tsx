import * as Device from 'expo-device';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { HintRow } from '@/components/hint-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import {
  BottomTabInset,
  MaxContentWidth,
  Spacing,
} from '@/constants/theme';
import { MusicListResponse } from '@/types/music-list-response';
import { Music } from '@/types/music';
import { getMusicList } from '@/services/musicService'; // Adjust to the file where you define getMusicList

const PAGE_SIZE = 10;

function getDevMenuHint() {
  if (Platform.OS === 'web') {
    return <ThemedText type="small">use browser devtools</ThemedText>;
  }

  if (Device.isDevice) {
    return (
      <ThemedText type="small">
        shake device or press <ThemedText type="code">m</ThemedText> in terminal
      </ThemedText>
    );
  }

  const shortcut =
    Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';

  return (
    <ThemedText type="small">
      press <ThemedText type="code">{shortcut}</ThemedText>
    </ThemedText>
  );
}

// Produces page numbers and ellipses, e.g.
// [1, 2, 3, '...', 20, 21, 22]
function getPaginationItems(
  totalPages: number,
  currentPage: number
): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 3) {
    return [
      1, 2, 3, 'ellipsis',
      totalPages - 2, totalPages - 1, totalPages,
    ];
  }

  if (currentPage >= totalPages - 2) {
    return [
      1, 'ellipsis',
      totalPages - 4, totalPages - 3, totalPages - 2,
      totalPages - 1, totalPages,
    ];
  }

  return [
    1, 'ellipsis',
    currentPage - 1, currentPage, currentPage + 1,
    'ellipsis', totalPages,
  ];
}

export default function HomeScreen() {
  const [musicList, setMusicList] =
    useState<MusicListResponse>(new MusicListResponse());

  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMusic = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getMusicList(page, PAGE_SIZE);
      setMusicList(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load music.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMusic(currentPage);
  }, [currentPage, loadMusic]);

  const totalPages = musicList.totalPages;
  const paginationItems = getPaginationItems(
    totalPages,
    currentPage
  );

  const changePage = (page: number) => {
    if (
      page >= 1 &&
      page <= totalPages &&
      page !== currentPage
    ) {
      setCurrentPage(page);
    }
  };

  const renderMusic = ({ item }: { item: Music }) => (
  <ThemedView style={styles.musicItem}>
    <View style={styles.musicInfo}>
      <ThemedText type="default" style={styles.musicTitle}>
        {item.title}
      </ThemedText>

      <ThemedText type="small">
        Genre: {item.genre || 'Unknown'}
      </ThemedText>

      <ThemedText type="small">
        Added: {item.addedAt
          ? new Date(item.addedAt).toLocaleDateString()
          : 'Unknown'}
      </ThemedText>

      <ThemedText type="small">
        Playlists: {item.playlistIDs.length > 0
          ? item.playlistIDs.join(', ')
          : 'None'}
      </ThemedText>
    </View>
  </ThemedView>
);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Music Library</ThemedText>
        {error && (
          <ThemedView style={styles.message}>
            <ThemedText>{error}</ThemedText>
            <Pressable onPress={() => loadMusic(currentPage)}>
              <ThemedText type="link">Try again</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" />
            <ThemedText>Loading music...</ThemedText>
          </View>
        ) : (
          <>
            <ThemedText type="small">
              {musicList.totalItemCount} songs found
            </ThemedText>

            <FlatList
              style={styles.list}
              data={musicList.items}
              renderItem={renderMusic}
              keyExtractor={(item) => String(item.id)}
              ListEmptyComponent={
                <ThemedText style={styles.message}>
                  No music found.
                </ThemedText>
              }
              contentContainerStyle={styles.listContent}
            />

            {totalPages > 0 && (
              <View style={styles.pagination}>
                <Pressable
                  disabled={currentPage === 1 || loading}
                  onPress={() => changePage(currentPage - 1)}
                  style={[
                    styles.pageButton,
                    (currentPage === 1 || loading) &&
                      styles.disabledButton,
                  ]}
                >
                  <ThemedText>Previous</ThemedText>
                </Pressable>

                {paginationItems.map((item, index) =>
                  item === 'ellipsis' ? (
                    <View
                      key={`ellipsis-${index}`}
                      style={styles.ellipsis}
                    >
                      <ThemedText>...</ThemedText>
                    </View>
                  ) : (
                    <Pressable
                      key={item}
                      disabled={loading}
                      onPress={() => changePage(item)}
                      style={[
                        styles.pageButton,
                        currentPage === item &&
                          styles.activePageButton,
                      ]}
                    >
                      <ThemedText
                        style={
                          currentPage === item
                            ? styles.activePageText
                            : undefined
                        }
                      >
                        {item}
                      </ThemedText>
                    </Pressable>
                  )
                )}

                <Pressable
                  disabled={
                    currentPage === totalPages || loading
                  }
                  onPress={() => changePage(currentPage + 1)}
                  style={[
                    styles.pageButton,
                    (currentPage === totalPages || loading) &&
                      styles.disabledButton,
                  ]}
                >
                  <ThemedText>Next</ThemedText>
                </Pressable>
              </View>
            )}
          </>
        )}

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  list: {
    width: '100%',
    flex: 1,
  },
  listContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  musicItem: {
    alignSelf: 'stretch',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  musicInfo: {
    gap: Spacing.one,
  },
  musicTitle: {
    fontWeight: '600',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  message: {
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
  },
  pagination: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  pageButton: {
    minWidth: 36,
    minHeight: 36,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#999999',
  },
  activePageButton: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  activePageText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.4,
  },
  ellipsis: {
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
});