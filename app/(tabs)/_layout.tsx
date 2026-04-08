import { Tabs, useRouter } from 'expo-router';
import { View, StyleSheet, Pressable, type PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import Colors, { primary } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useColorScheme } from '@/components/useColorScheme';
import { hapticLight } from '@/lib/haptics';

const FAB_SIZE = 56;
const FAB_ICON_SIZE = 28;
const FAB_LIFT_Y = -24;

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

function AddTabButton(props: PressableProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const openAdd = () => {
    hapticLight();
    router.push('/add');
  };
  const { style, ...rest } = props;
  return (
    <Pressable
      {...rest}
      onPress={openAdd}
      style={(state) => [typeof style === 'function' ? style(state) : style, styles.fabTabWrap]}
    >
      <View
        style={[
          styles.fabOuter,
          {
            borderColor: colorScheme === 'dark' ? 'rgba(30,41,59,0.9)' : '#ffffff',
            backgroundColor:
              colorScheme === 'dark' ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.85)',
          },
        ]}
      >
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
        tabBarLabelStyle: Typography.label,
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
          tabBarLabel: '',
          tabBarButton: (props) => <AddTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? 'notebook' : 'notebook-outline'}
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
  tabItem: {
    paddingTop: 4,
  },
  fabTabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 0,
    zIndex: 20,
    elevation: 16,
  },
  fabOuter: {
    transform: [{ translateY: FAB_LIFT_Y }],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 8,
    borderRadius: 999,
    padding: 8,
    borderTopLeftRadius: 9999,
    borderTopRightRadius: 9999,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE,
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
