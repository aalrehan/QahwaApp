import 'dotenv/config';

export default {
  expo: {
    name: 'قهوة',
    slug: 'qahwa',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'qahwa',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    platforms: ['ios', 'android'],
    ios: {
      bundleIdentifier: 'com.qahwa.app',
      supportsTablet: false,
    },
    android: {
      package: 'com.qahwa.app',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FAF7F2',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'single',
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          imageWidth: 280,
          resizeMode: 'contain',
          backgroundColor: '#FAF7F2',
        },
      ],
      'expo-secure-store',
      'expo-localization',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: 'PLACEHOLDER',
      },
    },
  },
};
