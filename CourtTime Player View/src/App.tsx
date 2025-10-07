import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Toaster } from './components/ui/sonner';
import { LoginPage } from './components/LoginPage';
import { CourtCalendarView } from './components/CourtCalendarView';
import { PlayerDashboard } from './components/PlayerDashboard';
import { QuickReservation } from './components/QuickReservation';
import { PlayerProfile } from './components/PlayerProfile';
import { UserRegistration } from './components/UserRegistration';
import { ClubInfo } from './components/ClubInfo';
import { Settings } from './components/Settings';

type Screen = 'login' | 'court-calendar' | 'player-dashboard' | 'quick-reservation' | 'profile' | 'user-registration' | 'club-info' | 'settings';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('sunrise-valley');
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  
  const { user, loading, logout: authLogout } = useAuth();

  // Update screen based on authentication state
  useEffect(() => {
    if (user && currentScreen === 'login') {
      setCurrentScreen('court-calendar');
    } else if (!user && currentScreen !== 'login' && currentScreen !== 'user-registration') {
      setCurrentScreen('login');
      setSidebarCollapsed(false);
    }
  }, [user, currentScreen]);

  // Show loading spinner while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogin = () => {
    // Authentication is handled by the AuthContext
    // The useEffect will handle navigation when user state changes
  };

  const handleLogout = async () => {
    await authLogout();
    setSidebarCollapsed(false);
    setCurrentScreen('login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  const navigateToQuickReservation = () => {
    setCurrentScreen('quick-reservation');
  };

  const navigateToPlayerDashboard = () => {
    setCurrentScreen('player-dashboard');
  };

  const navigateToCourtCalendar = () => {
    setCurrentScreen('court-calendar');
  };

  const navigateToProfile = () => {
    setCurrentScreen('profile');
  };

  const navigateToClub = (clubId: string) => {
    setSelectedClubId(clubId);
    setCurrentScreen('club-info');
  };

  const navigateToSettings = () => {
    setCurrentScreen('settings');
  };

  const navigateBack = () => {
    // Always navigate back to calendar view since it's now the main hub
    setCurrentScreen('court-calendar');
  };

  const handleFacilityChange = (facilityId: string) => {
    setSelectedFacilityId(facilityId);
  };

  // Registration Navigation handlers
  const navigateToUserRegistration = () => {
    setCurrentScreen('user-registration');
  };

  const navigateBackToLogin = () => {
    setCurrentScreen('login');
  };

  const handleUserRegistrationComplete = () => {
    setCurrentScreen('login');
  };

  return (
    <div className="min-h-screen bg-background">
      {currentScreen === 'login' && (
        <LoginPage 
          onLogin={handleLogin} 
          onNavigateToUserRegistration={navigateToUserRegistration}
        />
      )}
      
      {currentScreen === 'user-registration' && (
        <UserRegistration
          onBack={navigateBackToLogin}
          onRegistrationComplete={handleUserRegistrationComplete}
        />
      )}
      
      {currentScreen === 'court-calendar' && (
        <CourtCalendarView 
          onNavigateToPlayerDashboard={navigateToPlayerDashboard}
          onNavigateToProfile={navigateToProfile}
          onNavigateToClub={navigateToClub}
          onNavigateToSettings={navigateToSettings}
          onLogout={handleLogout}
          selectedFacilityId={selectedFacilityId}
          onFacilityChange={handleFacilityChange}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />
      )}
      
      {currentScreen === 'player-dashboard' && (
        <PlayerDashboard 
          onLogout={handleLogout}
          onQuickBook={navigateToQuickReservation}
          onNavigateToProfile={navigateToProfile}
          onNavigateToCalendar={navigateToCourtCalendar}
          onNavigateToClub={navigateToClub}
          onNavigateToSettings={navigateToSettings}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />
      )}
      
      {currentScreen === 'profile' && (
        <PlayerProfile 
          onBack={navigateToCourtCalendar}
          onLogout={handleLogout}
          onNavigateToProfile={navigateToProfile}
          onNavigateToPlayerDashboard={navigateToPlayerDashboard}
          onNavigateToClub={navigateToClub}
          onNavigateToSettings={navigateToSettings}
          selectedFacilityId={selectedFacilityId}
          onFacilityChange={handleFacilityChange}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />
      )}
      
      {currentScreen === 'quick-reservation' && (
        <QuickReservation 
          onBack={navigateBack}
          onLogout={handleLogout}
          onNavigateToProfile={navigateToProfile}
          onNavigateToPlayerDashboard={navigateToPlayerDashboard}
          onNavigateToClub={navigateToClub}
          onNavigateToSettings={navigateToSettings}
          selectedFacilityId={selectedFacilityId}
          onFacilityChange={handleFacilityChange}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />
      )}

      {currentScreen === 'club-info' && (
        <ClubInfo 
          onBack={navigateBack}
          onLogout={handleLogout}
          onNavigateToProfile={navigateToProfile}
          onNavigateToPlayerDashboard={navigateToPlayerDashboard}
          onNavigateToCalendar={navigateToCourtCalendar}
          onNavigateToClub={navigateToClub}
          onNavigateToSettings={navigateToSettings}
          selectedFacilityId={selectedFacilityId}
          onFacilityChange={handleFacilityChange}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          clubId={selectedClubId}
        />
      )}

      {currentScreen === 'settings' && (
        <Settings 
          onBack={navigateBack}
          onLogout={handleLogout}
          onNavigateToProfile={navigateToProfile}
          onNavigateToPlayerDashboard={navigateToPlayerDashboard}
          onNavigateToCalendar={navigateToCourtCalendar}
          onNavigateToClub={navigateToClub}
          selectedFacilityId={selectedFacilityId}
          onFacilityChange={handleFacilityChange}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />
      )}

      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}