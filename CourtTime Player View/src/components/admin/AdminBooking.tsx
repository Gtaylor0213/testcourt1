import React, { useState } from 'react';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Calendar, Save, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface AdminBookingProps {
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
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function AdminBooking({
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
  sidebarCollapsed = false,
  onToggleSidebar
}: AdminBookingProps) {
  const [bookingData, setBookingData] = useState({
    member: '',
    court: '',
    date: '',
    startTime: '',
    endTime: '',
    type: 'Singles',
    notes: '',
  });

  const handleSubmit = () => {
    // TODO: Implement booking creation
    console.log('Creating booking:', bookingData);
    alert('Booking created successfully!');
    // Reset form
    setBookingData({
      member: '',
      court: '',
      date: '',
      startTime: '',
      endTime: '',
      type: 'Singles',
      notes: '',
    });
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
      setBookingData({
        member: '',
        court: '',
        date: '',
        startTime: '',
        endTime: '',
        type: 'Singles',
        notes: '',
      });
    }
  };

  const isFormValid = () => {
    return bookingData.member && bookingData.court && bookingData.date &&
           bookingData.startTime && bookingData.endTime;
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
                onLogout={onLogout}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={onToggleSidebar}
        currentPage="admin-booking"
      />

      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 ease-in-out p-8`}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-gray-900">Create Booking</h1>
            <p className="text-gray-600 mt-2">Book a court on behalf of a member or walk-in guest</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Booking Details
              </CardTitle>
              <CardDescription>Fill in the details to create a new court booking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Member Selection */}
                <div className="space-y-2">
                  <Label htmlFor="member">Member / Guest Name *</Label>
                  <Select
                    value={bookingData.member}
                    onValueChange={(value) => setBookingData({ ...bookingData, member: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a member or enter walk-in guest" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john-doe">John Doe (Member)</SelectItem>
                      <SelectItem value="jane-smith">Jane Smith (Member)</SelectItem>
                      <SelectItem value="bob-johnson">Bob Johnson (Member)</SelectItem>
                      <SelectItem value="walk-in">Walk-in Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Court Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="court">Court *</Label>
                    <Select
                      value={bookingData.court}
                      onValueChange={(value) => setBookingData({ ...bookingData, court: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a court" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="court-1">Court 1 (Hard)</SelectItem>
                        <SelectItem value="court-2">Court 2 (Hard)</SelectItem>
                        <SelectItem value="court-3">Court 3 (Clay)</SelectItem>
                        <SelectItem value="court-4">Court 4 (Pickleball)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Booking Type</Label>
                    <Select
                      value={bookingData.type}
                      onValueChange={(value) => setBookingData({ ...bookingData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Singles">Singles</SelectItem>
                        <SelectItem value="Doubles">Doubles</SelectItem>
                        <SelectItem value="Lesson">Lesson</SelectItem>
                        <SelectItem value="Event">Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={bookingData.date}
                    onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={bookingData.startTime}
                      onChange={(e) => setBookingData({ ...bookingData, startTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={bookingData.endTime}
                      onChange={(e) => setBookingData({ ...bookingData, endTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any special notes or requirements..."
                    value={bookingData.notes}
                    onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={!isFormValid()}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Create Booking
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Make sure the court is available for the selected time slot</li>
                <li>• Walk-in guests can be added for temporary bookings</li>
                <li>• All bookings are created with "Confirmed" status by default</li>
                <li>• Members will receive email notifications about their bookings</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
