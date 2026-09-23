import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarShowLabel: true,

        tabBarActiveTintColor: "#146c2e",
        tabBarInactiveTintColor: "#222222",

        tabBarIconStyle: {
          display: "none",
          height: 0,
          width: 0,
        },

        tabBarLabelStyle: {
          fontSize: 16,
          fontWeight: "bold",
          marginTop: Platform.OS === "android" ? -2 : 0,
          paddingBottom: Platform.OS === "android" ? 18 : 0,
        },

        tabBarStyle: {
          height: Platform.OS === "android" ? 78 : 72,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#cccccc",
          paddingTop: 0,
          paddingBottom: Platform.OS === "android" ? 10 : 12,
        },

        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 0,
          paddingBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Match Day",
          tabBarIcon: () => null,
        }}
      />

      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved Games",
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  );
}