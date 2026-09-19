import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// Supabase VPS configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:8000';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzg2Njk5NTkyLCJleHAiOjE5NDQzNzk1OTJ9.g4VezDunjdcYVOiPt_xgNUUzohQsIc5UsnqMJ26AdTA';

interface RealtimeContextType {
  isConnected: boolean;
  newSubmissionAlert: any | null;
  dismissAlert: () => void;
  refreshCount: number;
  triggerRefresh: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
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

    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      channel = supabaseClient
        .channel('form_submissions_live')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'form_submissions' },
          (payload: any) => {
            console.log('Realtime new submission event:', payload);
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
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
          } else {
            setIsConnected(false);
          }
        });
    } catch (err) {
      console.warn('Realtime subscription fallback:', err);
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
