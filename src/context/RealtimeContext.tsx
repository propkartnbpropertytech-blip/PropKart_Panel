import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

interface RealtimeContextType {
  isConnected: boolean;
  newSubmissionAlert: any | null;
  dismissAlert: () => void;
  refreshCount: number;
  triggerRefresh: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [newSubmissionAlert, setNewSubmissionAlert] = useState<any | null>(null);
  const [refreshCount, setRefreshCount] = useState<number>(0);

  const triggerRefresh = () => {
    setRefreshCount((prev) => prev + 1);
  };

  const dismissAlert = () => {
    setNewSubmissionAlert(null);
  };

  useEffect(() => {
    let supabaseClient: any = null;
    let channel: RealtimeChannel | null = null;

    if (SUPABASE_URL) {
      try {
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        channel = supabaseClient
          .channel('form_submissions_live')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'form_submissions' },
            (payload: any) => {
              setNewSubmissionAlert(payload.new);
              triggerRefresh();
            }
          )
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'form_submissions' },
            () => {
              triggerRefresh();
            }
          )
          .subscribe((status: string) => {
            setIsConnected(status === 'SUBSCRIBED');
          });
      } catch (err) {
        // Handled by polling fallback below
      }
    }

    // Polling fallback every 15s in case WebSockets are blocked by proxies
    const interval = setInterval(() => {
      triggerRefresh();
    }, 15000);

    return () => {
      clearInterval(interval);
      if (channel && supabaseClient) {
        supabaseClient.removeChannel(channel);
      }
    };
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        newSubmissionAlert,
        dismissAlert,
        refreshCount,
        triggerRefresh,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export function useRealtime() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used within RealtimeProvider');
  return ctx;
}
