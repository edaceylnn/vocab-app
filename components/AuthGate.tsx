import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import Colors, { primary } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const USE_API = !!process.env.EXPO_PUBLIC_API_URL;

function isAuthPath(pathname: string): boolean {
  return pathname === '/login' || pathname === '/register';
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const bg = Colors[colorScheme ?? 'light'].background;

  useEffect(() => {
    if (!USE_API || loading) return;

    const inAuth = isAuthPath(pathname);
    if (!token && !inAuth) {
      router.replace('/login');
    } else if (token && inAuth) {
      router.replace('/(tabs)');
    }
  }, [token, loading, pathname, router]);

  if (USE_API && loading) {
    return (
      <View style={[styles.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
