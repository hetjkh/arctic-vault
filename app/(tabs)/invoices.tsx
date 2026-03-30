import React from 'react';
import { Redirect } from 'expo-router';

export default function RedirectToAnalytics() {
  return <Redirect href="/(tabs)/analytics" />;
}
