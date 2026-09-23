import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const showSplash = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setReady(true);
      await SplashScreen.hideAsync();
    };

    showSplash();
  }, []);

  if (!ready) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}