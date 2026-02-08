import { Tabs, useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import Colors, { primary } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const FAB_SIZE = 56;
const FAB_ICON_SIZE = 28;

const ICON_SIZE = 24;

function TabIcon(props: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color: string;
  focused?: boolean;
}) {
  return (
    <View style={styles.iconWrap}>
      <MaterialCommunityIcons
        name={props.name}
        size={ICON_SIZE}
        color={props.color}
        style={styles.icon}
      />
    </View>
  );
}

function AddTabButton(props: { style?: object; onPress?: () => void; [key: string]: unknown }) {
  const router = useRouter();
  const colors = Colors[useColorScheme() ?? 'light'];
  const openAdd = () => router.push('/add');
  return (
    <Pressable
      {...props}
      onPress={openAdd}
      style={[props.style, styles.fabTabWrap]}
    >
      <View style={styles.fabOuter}>
        <View style={styles.fab}>
          <MaterialCommunityIcons name="plus" size={FAB_ICON_SIZE} color="#fff" />
        </View>
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colorScheme === 'dark' ? 'rgba(11,13,17,0.95)' : 'rgba(255,255,255,0.95)',
            borderTopColor: colorScheme === 'dark' ? 'rgba(51,65,85,0.6)' : 'rgba(226,232,240,0.8)',
            paddingBottom: insets.bottom,
            height: 72 + insets.bottom,
          },
        ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Daily',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'calendar-today' : 'calendar-blank-outline'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'book-open' : 'book-open-variant'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Add',
          tabBarIcon: () => null,
          tabBarButton: (props) => <AddTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'chart-box' : 'chart-box-outline'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'cog' : 'cog-outline'}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 28,
  },
  icon: { marginBottom: -2 },
  tabBar: {
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    paddingTop: 8,
    height: 72,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabItem: {
    paddingTop: 4,
  },
  fabTabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  fabOuter: {
    marginTop: -24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  fabPressed: { opacity: 0.9 },
  fabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
});
