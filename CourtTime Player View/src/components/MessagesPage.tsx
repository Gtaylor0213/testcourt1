import React, { useState, useEffect } from 'react';
import { UnifiedSidebar } from './UnifiedSidebar';
import { NotificationBell } from './NotificationBell';
import { Messages } from './Messages';
import { useAuth } from '../contexts/AuthContext';
import { playerProfileApi } from '../api/client';

interface MessagesPageProps {
  onBack: () => void;
  onLogout: () => void;
  onNavigateToProfile: () => void;
  onNavigateToPlayerDashboard: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToClub?: (clubId: string) => void;
  onNavigateToBulletinBoard?: () => void;
  onNavigateToHittingPartner?: () => void;
  selectedFacilityId?: string;
  onFacilityChange?: (facilityId: string) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  selectedRecipientId?: string;
}

export function MessagesPage({
  onBack,
  onLogout,
  onNavigateToProfile,
  onNavigateToPlayerDashboard,
  onNavigateToCalendar,
  onNavigateToClub = () => {},
  onNavigateToBulletinBoard = () => {},
  onNavigateToHittingPartner = () => {},
  selectedFacilityId,
  onFacilityChange,
  sidebarCollapsed,
  onToggleSidebar,
  selectedRecipientId
}: MessagesPageProps) {
  const { user } = useAuth();
  const [memberFacilities, setMemberFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacilityFilter, setSelectedFacilityFilter] = useState<string>(selectedFacilityId || 'all');

  useEffect(() => {
    if (user?.id) {
      loadFacilities();
    }
  }, [user?.id]);

  const loadFacilities = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const profileResponse = await playerProfileApi.getProfile(user.id);

      if (profileResponse.success && profileResponse.data?.profile) {
        const facilities = profileResponse.data.profile.memberFacilities || [];
        const active = facilities.filter((f: any) => f.status === 'active');
        setMemberFacilities(active);
      }
    } catch (error) {
      console.error('Error loading facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const facilityId = selectedFacilityFilter !== 'all'
    ? selectedFacilityFilter
    : memberFacilities[0]?.facilityId || '';

  const facilityName = memberFacilities.find(
    f => f.facilityId === facilityId
  )?.facilityName;

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedSidebar
        userType="player"
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToPlayerDashboard={onNavigateToPlayerDashboard}
        onNavigateToCalendar={onNavigateToCalendar}
        onNavigateToClub={onNavigateToClub}
        onNavigateToBulletinBoard={onNavigateToBulletinBoard}
        onNavigateToHittingPartner={onNavigateToHittingPartner}
        onLogout={onLogout}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={onToggleSidebar}
        currentPage="messages"
      />

      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 ease-in-out`}>
        <div className="p-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-medium">Messages</h1>
              <p className="text-gray-600 mt-1">Chat with other players at your facility</p>
            </div>
            <NotificationBell />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : memberFacilities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">You need to be a member of a facility to send messages.</p>
            </div>
          ) : (
            <Messages
              facilityId={facilityId}
              facilityName={facilityName}
              selectedRecipientId={selectedRecipientId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
