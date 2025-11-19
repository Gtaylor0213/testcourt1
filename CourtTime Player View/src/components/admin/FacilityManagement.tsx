import React, { useState, useEffect } from 'react';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Building2, Clock, MapPin, Phone, Mail, Save, Edit, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '../../contexts/AuthContext';
import { facilitiesApi, adminApi } from '../../api/client';
import { toast } from 'sonner';

interface FacilityManagementProps {
  onBack: () => void;
  onLogout: () => void;
  onNavigateToProfile: () => void;
  onNavigateToPlayerDashboard: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToClub?: (clubId: string) => void;
  onNavigateToHittingPartner?: () => void;
  onNavigateToBulletinBoard?: () => void;
  onNavigateToAdminDashboard?: () => void;
  onNavigateToFacilityManagement?: () => void;
  onNavigateToCourtManagement?: () => void;
  onNavigateToBookingManagement?: () => void;
  onNavigateToAdminBooking?: () => void;
  onNavigateToMemberManagement?: () => void;
  onNavigateToAnalytics?: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

interface FacilityData {
  name: string;
  type: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  amenities: string[];
  operatingHours: any;
}

export function FacilityManagement({
  onLogout,
  onNavigateToProfile,
  onNavigateToPlayerDashboard,
  onNavigateToCalendar,
  onNavigateToClub = () => {},
  onNavigateToHittingPartner = () => {},
  onNavigateToBulletinBoard = () => {},
  onNavigateToAdminDashboard = () => {},
  onNavigateToFacilityManagement = () => {},
  onNavigateToCourtManagement = () => {},
  onNavigateToBookingManagement = () => {},
  onNavigateToAdminBooking = () => {},
  onNavigateToMemberManagement = () => {},
  onNavigateToAnalytics = () => {},
  sidebarCollapsed = false,
  onToggleSidebar
}: FacilityManagementProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState<FacilityData | null>(null);
  const [facilityData, setFacilityData] = useState<FacilityData>({
    name: '',
    type: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    amenities: [],
    operatingHours: {},
  });

  const currentFacilityId = user?.memberFacilities?.[0];

  useEffect(() => {
    if (currentFacilityId) {
      loadFacilityData();
    }
  }, [currentFacilityId]);

  const loadFacilityData = async () => {
    if (!currentFacilityId) {
      toast.error('No facility selected');
      return;
    }

    try {
      setLoading(true);
      const response = await facilitiesApi.getById(currentFacilityId);

      if (response.success && response.data?.facility) {
        const facility = response.data.facility;
        const data: FacilityData = {
          name: facility.name || '',
          type: facility.type || 'Tennis Facility',
          address: facility.address || '',
          phone: facility.phone || '',
          email: facility.email || '',
          description: facility.description || '',
          amenities: facility.amenities || [],
          operatingHours: facility.operatingHours || {},
        };
        setFacilityData(data);
        setOriginalData(data);
      } else {
        toast.error(response.error || 'Failed to load facility data');
      }
    } catch (error: any) {
      console.error('Error loading facility:', error);
      toast.error('Failed to load facility data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentFacilityId) return;

    try {
      setSaving(true);
      const response = await adminApi.updateFacility(currentFacilityId, facilityData);

      if (response.success) {
        toast.success('Facility updated successfully');
        setIsEditing(false);
        setOriginalData(facilityData);
      } else {
        toast.error(response.error || 'Failed to update facility');
      }
    } catch (error: any) {
      console.error('Error saving facility:', error);
      toast.error('Failed to update facility');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalData) {
      setFacilityData(originalData);
    }
    setIsEditing(false);
  };

  const getHoursDisplay = (day: string) => {
    if (!facilityData.operatingHours || !facilityData.operatingHours[day]) {
      return 'Not set';
    }
    return facilityData.operatingHours[day];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedSidebar
        userType="admin"
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToPlayerDashboard={onNavigateToPlayerDashboard}
        onNavigateToCalendar={onNavigateToCalendar}
        onNavigateToClub={onNavigateToClub}
        onNavigateToHittingPartner={onNavigateToHittingPartner}
        onNavigateToBulletinBoard={onNavigateToBulletinBoard}
        onNavigateToAdminDashboard={onNavigateToAdminDashboard}
        onNavigateToFacilityManagement={onNavigateToFacilityManagement}
        onNavigateToCourtManagement={onNavigateToCourtManagement}
        onNavigateToBookingManagement={onNavigateToBookingManagement}
        onNavigateToAdminBooking={onNavigateToAdminBooking}
        onNavigateToMemberManagement={onNavigateToMemberManagement}
        onNavigateToAnalytics={onNavigateToAnalytics}
        onLogout={onLogout}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={onToggleSidebar}
        currentPage="facility-management"
      />

      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 ease-in-out p-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Facility Management</h1>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel} disabled={saving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>General facility details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Facility Name</Label>
                  <Input
                    id="name"
                    value={facilityData.name}
                    onChange={(e) => setFacilityData({ ...facilityData, name: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Facility Type</Label>
                  <Select
                    value={facilityData.type}
                    onValueChange={(value) => setFacilityData({ ...facilityData, type: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tennis Club">Tennis Club</SelectItem>
                      <SelectItem value="Tennis Facility">Tennis Facility</SelectItem>
                      <SelectItem value="Pickleball Club">Pickleball Club</SelectItem>
                      <SelectItem value="Multi-Sport Club">Multi-Sport Club</SelectItem>
                      <SelectItem value="HOA Community">HOA Community</SelectItem>
                      <SelectItem value="Recreation Center">Recreation Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={facilityData.description}
                    onChange={(e) => setFacilityData({ ...facilityData, description: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location & Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location & Contact
                </CardTitle>
                <CardDescription>Address and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={facilityData.address}
                    onChange={(e) => setFacilityData({ ...facilityData, address: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={facilityData.phone}
                    onChange={(e) => setFacilityData({ ...facilityData, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={facilityData.email}
                    onChange={(e) => setFacilityData({ ...facilityData, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Operating Hours */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Operating Hours
                </CardTitle>
                <CardDescription>Current facility hours (view only)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <div key={day} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium capitalize text-sm mb-1">{day}</div>
                      <div className="text-sm text-gray-600">{getHoursDisplay(day)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
                <CardDescription>Available facilities and features</CardDescription>
              </CardHeader>
              <CardContent>
                {facilityData.amenities && facilityData.amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {facilityData.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No amenities listed</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
