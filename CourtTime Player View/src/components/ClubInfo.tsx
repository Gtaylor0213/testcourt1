import React, { useState, useEffect } from 'react';
import { UnifiedSidebar } from './UnifiedSidebar';
import { ArrowLeft, MapPin, Phone, Mail, Globe, Clock, Users, Star, Calendar, Clipboard, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { facilitiesApi, playerProfileApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface ClubInfoProps {
  onBack: () => void;
  onLogout: () => void;
  onNavigateToProfile: () => void;
  onNavigateToPlayerDashboard: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToClub?: (clubId: string) => void;
  onNavigateToHittingPartner?: () => void;
  onNavigateToMessages?: () => void;
  onNavigateToBulletinBoard?: (clubId: string, clubName: string) => void;
  selectedFacilityId?: string;
  onFacilityChange?: (facilityId: string) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  clubId: string;
}

interface FacilityData {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  operatingHours: any;
  memberCount?: number;
  courts: {
    id: string;
    name: string;
    courtType: string;
    surfaceType: string;
    isIndoor: boolean;
  }[];
}

export function ClubInfo({
  onBack,
  onLogout,
  onNavigateToProfile,
  onNavigateToPlayerDashboard,
  onNavigateToCalendar,
  onNavigateToClub = () => {},
  onNavigateToHittingPartner = () => {},
  onNavigateToMessages = () => {},
  onNavigateToBulletinBoard = () => {},
  selectedFacilityId,
  onFacilityChange,
  sidebarCollapsed,
  onToggleSidebar,
  clubId
}: ClubInfoProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [facility, setFacility] = useState<FacilityData | null>(null);
  const [memberFacilities, setMemberFacilities] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (clubId) {
      loadFacilityData();
    }
  }, [clubId]);

  const loadFacilityData = async () => {
    try {
      setLoading(true);

      // Load user's member facilities to check if they're a member
      if (user?.id) {
        const profileResponse = await playerProfileApi.getProfile(user.id);
        if (profileResponse.success && profileResponse.data?.profile) {
          const facilities = profileResponse.data.profile.memberFacilities || [];
          setMemberFacilities(facilities);

          // Check if user is a member of this facility
          const isActiveMember = facilities.some(
            (f: any) => f.facilityId === clubId && f.status === 'active'
          );
          setIsMember(isActiveMember);
        }
      }

      const facilityResponse = await facilitiesApi.getById(clubId);
      if (facilityResponse.success && facilityResponse.data?.facility) {
        setFacility(facilityResponse.data.facility);

        // Load courts for this facility
        const courtsResponse = await facilitiesApi.getCourts(clubId);
        if (courtsResponse.success && courtsResponse.data?.courts) {
          setFacility(prev => prev ? { ...prev, courts: courtsResponse.data.courts } : null);
        }
      }
    } catch (error) {
      console.error('Error loading facility data:', error);
      toast.error('Failed to load facility information');
    } finally {
      setLoading(false);
    }
  };

  const formatOperatingHours = (hours: any): string => {
    if (!hours || typeof hours !== 'object') return 'Hours not available';

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const formattedDays = days
      .filter(day => hours[day])
      .map(day => `${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours[day]}`)
      .join(', ');

    return formattedDays || 'Hours not available';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Loading facility information...</div>
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <UnifiedSidebar
          userType="player"
          onNavigateToProfile={onNavigateToProfile}
          onNavigateToPlayerDashboard={onNavigateToPlayerDashboard}
          onNavigateToCalendar={onNavigateToCalendar}
          onNavigateToClub={onNavigateToClub}
          onNavigateToHittingPartner={onNavigateToHittingPartner}
          onNavigateToMessages={onNavigateToMessages}
          onLogout={onLogout}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={onToggleSidebar}
          currentPage="club-info"
        />

        <div className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 ease-in-out`}>
          <div className="p-8 flex items-center justify-center min-h-screen">
            <Card className="max-w-md">
              <CardContent className="p-6 text-center">
                <h2 className="mb-2">Club not found</h2>
                <p className="text-gray-600 mb-4">The requested club information could not be found.</p>
                <Button onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <UnifiedSidebar
        userType="player"
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToPlayerDashboard={onNavigateToPlayerDashboard}
        onNavigateToCalendar={onNavigateToCalendar}
        onNavigateToClub={onNavigateToClub}
        onNavigateToHittingPartner={onNavigateToHittingPartner}
        onNavigateToMessages={onNavigateToMessages}
        onLogout={onLogout}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={onToggleSidebar}
        currentPage="club-info"
      />
      
      <div className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 ease-in-out`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" onClick={onBack} className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1>Club Information</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-w-6xl mx-auto">
          {/* Non-Member Notice */}
          {!isMember && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-1">Not a Member</h3>
                    <p className="text-sm text-blue-800 mb-3">
                      You're viewing information for a facility you're not currently a member of. Request membership to access courts and book sessions.
                    </p>
                    <Button
                      onClick={onNavigateToProfile}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Request Membership
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Club Header */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3">
                  <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white">
                    <div className="text-center">
                      <Users className="h-16 w-16 mx-auto mb-2" />
                      <p className="font-medium">{facility.name}</p>
                    </div>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="mb-2">{facility.name}</h1>
                      <div className="flex items-center gap-2 mb-3">
                        {facility.memberCount && (
                          <Badge variant="secondary">
                            <Users className="h-3 w-3 mr-1" />
                            {facility.memberCount} members
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {facility.courts?.length || 0} courts
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{facility.description || 'Professional tennis facility'}</p>

                  {/* Quick Actions */}
                  <div className="flex gap-3 flex-wrap">
                    <Button onClick={onNavigateToCalendar}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Court
                    </Button>
                    <Button variant="outline" onClick={() => onNavigateToBulletinBoard(facility.id, facility.name)}>
                      <Clipboard className="h-4 w-4 mr-2" />
                      Bulletin Board
                    </Button>
                    {facility.phone && (
                      <Button variant="outline" onClick={() => window.open(`tel:${facility.phone}`)}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call Club
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-3" />
                  <div>
                    <p>{facility.address}</p>
                    <p className="text-sm text-gray-600">{facility.city}, {facility.state} {facility.zipCode}</p>
                  </div>
                </div>
                {facility.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p>{facility.phone}</p>
                    </div>
                  </div>
                )}
                {facility.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p>{facility.email}</p>
                    </div>
                  </div>
                )}
                {facility.website && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p>{facility.website}</p>
                    </div>
                  </div>
                )}
                {facility.operatingHours && (
                  <div className="flex items-start">
                    <Clock className="h-4 w-4 text-gray-400 mr-3 mt-1" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Operating Hours</p>
                      {typeof facility.operatingHours === 'object' ? (
                        <div className="space-y-1">
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                            facility.operatingHours[day] && (
                              <div key={day} className="text-sm">
                                <span className="font-medium capitalize">{day}:</span> {facility.operatingHours[day]}
                              </div>
                            )
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm">{facility.operatingHours}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Courts & Facilities */}
            <Card>
              <CardHeader>
                <CardTitle>Courts & Facilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-3">Available Courts</h4>
                    {facility.courts && facility.courts.length > 0 ? (
                      <div className="space-y-2">
                        {facility.courts.map((court) => (
                          <div key={court.id} className="flex justify-between items-center p-2 border border-gray-200 rounded">
                            <div>
                              <p className="font-medium">{court.name}</p>
                              <p className="text-sm text-gray-600">
                                {court.surfaceType} • {court.isIndoor ? 'Indoor' : 'Outdoor'}
                              </p>
                            </div>
                            <Badge variant="outline">{court.courtType}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No courts information available</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}