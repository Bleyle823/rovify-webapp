'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/app/provider/ThemeProvider';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            {children}
        </ThemeProvider>
    );
}