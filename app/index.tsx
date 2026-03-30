import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { getStoredUser } from '../lib/api';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../lib/theme';

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const user = await getStoredUser();
      setIsAuthenticated(!!user);
    })();
  }, []);

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.neonGreen} size="large" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
