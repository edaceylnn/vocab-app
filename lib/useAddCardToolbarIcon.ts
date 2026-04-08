import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useMemo, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';

/**
 * Raster icon for TenTap Toolbar (Image-only) — "add as flashcard" affordance.
 * Uses native sync rasterization when available; falls back to async (e.g. web).
 */
export function useAddCardToolbarIcon(iconColor: string, size = 22): ImageSourcePropType | undefined {
  const syncSource = useMemo(() => {
    try {
      const mci = MaterialCommunityIcons as typeof MaterialCommunityIcons & {
        getImageSourceSync(name: string, size?: number, color?: string): ImageSourcePropType;
      };
      return mci.getImageSourceSync('plus', size, iconColor);
    } catch {
      return undefined;
    }
  }, [iconColor, size]);

  const [asyncSource, setAsyncSource] = useState<ImageSourcePropType | undefined>(undefined);

  useEffect(() => {
    if (syncSource) {
      setAsyncSource(undefined);
      return;
    }
    let cancelled = false;
    void MaterialCommunityIcons.getImageSource('plus', size, iconColor).then((src) => {
      if (!cancelled && src) setAsyncSource(src);
    });
    return () => {
      cancelled = true;
    };
  }, [syncSource, iconColor, size]);

  return syncSource ?? asyncSource;
}
