import { RelayEnvironmentProvider } from 'react-relay';
import { RelayEnvironment } from './RelayEnvironment';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <RelayEnvironmentProvider environment={RelayEnvironment}>
    <StrictMode>
      <App />
      <Toaster
        duration={10000000}
        closeButton
        theme="dark"
        className="group" // Useful for targeting nested elements
        toastOptions={{
          classNames: {
            toast:
              'group-[.toaster]:bg-[var(--toast-bg)] group-[.toaster]:text-[var(--toast-text)] group-[.toaster]:border-[var(--toast-border)] group-[.toaster]:shadow-lg group-[.toaster]:rounded-[var(--toast-radius)] group-[.toaster]:border group-[.toaster]:p-4 group-[.toaster]:flex group-[.toaster]:gap-3 group-[.toaster]:w-full',
            title: 'text-sm font-semibold',
            description: 'text-[var(--toast-muted)] text-xs',
            actionButton:
              'bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium',
            cancelButton:
              'bg-muted text-muted-foreground px-3 py-1.5 rounded-md text-xs font-medium',
            success: 'text-green-600 dark:text-green-400',
            error: 'text-red-600 dark:text-red-400',
          },
        }}
      />
    </StrictMode>
  </RelayEnvironmentProvider>
);
