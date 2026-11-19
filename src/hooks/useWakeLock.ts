import { useEffect, useState } from 'react';

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener?: (type: string, listener: () => void) => void;
}

interface NavigatorWithWakeLock {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
}

export function useWakeLock(enabled: boolean): { supported: boolean; active: boolean } {
  const supported =
    typeof navigator !== 'undefined' &&
    'wakeLock' in navigator &&
    Boolean((navigator as unknown as NavigatorWithWakeLock).wakeLock);

  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!supported || !enabled) {
      setActive(false);
      return;
    }

    let cancelled = false;
    let sentinel: WakeLockSentinelLike | null = null;

    const acquire = async () => {
      try {
        const nav = navigator as unknown as NavigatorWithWakeLock;
        if (!nav.wakeLock || cancelled) return;
        const nextSentinel = await nav.wakeLock.request('screen');
        if (cancelled) {
          await nextSentinel.release().catch(() => {});
          return;
        }
        sentinel = nextSentinel;
        setActive(true);
        nextSentinel.addEventListener?.('release', () => {
          if (!cancelled) setActive(false);
        });
      } catch {
        if (!cancelled) setActive(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled && !cancelled) {
        void acquire();
      }
    };

    void acquire();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (sentinel && !sentinel.released) {
        void sentinel.release().catch(() => {});
      }
      setActive(false);
    };
  }, [enabled, supported]);

  return { supported, active };
}
