// app/providers/SWRProvider.tsx
'use client';

import { SWRConfig } from 'swr';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 60000,
      }}
    >
      {children}
    </SWRConfig>
  );
}