"use client";

import { useAuth } from "@/lib/AuthContext";
import SplashScreen from "./SplashScreen";
import UpdateNotification from "./UpdateNotification";

export default function AppInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <>
      <UpdateNotification />
      {children}
    </>
  );
}
