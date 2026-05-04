import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type ConnectionStatus =
  | { state: 'connecting' }
  | { state: 'connected'; count: number }
  | { state: 'failed'; message: string };

export default function HomeScreen() {
  const [status, setStatus] = useState<ConnectionStatus>({ state: 'connecting' });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { count, error } = await supabase
          .from('badges')
          .select('*', { count: 'exact', head: true });

        if (cancelled) return;

        if (error) {
          setStatus({ state: 'failed', message: error.message });
          return;
        }

        setStatus({ state: 'connected', count: count ?? 0 });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setStatus({ state: 'failed', message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View
      className="flex-1 items-center justify-center px-8"
      style={{ backgroundColor: theme.colors.bg }}
    >
      <Text
        style={{
          color: theme.colors.brown,
          fontSize: 96,
          fontFamily: theme.fonts.arabicDecorative.bold,
          textAlign: 'center',
        }}
      >
        قهوة
      </Text>

      <Text
        style={{
          color: theme.colors.brown,
          fontSize: 18,
          fontFamily: theme.fonts.englishDisplay.italic,
          letterSpacing: 4,
          marginTop: 12,
        }}
      >
        QAHWA
      </Text>

      <View className="mt-16">
        <StatusIndicator status={status} />
      </View>
    </View>
  );
}

function StatusIndicator({ status }: { status: ConnectionStatus }) {
  if (status.state === 'connecting') {
    return (
      <Text style={{
        color: theme.colors.dim,
        fontSize: 13,
        fontFamily: theme.fonts.arabicBody.regular,
      }}>
        Connecting…
      </Text>
    );
  }

  if (status.state === 'connected') {
    return (
      <Text style={{
        color: theme.colors.success,
        fontSize: 13,
        fontFamily: theme.fonts.arabicBody.regular,
      }}>
        ● Supabase connected ({status.count} badges)
      </Text>
    );
  }

  return (
    <Text
      style={{
        color: theme.colors.error,
        fontSize: 13,
        textAlign: 'center',
        fontFamily: theme.fonts.arabicBody.regular,
      }}
    >
      ● Connection failed: {status.message}
    </Text>
  );
}
