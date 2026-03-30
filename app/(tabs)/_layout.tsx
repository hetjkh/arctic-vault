import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
// Expo SDK 54 Native Tabs Imports
import { NativeTabs, Icon } from 'expo-router/unstable-native-tabs';

import { CustomTabBar } from '../../components/CustomTabBar';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';
const useNativeTabs = Platform.OS === 'ios' && !isExpoGo;

// 1. Android & Expo Go Fallback Layout (Detached Pill)
function StandardTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="add" />
      <Tabs.Screen name="invoices" />
      <Tabs.Screen name="analytics" />
    </Tabs>
  );
}

// 2. iOS Native Liquid Glass Layout (Platform-native SF Symbols & Accessory)
function IOSNativeTabsLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown">

      {/* Primary Tab Items embedded natively */}
      <NativeTabs.Trigger name="index">
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="transactions">
        <Icon sf="arrow.left.arrow.right" />
      </NativeTabs.Trigger>

      {/* Center "+" tab */}
      <NativeTabs.Trigger name="add">
        <Icon sf="plus" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="invoices">
        <Icon sf="doc.text.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="analytics">
        <Icon sf="chart.pie.fill" />
      </NativeTabs.Trigger>

    </NativeTabs>
  );
}

export default function TabLayout() {
  if (useNativeTabs) {
    return <IOSNativeTabsLayout />;
  }
  return <StandardTabsLayout />;
}
