import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import type ViewShot from 'react-native-view-shot';
import { Alert, Platform } from 'react-native';

// One unified share for a coffee log: capture the card to PNG, hand it to
// the OS share sheet so the user can pick WhatsApp / X / Messages / etc.
// Caption is included via dialogTitle (Android share intent) and as the
// share-action message on iOS — most receiving apps prefill it as caption.
export async function shareLogCard(
  ref: RefObject<ViewShot | null>,
): Promise<void> {
  try {
    const captureFn = ref.current?.capture;
    if (!captureFn) return;

    const uri = await captureFn();
    if (!uri) return;

    const available = await Sharing.isAvailableAsync();
    if (!available) {
      Alert.alert('غير متاح', 'المشاركة غير مدعومة على هذا الجهاز');
      return;
    }

    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: 'قهوتي على Qahwa ☕',
      // On Android this becomes the chooser title; UTI helps iOS classify the file.
      UTI: 'public.png',
    });
  } catch (err) {
    if (Platform.OS !== 'web') {
      console.warn('share failed:', err);
    }
    Alert.alert('خطأ', 'تعذرت المشاركة، حاول مجدداً');
  }
}
