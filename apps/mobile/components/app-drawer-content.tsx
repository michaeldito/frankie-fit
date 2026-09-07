import Ionicons from '@expo/vector-icons/Ionicons';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '@/constants/frankie-theme';
import { useAuth } from '@/lib/auth-context';

const menuItems: { icon: keyof typeof Ionicons.glyphMap; label: string; route: string }[] = [
  { icon: 'chatbubble-ellipses', label: 'Chat', route: 'chat' },
  { icon: 'pulse', label: 'Dashboard', route: 'dashboard' },
  { icon: 'barbell', label: 'Workouts', route: 'workouts' },
  { icon: 'person', label: 'Profile', route: 'profile' },
];

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const { signOut } = useAuth();
  const activeRoute = props.state.routeNames[props.state.index];

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      <Text style={styles.wordmark}>Frankie Fit</Text>

      <View style={styles.menu}>
        {menuItems.map((item) => {
          const isActive = item.route === activeRoute;

          return (
            <Pressable
              key={item.route}
              onPress={() => props.navigation.navigate(item.route)}
              style={[styles.menuItem, isActive && styles.menuItemActive]}>
              <Ionicons
                color={isActive ? colors.background : colors.text}
                name={item.icon}
                size={20}
              />
              <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Pressable onPress={() => void signOut()} style={styles.signOut}>
          <Ionicons color={colors.danger} name="log-out-outline" size={20} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSoft,
    paddingHorizontal: 12,
    paddingTop: 24,
  },
  wordmark: {
    color: colors.accentStrong,
    fontSize: typography.sectionTitle.fontSize,
    fontWeight: typography.sectionTitle.fontWeight,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  menu: {
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  menuItemActive: {
    backgroundColor: colors.accentStrong,
  },
  menuItemText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  menuItemTextActive: {
    color: colors.background,
  },
  footer: {
    marginTop: 'auto',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 16,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  signOutText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '700',
  },
});
