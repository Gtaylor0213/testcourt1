import React, { useState } from 'react';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Calendar, Search, X, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';

interface BookingManagementProps {
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

interface Booking {
  id: string;
  courtName: string;
  memberName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  type: 'Singles' | 'Doubles' | 'Lesson';
}

export function BookingManagement({
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
}: BookingManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([
    { id: '1', courtName: 'Court 1', memberName: 'John Doe', date: '2025-11-15', startTime: '09:00', endTime: '10:00', status: 'Confirmed', type: 'Singles' },
    { id: '2', courtName: 'Court 2', memberName: 'Jane Smith', date: '2025-11-15', startTime: '10:00', endTime: '11:00', status: 'Confirmed', type: 'Doubles' },
    { id: '3', courtName: 'Court 1', memberName: 'Bob Johnson', date: '2025-11-16', startTime: '14:00', endTime: '15:00', status: 'Pending', type: 'Lesson' },
    { id: '4', courtName: 'Court 3', memberName: 'Alice Williams', date: '2025-11-16', startTime: '16:00', endTime: '17:30', status: 'Confirmed', type: 'Doubles' },
    { id: '5', courtName: 'Court 2', memberName: 'Mike Brown', date: '2025-11-17', startTime: '11:00', endTime: '12:00', status: 'Cancelled', type: 'Singles' },
  ]);

  const handleCancelBooking = (id: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Cancelled' as const } : b));
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.courtName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    const matchesDate = !filterDate || booking.date === filterDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
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
        currentPage="booking-management"
      />

      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 ease-in-out p-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
            <Button onClick={onNavigateToAdminBooking}>
              <Calendar className="h-4 w-4 mr-2" />
              Create New Booking
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Bookings</CardTitle>
              <CardDescription>Search and filter bookings by member, court, date, or status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Member name or court..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filterStatus">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Confirmed">Confirmed</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filterDate">Date</Label>
                  <Input
                    id="filterDate"
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bookings List */}
          <Card>
            <CardHeader>
              <CardTitle>All Bookings ({filteredBookings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No bookings found matching your filters.
                  </div>
                ) : (
                  filteredBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Court</div>
                          <div className="font-medium">{booking.courtName}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Member</div>
                          <div className="font-medium">{booking.memberName}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Date</div>
                          <div className="font-medium">{formatDate(booking.date)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Time</div>
                          <div className="font-medium">{booking.startTime} - {booking.endTime}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Status</div>
                          <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {booking.status !== 'Cancelled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
