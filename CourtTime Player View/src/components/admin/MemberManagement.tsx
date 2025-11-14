import React, { useState } from 'react';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Search, UserPlus, Mail, Phone, Edit, Ban, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface MemberManagementProps {
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

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipType: string;
  status: 'Active' | 'Pending' | 'Suspended';
  joinDate: string;
  skillLevel?: string;
}

export function MemberManagement({
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
}: MemberManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMembership, setFilterMembership] = useState<string>('all');
  const [members, setMembers] = useState<Member[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', phone: '(555) 123-4567', membershipType: 'Full', status: 'Active', joinDate: '2024-01-15', skillLevel: '4.0' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '(555) 234-5678', membershipType: 'Full', status: 'Active', joinDate: '2024-02-20', skillLevel: '4.5' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com', phone: '(555) 345-6789', membershipType: 'Social', status: 'Active', joinDate: '2024-03-10', skillLevel: '3.5' },
    { id: '4', name: 'Alice Williams', email: 'alice@example.com', phone: '(555) 456-7890', membershipType: 'Full', status: 'Pending', joinDate: '2025-11-12' },
    { id: '5', name: 'Mike Brown', email: 'mike@example.com', phone: '(555) 567-8901', membershipType: 'Junior', status: 'Suspended', joinDate: '2024-06-01', skillLevel: '3.0' },
  ]);

  const handleApprove = (id: string) => {
    setMembers(members.map(m => m.id === id ? { ...m, status: 'Active' as const } : m));
  };

  const handleSuspend = (id: string) => {
    if (confirm('Are you sure you want to suspend this member?')) {
      setMembers(members.map(m => m.id === id ? { ...m, status: 'Suspended' as const } : m));
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    const matchesMembership = filterMembership === 'all' || member.membershipType === filterMembership;
    return matchesSearch && matchesStatus && matchesMembership;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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
        currentPage="member-management"
      />

      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 ease-in-out p-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Member Management</h1>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add New Member
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Members</CardTitle>
              <CardDescription>Search and filter members by name, status, or membership type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Name or email..."
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
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filterMembership">Membership Type</Label>
                  <Select value={filterMembership} onValueChange={setFilterMembership}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Full">Full</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                      <SelectItem value="Junior">Junior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle>All Members ({filteredMembers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No members found matching your filters.
                  </div>
                ) : (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Phone</div>
                            <div className="text-sm flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Membership</div>
                            <div className="text-sm font-medium">{member.membershipType}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Skill Level</div>
                            <div className="text-sm font-medium">{member.skillLevel || 'N/A'}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Status</div>
                            <Badge className={getStatusColor(member.status)}>{member.status}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {member.status === 'Pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(member.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {member.status === 'Active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuspend(member.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Ban className="h-4 w-4" />
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
