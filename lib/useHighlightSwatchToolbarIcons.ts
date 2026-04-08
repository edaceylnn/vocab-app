import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useMemo, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';

/**
 * Colored circle rasters for TenTap toolbar — one icon per hex swatch.
 */
export function useHighlightSwatchToolbarIcons(
  hexColors: readonly string[],
  size = 18
): (ImageSourcePropType | undefined)[] {
  const syncSources = useMemo(() => {
    const mci = MaterialCommunityIcons as typeof MaterialCommunityIcons & {
      getImageSourceSync(name: string, size?: number, color?: string): ImageSourcePropType;
    };
    return hexColors.map((hex) => {
      try {
        return mci.getImageSourceSync('checkbox-blank-circle', size, hex);
      } catch {
        return undefined;
      }
    });
  }, [hexColors, size]);

  const [asyncSources, setAsyncSources] = useState<(ImageSourcePropType | undefined)[] | null>(null);

  useEffect(() => {
    if (syncSources.length > 0 && syncSources.every(Boolean)) {
      setAsyncSources(null);
      return;
    }
    let cancelled = false;
    void Promise.all(
      hexColors.map((hex) => MaterialCommunityIcons.getImageSource('checkbox-blank-circle', size, hex))
    ).then((srcs) => {
      if (!cancelled) {
        setAsyncSources(srcs.map((s) => s ?? undefined));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [hexColors, size, syncSources]);

  return useMemo(
    () => hexColors.map((_, i) => syncSources[i] ?? asyncSources?.[i]),
    [hexColors, syncSources, asyncSources]
  );
}
