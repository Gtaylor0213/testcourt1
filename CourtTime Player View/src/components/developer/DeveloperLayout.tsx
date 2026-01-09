import React from 'react';
import { Button } from '../ui/button';
import { Terminal, Database, Code, LogOut, Home } from 'lucide-react';
import { clearDeveloperPassword } from '../../api/developerClient';

type DeveloperView = 'dashboard' | 'table' | 'sql';

interface DeveloperLayoutProps {
  children: React.ReactNode;
  currentView: DeveloperView;
  onNavigate: (view: DeveloperView) => void;
  onLogout: () => void;
  tableName?: string;
}

export function DeveloperLayout({
  children,
  currentView,
  onNavigate,
  onLogout,
  tableName
}: DeveloperLayoutProps) {
  const handleLogout = () => {
    clearDeveloperPassword();
    onLogout();
  };

  // Force dark mode CSS variables
  const darkStyles: React.CSSProperties = {
    ['--background' as string]: '#09090b',
    ['--foreground' as string]: '#fafafa',
    ['--card' as string]: '#09090b',
    ['--card-foreground' as string]: '#fafafa',
    ['--popover' as string]: '#09090b',
    ['--popover-foreground' as string]: '#fafafa',
    ['--primary' as string]: '#fafafa',
    ['--primary-foreground' as string]: '#18181b',
    ['--secondary' as string]: '#27272a',
    ['--secondary-foreground' as string]: '#fafafa',
    ['--muted' as string]: '#27272a',
    ['--muted-foreground' as string]: '#a1a1aa',
    ['--accent' as string]: '#27272a',
    ['--accent-foreground' as string]: '#fafafa',
    ['--border' as string]: '#27272a',
    ['--input' as string]: '#27272a',
    ['--input-background' as string]: '#18181b',
  };

  return (
    <div className="dark min-h-screen bg-black text-white" style={darkStyles}>
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                <Terminal className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-lg text-white">Developer Console</span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <Button
                variant={currentView === 'dashboard' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onNavigate('dashboard')}
                className={currentView === 'dashboard'
                  ? 'bg-zinc-700 text-white'
                  : 'text-white hover:text-white hover:bg-zinc-700'}
              >
                <Database className="h-4 w-4 mr-2" />
                Tables
              </Button>
              <Button
                variant={currentView === 'sql' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onNavigate('sql')}
                className={currentView === 'sql'
                  ? 'bg-zinc-700 text-white'
                  : 'text-white hover:text-white hover:bg-zinc-700'}
              >
                <Code className="h-4 w-4 mr-2" />
                SQL Console
              </Button>
            </nav>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white hover:text-white hover:bg-zinc-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb (if viewing a table) */}
      {currentView === 'table' && tableName && (
        <div className="bg-zinc-900/50 border-b border-zinc-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <nav className="flex items-center text-sm">
              <button
                onClick={() => onNavigate('dashboard')}
                className="text-zinc-300 hover:text-white flex items-center"
              >
                <Home className="h-4 w-4 mr-1" />
                Tables
              </button>
              <span className="mx-2 text-zinc-500">/</span>
              <span className="text-green-400 font-mono">{tableName}</span>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-zinc-400">
          CourtTime Developer Console - All actions are logged
        </div>
      </footer>
    </div>
  );
}
