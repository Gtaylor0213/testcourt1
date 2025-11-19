import React, { useState, useEffect } from 'react';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar, TrendingUp, Users, DollarSign, Download, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { useAuth } from '../../contexts/AuthContext';
import { adminApi } from '../../api/client';
import { toast } from 'sonner';

interface AnalyticsProps {
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

interface AnalyticsData {
  bookingsTrend: Array<{ date: string; bookings: number }>;
  peakHours: Array<{ hour: number; bookings: number }>;
  courtUsage: Array<{ court_name: string; court_number: number; bookings: number }>;
  memberGrowth: Array<{ date: string; new_members: number }>;
}

export function Analytics({
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
}: AnalyticsProps) {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('30');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    bookingsTrend: [],
    peakHours: [],
    courtUsage: [],
    memberGrowth: [],
  });
  const [loading, setLoading] = useState(true);

  const currentFacilityId = user?.memberFacilities?.[0];

  useEffect(() => {
    if (currentFacilityId) {
      loadAnalytics();
    }
  }, [currentFacilityId, timeRange]);

  const loadAnalytics = async () => {
    if (!currentFacilityId) {
      toast.error('No facility selected');
      return;
    }

    try {
      setLoading(true);
      const response = await adminApi.getAnalytics(currentFacilityId, parseInt(timeRange));

      if (response.success && response.data) {
        setAnalyticsData(response.data);
      } else {
        toast.error(response.error || 'Failed to load analytics');
      }
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    toast.info('Export report feature coming soon');
  };

  const getTotalBookings = () => {
    return analyticsData.bookingsTrend.reduce((sum, day) => sum + day.bookings, 0);
  };

  const getTotalNewMembers = () => {
    return analyticsData.memberGrowth.reduce((sum, day) => sum + day.new_members, 0);
  };

  const getCourtUtilization = () => {
    const totalBookings = getTotalBookings();
    const totalCourts = analyticsData.courtUsage.length;
    const daysInPeriod = parseInt(timeRange);
    const hoursPerDay = 14; // Assuming 14 operating hours per day
    const maxPossibleBookings = totalCourts * daysInPeriod * hoursPerDay;

    if (maxPossibleBookings === 0) return 0;
    return Math.round((totalBookings / maxPossibleBookings) * 100);
  };

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:00 ${ampm}`;
  };

  const formatTimeRange = (hour: number) => {
    const nextHour = hour + 2;
    return `${formatHour(hour)} - ${formatHour(nextHour)}`;
  };

  const getTopPeakHours = () => {
    return analyticsData.peakHours
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 4);
  };

  const getTopCourts = () => {
    const maxBookings = Math.max(...analyticsData.courtUsage.map(c => c.bookings), 1);
    return analyticsData.courtUsage
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 4)
      .map(court => ({
        court: court.court_name,
        bookings: court.bookings,
        percent: Math.round((court.bookings / maxBookings) * 100)
      }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const topPeakHours = getTopPeakHours();
  const topCourts = getTopCourts();
  const maxPeakBookings = Math.max(...topPeakHours.map(p => p.bookings), 1);

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
        currentPage="analytics"
      />

      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 ease-in-out p-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <Button onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* Time Range Filter */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Filter className="h-5 w-5 text-gray-500" />
                <Label htmlFor="timeRange" className="font-medium">Time Range:</Label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 3 Months</SelectItem>
                    <SelectItem value="365">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalBookings()}</div>
                <p className="text-xs text-gray-600">
                  In the last {timeRange} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Court Utilization</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getCourtUtilization()}%</div>
                <p className="text-xs text-gray-600">
                  Average utilization rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getTotalNewMembers()}</div>
                <p className="text-xs text-gray-600">
                  In the last {timeRange} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Courts</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.courtUsage.length}</div>
                <p className="text-xs text-gray-600">
                  Active courts
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Trends</CardTitle>
                <CardDescription>Daily bookings over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData.bookingsTrend.length > 0 ? (
                  <div className="space-y-2">
                    {analyticsData.bookingsTrend.slice(-14).map((day, index) => {
                      const maxBookings = Math.max(...analyticsData.bookingsTrend.map(d => d.bookings), 1);
                      const percent = Math.round((day.bookings / maxBookings) * 100);
                      const date = new Date(day.date);
                      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                      return (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{formattedDate}</span>
                            <span className="text-gray-600">{day.bookings} bookings</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                    <p className="text-gray-500">No booking data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Member Growth</CardTitle>
                <CardDescription>New member sign-ups over time</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData.memberGrowth.length > 0 ? (
                  <div className="space-y-2">
                    {analyticsData.memberGrowth.map((day, index) => {
                      const date = new Date(day.date);
                      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                      return (
                        <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                          <span className="text-sm font-medium">{formattedDate}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">+{day.new_members} members</span>
                            <Users className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                    <p className="text-gray-500">No member growth data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Peak Hours</CardTitle>
                <CardDescription>Most popular booking times</CardDescription>
              </CardHeader>
              <CardContent>
                {topPeakHours.length > 0 ? (
                  <div className="space-y-3">
                    {topPeakHours.map((slot, index) => {
                      const percent = Math.round((slot.bookings / maxPeakBookings) * 100);
                      return (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{formatTimeRange(slot.hour)}</span>
                            <span className="text-gray-600">{slot.bookings} bookings</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No peak hours data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Courts</CardTitle>
                <CardDescription>Most booked courts this period</CardDescription>
              </CardHeader>
              <CardContent>
                {topCourts.length > 0 ? (
                  <div className="space-y-3">
                    {topCourts.map((court, index) => (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{court.court}</span>
                          <span className="text-gray-600">{court.bookings} bookings</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${court.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No court usage data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
