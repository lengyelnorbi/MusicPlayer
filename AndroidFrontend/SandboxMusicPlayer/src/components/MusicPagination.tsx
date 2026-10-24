import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { musicPaginationStyles as styles } from "@/components/styles/MusicPagination.styles";

type Page = number | "ellipsis";

type Props = {
  currentPage: number;
  maxPageCount: number;
  onPageChange: (p: number) => void;
};

export function MusicPagination({
  currentPage,
  maxPageCount,
  onPageChange,
}: Props) {
  const items = useMemo<Page[]>(() => {
    if (maxPageCount <= 0) return [];
    if (maxPageCount <= 5) {
      return Array.from({ length: maxPageCount }, (_, i) => i + 1);
    }

    let pages: number[];

    if (currentPage <= 3) {
      pages = [1, 2, 3, -1, maxPageCount];
    } else if (currentPage >= maxPageCount - 2) {
      pages = [
        1,
        -1,
        maxPageCount - 2,
        maxPageCount - 1,
        maxPageCount,
      ];
    } else {
      pages = [
        1,
        -1,
        currentPage - 1,
        currentPage,
        currentPage + 1,
        -1,
        maxPageCount,
      ];
    }

    return pages.map((page) => (page === -1 ? "ellipsis" : page));
  }, [currentPage, maxPageCount]);

  const previousDisabled = currentPage <= 1;
  const nextDisabled = !maxPageCount || currentPage >= maxPageCount;

  return (
    <View style={styles.pagination}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous page"
        disabled={previousDisabled}
        onPress={() => onPageChange(Math.max(1, currentPage - 1))}
        style={({ pressed }) => [
          styles.limitButton,
          styles.arrowButton,
          previousDisabled && styles.pageDisabled,
          pressed && !previousDisabled && styles.pageActive,
        ]}
      >
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>

      {items.map((page, index) =>
        page === "ellipsis" ? (
          <Text key={`ellipsis-${index}`} style={styles.ellipsis}>
            …
          </Text>
        ) : (
          <Pressable
            key={page}
            accessibilityRole="button"
            accessibilityLabel={`Page ${page}`}
            accessibilityState={{ selected: currentPage === page }}
            onPress={() => onPageChange(page)}
            style={[
              styles.pageButton,
              currentPage === page && styles.pageActive,
            ]}
          >
            <Text
              style={[
                styles.pageText,
                currentPage === page && styles.pageTextActive,
              ]}
            >
              {page}
            </Text>
          </Pressable>
        ),
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next page"
        disabled={nextDisabled}
        onPress={() =>
          onPageChange(Math.min(maxPageCount, currentPage + 1))
        }
        style={({ pressed }) => [
          styles.limitButton,
          styles.arrowButton,
          nextDisabled && styles.pageDisabled,
          pressed && !nextDisabled && styles.pageActive,
        ]}
      >
        <Text style={styles.arrowText}>›</Text>
      </Pressable>
    </View>
  );
}