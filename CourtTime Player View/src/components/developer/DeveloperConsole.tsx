import React, { useState, useEffect } from 'react';
import { DeveloperLogin } from './DeveloperLogin';
import { DeveloperLayout } from './DeveloperLayout';
import { DeveloperDashboard } from './DeveloperDashboard';
import { DeveloperTableView } from './DeveloperTableView';
import { DeveloperSQLConsole } from './DeveloperSQLConsole';
import { isDeveloperAuthenticated, clearDeveloperPassword } from '../../api/developerClient';

type DeveloperView = 'dashboard' | 'table' | 'sql';

export function DeveloperConsole() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<DeveloperView>('dashboard');
  const [selectedTable, setSelectedTable] = useState<string>('');

  // Enable dark mode for developer console
  useEffect(() => {
    // Add dark class to html element for dark mode
    document.documentElement.classList.add('dark');
    // Also set body background to black
    document.body.style.backgroundColor = '#000';
    document.body.style.color = '#fff';

    // Cleanup on unmount
    return () => {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  // Check authentication on mount
  useEffect(() => {
    setIsAuthenticated(isDeveloperAuthenticated());
  }, []);

  // Handle successful login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Handle logout
  const handleLogout = () => {
    clearDeveloperPassword();
    setIsAuthenticated(false);
    setCurrentView('dashboard');
    setSelectedTable('');
  };

  // Handle navigation
  const handleNavigate = (view: DeveloperView) => {
    setCurrentView(view);
    if (view !== 'table') {
      setSelectedTable('');
    }
  };

  // Handle table selection
  const handleSelectTable = (tableName: string) => {
    setSelectedTable(tableName);
    setCurrentView('table');
  };

  // Handle back from table view
  const handleBackFromTable = () => {
    setSelectedTable('');
    setCurrentView('dashboard');
  };

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <DeveloperLogin onLoginSuccess={handleLoginSuccess} />;
  }

  // Render developer interface
  return (
    <DeveloperLayout
      currentView={currentView}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      tableName={selectedTable}
    >
      {currentView === 'dashboard' && (
        <DeveloperDashboard onSelectTable={handleSelectTable} />
      )}

      {currentView === 'table' && selectedTable && (
        <DeveloperTableView
          tableName={selectedTable}
          onBack={handleBackFromTable}
        />
      )}

      {currentView === 'sql' && (
        <DeveloperSQLConsole />
      )}
    </DeveloperLayout>
  );
}
