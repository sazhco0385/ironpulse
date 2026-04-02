import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { verifyMembership } from "@/lib/api";

const CACHE_KEY = "premiumStatus";
const CACHE_TTL = 10 * 60 * 1000;

let memCache: { isPremium: boolean; checkedAt: number } | null = null;

export function usePremium() {
  const [isPremium, setIsPremium] = useState<boolean>(memCache?.isPremium ?? false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (memCache && Date.now() - memCache.checkedAt < CACHE_TTL) {
        setIsPremium(memCache.isPremium);
        setIsLoading(false);
        return;
      }

      try {
        const stored = await AsyncStorage.getItem(CACHE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.isPremium !== undefined) {
            setIsPremium(parsed.isPremium);
            memCache = { isPremium: parsed.isPremium, checkedAt: parsed.checkedAt ?? 0 };
            if (Date.now() - (parsed.checkedAt ?? 0) < CACHE_TTL) {
              setIsLoading(false);
              return;
            }
          }
        }
      } catch {}

      const userId = await AsyncStorage.getItem("dbUserId");
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const result = await verifyMembership(parseInt(userId, 10));
        memCache = { isPremium: result.isPremium, checkedAt: Date.now() };
        setIsPremium(result.isPremium);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(memCache));
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    check();
  }, []);

  const refresh = async () => {
    memCache = null;
    setIsLoading(true);
    const userId = await AsyncStorage.getItem("dbUserId");
    if (!userId) {
      setIsLoading(false);
      return;
    }
    try {
      const result = await verifyMembership(parseInt(userId, 10));
      memCache = { isPremium: result.isPremium, checkedAt: Date.now() };
      setIsPremium(result.isPremium);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(memCache));
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  return { isPremium, isLoading, refresh };
}
