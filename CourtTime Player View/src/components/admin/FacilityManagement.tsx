import React, { useState, useEffect } from 'react';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Building2, Clock, MapPin, Phone, Mail, Save, Edit, X, Plus, Trash2, Image } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
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
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

interface FacilityData {
  name: string;
  type: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  description: string;
  amenities: string[];
  operatingHours: any;
  logoUrl: string;
}

interface Court {
  id: string;
  name: string;
  courtNumber: number;
  courtType: string;
  surfaceType: string;
  isIndoor: boolean;
  hasLights: boolean;
  status: 'active' | 'maintenance' | 'inactive';
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
  sidebarCollapsed = false,
  onToggleSidebar
}: FacilityManagementProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState<FacilityData | null>(null);
  const [facilityData, setFacilityData] = useState<FacilityData>({
    name: '',
    type: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    description: '',
    amenities: [],
    operatingHours: {},
    logoUrl: '',
  });

  // Court management state
  const [courts, setCourts] = useState<Court[]>([]);
  const [courtsLoading, setCourtsLoading] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [isAddingNewCourt, setIsAddingNewCourt] = useState(false);
  const [courtSaving, setCourtSaving] = useState(false);

  const currentFacilityId = user?.memberFacilities?.[0];

  useEffect(() => {
    if (currentFacilityId) {
      loadFacilityData();
      loadCourts();
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
        // Parse address - try to extract components if stored as single string
        let streetAddress = facility.streetAddress || '';
        let city = facility.city || '';
        let state = facility.state || '';
        let zipCode = facility.zipCode || '';

        // If address is stored as a single field, try to parse it
        if (!streetAddress && facility.address) {
          const addressParts = facility.address.split(',').map((p: string) => p.trim());
          if (addressParts.length >= 1) streetAddress = addressParts[0];
          if (addressParts.length >= 2) city = addressParts[1];
          if (addressParts.length >= 3) {
            // Try to parse "State ZIP" format
            const stateZip = addressParts[2].split(' ').filter((p: string) => p);
            if (stateZip.length >= 1) state = stateZip[0];
            if (stateZip.length >= 2) zipCode = stateZip[1];
          }
        }

        const data: FacilityData = {
          name: facility.name || '',
          type: facility.type || 'Tennis Facility',
          streetAddress,
          city,
          state,
          zipCode,
          phone: facility.phone || '',
          email: facility.email || '',
          description: facility.description || '',
          amenities: facility.amenities || [],
          operatingHours: facility.operatingHours || {},
          logoUrl: facility.logoUrl || '',
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

  // Court management functions
  const loadCourts = async () => {
    if (!currentFacilityId) return;

    try {
      setCourtsLoading(true);
      const response = await facilitiesApi.getCourts(currentFacilityId);

      if (response.success && response.data?.courts) {
        setCourts(response.data.courts);
      } else {
        toast.error(response.error || 'Failed to load courts');
      }
    } catch (error: any) {
      console.error('Error loading courts:', error);
      toast.error('Failed to load courts');
    } finally {
      setCourtsLoading(false);
    }
  };

  const handleAddNewCourt = () => {
    setEditingCourt({
      id: '',
      name: '',
      courtNumber: courts.length + 1,
      courtType: 'Tennis',
      surfaceType: 'Hard Court',
      isIndoor: false,
      hasLights: false,
      status: 'active',
    });
    setIsAddingNewCourt(true);
  };

  const handleEditCourt = (court: Court) => {
    setEditingCourt({ ...court });
    setIsAddingNewCourt(false);
  };

  const handleSaveCourt = async () => {
    if (!editingCourt || !currentFacilityId) return;

    try {
      setCourtSaving(true);
      const response = await adminApi.updateCourt(editingCourt.id, {
        name: editingCourt.name,
        courtNumber: editingCourt.courtNumber,
        surfaceType: editingCourt.surfaceType,
        courtType: editingCourt.courtType,
        isIndoor: editingCourt.isIndoor,
        hasLights: editingCourt.hasLights,
        status: editingCourt.status,
      });

      if (response.success) {
        toast.success('Court updated successfully');
        setEditingCourt(null);
        setIsAddingNewCourt(false);
        await loadCourts();
      } else {
        toast.error(response.error || 'Failed to update court');
      }
    } catch (error: any) {
      console.error('Error saving court:', error);
      toast.error('Failed to update court');
    } finally {
      setCourtSaving(false);
    }
  };

  const handleCancelCourtEdit = () => {
    setEditingCourt(null);
    setIsAddingNewCourt(false);
  };

  const handleDeleteCourt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this court?')) return;

    try {
      const response = await adminApi.updateCourt(id, { status: 'inactive' });
      if (response.success) {
        toast.success('Court deactivated successfully');
        await loadCourts();
      } else {
        toast.error(response.error || 'Failed to deactivate court');
      }
    } catch (error: any) {
      console.error('Error deactivating court:', error);
      toast.error('Failed to deactivate court');
    }
  };

  const getCourtStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCourtStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
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
                onLogout={onLogout}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={onToggleSidebar}
        currentPage="facility-management"
      />

      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 ease-in-out p-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-medium text-gray-900">Facility Management</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="details">Facility Details</TabsTrigger>
              <TabsTrigger value="courts">Court Management</TabsTrigger>
            </TabsList>

            {/* Facility Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <div className="flex justify-end">
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

                {/* Facility Logo/Image */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Image className="h-5 w-5" />
                      Facility Logo
                    </CardTitle>
                    <CardDescription>Upload your facility's logo or image</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center gap-4">
                      {facilityData.logoUrl ? (
                        <div className="relative">
                          <img
                            src={facilityData.logoUrl}
                            alt="Facility Logo"
                            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                          />
                          {isEditing && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                              onClick={() => setFacilityData({ ...facilityData, logoUrl: '' })}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <Building2 className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      {isEditing && (
                        <div className="w-full space-y-2">
                          <Label htmlFor="logoUrl">Logo URL</Label>
                          <div className="flex gap-2">
                            <Input
                              id="logoUrl"
                              value={facilityData.logoUrl}
                              onChange={(e) => setFacilityData({ ...facilityData, logoUrl: e.target.value })}
                              placeholder="https://example.com/logo.png"
                              className="flex-1"
                            />
                          </div>
                          <p className="text-xs text-gray-500">Enter a URL to your facility's logo image</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Location Information */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Location
                    </CardTitle>
                    <CardDescription>Facility address</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="streetAddress">Street Address</Label>
                      <Input
                        id="streetAddress"
                        value={facilityData.streetAddress}
                        onChange={(e) => setFacilityData({ ...facilityData, streetAddress: e.target.value })}
                        disabled={!isEditing}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={facilityData.city}
                          onChange={(e) => setFacilityData({ ...facilityData, city: e.target.value })}
                          disabled={!isEditing}
                          placeholder="City"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={facilityData.state}
                          onChange={(e) => setFacilityData({ ...facilityData, state: e.target.value })}
                          disabled={!isEditing}
                          placeholder="State"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          value={facilityData.zipCode}
                          onChange={(e) => setFacilityData({ ...facilityData, zipCode: e.target.value })}
                          disabled={!isEditing}
                          placeholder="12345"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
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
            </TabsContent>

            {/* Court Management Tab */}
            <TabsContent value="courts" className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={handleAddNewCourt} disabled={editingCourt !== null || isAddingNewCourt}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Court
                </Button>
              </div>

              {/* Edit/Add Court Form */}
              {editingCourt && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle>{isAddingNewCourt ? 'Add New Court' : `Edit ${editingCourt.name}`}</CardTitle>
                    <CardDescription>Configure court details and settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="courtName">Court Name</Label>
                        <Input
                          id="courtName"
                          value={editingCourt.name}
                          onChange={(e) => setEditingCourt({ ...editingCourt, name: e.target.value })}
                          placeholder="e.g., Court 1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="courtNumber">Court Number</Label>
                        <Input
                          id="courtNumber"
                          type="number"
                          value={editingCourt.courtNumber}
                          onChange={(e) => setEditingCourt({ ...editingCourt, courtNumber: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="courtType">Court Type</Label>
                        <Select
                          value={editingCourt.courtType}
                          onValueChange={(value) => setEditingCourt({ ...editingCourt, courtType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tennis">Tennis</SelectItem>
                            <SelectItem value="Pickleball">Pickleball</SelectItem>
                            <SelectItem value="Dual Purpose">Dual Purpose</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="courtSurface">Surface Type</Label>
                        <Select
                          value={editingCourt.surfaceType}
                          onValueChange={(value) => setEditingCourt({ ...editingCourt, surfaceType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Hard Court">Hard Court</SelectItem>
                            <SelectItem value="Clay Court">Clay Court</SelectItem>
                            <SelectItem value="Grass Court">Grass Court</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="courtStatus">Status</Label>
                        <Select
                          value={editingCourt.status}
                          onValueChange={(value: 'active' | 'maintenance' | 'inactive') => setEditingCourt({ ...editingCourt, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="indoor"
                          checked={editingCourt.isIndoor}
                          onCheckedChange={(checked) => setEditingCourt({ ...editingCourt, isIndoor: checked })}
                        />
                        <Label htmlFor="indoor">Indoor Court</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="lights"
                          checked={editingCourt.hasLights}
                          onCheckedChange={(checked) => setEditingCourt({ ...editingCourt, hasLights: checked })}
                        />
                        <Label htmlFor="lights">Has Lights</Label>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      <Button onClick={handleSaveCourt} disabled={courtSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {courtSaving ? 'Saving...' : 'Save Court'}
                      </Button>
                      <Button variant="outline" onClick={handleCancelCourtEdit} disabled={courtSaving}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Courts List */}
              {courtsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {courts.map((court) => (
                    <Card key={court.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{court.name}</h3>
                              <Badge className={getCourtStatusColor(court.status)}>{formatCourtStatus(court.status)}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <span>Court #: <strong>{court.courtNumber}</strong></span>
                              <span>Type: <strong>{court.courtType}</strong></span>
                              <span>Surface: <strong>{court.surfaceType}</strong></span>
                              <span>{court.isIndoor ? 'Indoor' : 'Outdoor'}</span>
                              <span>{court.hasLights ? 'With Lights' : 'No Lights'}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCourt(court)}
                              disabled={editingCourt !== null}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCourt(court.id)}
                              disabled={editingCourt !== null}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!courtsLoading && courts.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-gray-500">No courts configured. Click "Add New Court" to get started.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
