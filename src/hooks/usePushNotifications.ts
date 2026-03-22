import { useState, useEffect, useCallback } from "react";

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const isSupported = "Notification" in window;
    setSupported(isSupported);
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!supported) return false;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === "granted";
    } catch {
      return false;
    }
  }, [supported]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!supported || permission !== "granted") return;
      try {
        new Notification(title, {
          icon: "/placeholder.svg",
          badge: "/placeholder.svg",
          ...options,
        });
      } catch {
        // Silently fail
      }
    },
    [supported, permission]
  );

  return { permission, supported, requestPermission, sendNotification };
};
