import { LinearGradient } from 'expo-linear-gradient';
import { router, Tabs } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/lib/theme';

function CustomLogButton() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
      <Pressable
        onPress={() => router.push('/(app)/log/new')}
        hitSlop={8}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          marginTop: -16,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <LinearGradient
          colors={[theme.colors.orange, theme.colors.brown]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text
            style={{
              color: theme.colors.bg,
              fontSize: 28,
              lineHeight: 30,
              fontFamily: theme.fonts.arabicBody.bold,
            }}
          >
            +
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.brown,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderSoft,
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          fontFamily: theme.fonts.arabicBody.medium,
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: 'الرئيسية',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          tabBarLabel: 'اكتشف',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>🔍</Text>,
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          tabBarLabel: '',
          tabBarIcon: () => null,
          tabBarButton: () => <CustomLogButton />,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          tabBarLabel: 'مفكرتي',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>📓</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'ملفي',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
