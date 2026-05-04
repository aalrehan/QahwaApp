import '../global.css';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { I18nManager } from 'react-native';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

I18nManager.allowRTL(true);
if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'IBMPlexSansArabic-Regular':  require('../assets/fonts/IBMPlexSansArabic-Regular.ttf'),
    'IBMPlexSansArabic-Medium':   require('../assets/fonts/IBMPlexSansArabic-Medium.ttf'),
    'IBMPlexSansArabic-SemiBold': require('../assets/fonts/IBMPlexSansArabic-SemiBold.ttf'),
    'IBMPlexSansArabic-Bold':     require('../assets/fonts/IBMPlexSansArabic-Bold.ttf'),
    'Tajawal-Regular':            require('../assets/fonts/Tajawal-Regular.ttf'),
    'Tajawal-Medium':             require('../assets/fonts/Tajawal-Medium.ttf'),
    'Tajawal-Bold':               require('../assets/fonts/Tajawal-Bold.ttf'),
    'Amiri-Regular':              require('../assets/fonts/Amiri-Regular.ttf'),
    'Amiri-Bold':                 require('../assets/fonts/Amiri-Bold.ttf'),
    'CormorantGaramond-Italic':   require('../assets/fonts/CormorantGaramond-Italic.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="dark" />
    </>
  );
}
