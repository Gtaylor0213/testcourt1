import React, { useState } from 'react';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Building2, Clock, MapPin, Phone, Mail, Globe, Save, Edit, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface FacilityManagementProps {
  onBack: () => void;
  onLogout: () => void;
  onNavigateToProfile: () => void;
  onNavigateToPlayerDashboard: () => void;
  onNavigateToCalendar: () => void;
  onNavigateToClub?: (clubId: string) => void;
  onNavigateToHittingPartner?: () => void;
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

export function FacilityManagement({
  onLogout,
  onNavigateToProfile,
  onNavigateToPlayerDashboard,
  onNavigateToCalendar,
  onNavigateToClub = () => {},
  onNavigateToHittingPartner = () => {},
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
  const [isEditing, setIsEditing] = useState(false);
  const [facilityData, setFacilityData] = useState({
    name: 'Riverside Tennis Club',
    type: 'Tennis Club',
    address: '123 Tennis Lane',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
    phone: '(415) 555-0100',
    email: 'info@riversidetennis.com',
    website: 'www.riversidetennis.com',
    description: 'A premier tennis facility featuring 8 outdoor courts with professional-grade surfaces.',
    weekdayHoursStart: '06:00',
    weekdayHoursEnd: '22:00',
    weekendHoursStart: '07:00',
    weekendHoursEnd: '21:00',
  });

  const handleSave = () => {
    // TODO: Implement save to database
    console.log('Saving facility data:', facilityData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    // TODO: Reset to original data
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedSidebar
        userType="admin"
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToPlayerDashboard={onNavigateToPlayerDashboard}
        onNavigateToCalendar={onNavigateToCalendar}
        onNavigateToClub={onNavigateToClub}
        onNavigateToHittingPartner={onNavigateToHittingPartner}
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
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
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

            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location
                </CardTitle>
                <CardDescription>Facility address and location details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={facilityData.address}
                    onChange={(e) => setFacilityData({ ...facilityData, address: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={facilityData.city}
                      onChange={(e) => setFacilityData({ ...facilityData, city: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={facilityData.state}
                      onChange={(e) => setFacilityData({ ...facilityData, state: e.target.value })}
                      disabled={!isEditing}
                      maxLength={2}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={facilityData.zip}
                    onChange={(e) => setFacilityData({ ...facilityData, zip: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>Phone, email, and website</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={facilityData.website}
                    onChange={(e) => setFacilityData({ ...facilityData, website: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Operating Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Operating Hours
                </CardTitle>
                <CardDescription>Facility hours for weekdays and weekends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-base font-semibold mb-3 block">Weekday Hours (Mon-Fri)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weekdayStart">Opening Time</Label>
                      <Input
                        id="weekdayStart"
                        type="time"
                        value={facilityData.weekdayHoursStart}
                        onChange={(e) => setFacilityData({ ...facilityData, weekdayHoursStart: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weekdayEnd">Closing Time</Label>
                      <Input
                        id="weekdayEnd"
                        type="time"
                        value={facilityData.weekdayHoursEnd}
                        onChange={(e) => setFacilityData({ ...facilityData, weekdayHoursEnd: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Weekend Hours (Sat-Sun)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weekendStart">Opening Time</Label>
                      <Input
                        id="weekendStart"
                        type="time"
                        value={facilityData.weekendHoursStart}
                        onChange={(e) => setFacilityData({ ...facilityData, weekendHoursStart: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weekendEnd">Closing Time</Label>
                      <Input
                        id="weekendEnd"
                        type="time"
                        value={facilityData.weekendHoursEnd}
                        onChange={(e) => setFacilityData({ ...facilityData, weekendHoursEnd: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
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
