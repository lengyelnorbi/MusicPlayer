import React, { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { styles } from "@/styles/styles";
type Page = number | "ellipsis";
type Props = { currentPage: number; maxPageCount: number; onPageChange: (p: number) => void };

export function MusicPagination({ currentPage, maxPageCount, onPageChange }: Props) {
  const items = useMemo<Page[]>(() => {
    if (maxPageCount <= 5) return Array.from({ length: maxPageCount }, (_, i) => i + 1);
    let pages: number[];
    if (currentPage <= 3) pages = [1, 2, 3, -1, maxPageCount];
    else if (currentPage >= maxPageCount - 2) pages = [1, -1, maxPageCount - 2, maxPageCount - 1, maxPageCount];
    else pages = [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, maxPageCount];
    return pages.map(p => p === -1 ? "ellipsis" : p);
  }, [currentPage, maxPageCount]);

  return <View style={styles.pagination}>
    <Pressable disabled={currentPage <= 1} onPress={() => onPageChange(Math.max(1, currentPage - 1))}
      style={({ pressed }) => [styles.limitButton, styles.arrowButton, currentPage <= 1 && styles.pageDisabled, pressed && currentPage > 1 && styles.pageActive]}>
      <Text style={styles.arrowText}>‹</Text>
    </Pressable>
    {items.map((page, i) => page === "ellipsis"
      ? <Text key={`ellipsis-${i}`} style={styles.ellipsis}>…</Text>
      : <Pressable key={page} onPress={() => onPageChange(page)} style={[styles.pageButton, currentPage === page && styles.pageActive]}><Text style={styles.pageText}>{page}</Text></Pressable>)}
    <Pressable disabled={!maxPageCount || currentPage >= maxPageCount} onPress={() => onPageChange(Math.min(maxPageCount, currentPage + 1))}
      style={({ pressed }) => [styles.limitButton, styles.arrowButton, (!maxPageCount || currentPage >= maxPageCount) && styles.pageDisabled, pressed && currentPage < maxPageCount && styles.pageActive]}>
      <Text style={styles.arrowText}>›</Text>
    </Pressable>
  </View>;
}
