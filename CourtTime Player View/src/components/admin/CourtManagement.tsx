import React, { useState } from 'react';
import { UnifiedSidebar } from '../UnifiedSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';

interface CourtManagementProps {
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

interface Court {
  id: string;
  name: string;
  type: string;
  surface: string;
  isIndoor: boolean;
  hasLights: boolean;
  status: 'Active' | 'Maintenance' | 'Inactive';
}

export function CourtManagement({
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
}: CourtManagementProps) {
  const [courts, setCourts] = useState<Court[]>([
    { id: '1', name: 'Court 1', type: 'Tennis', surface: 'Hard', isIndoor: false, hasLights: true, status: 'Active' },
    { id: '2', name: 'Court 2', type: 'Tennis', surface: 'Hard', isIndoor: false, hasLights: true, status: 'Active' },
    { id: '3', name: 'Court 3', type: 'Tennis', surface: 'Clay', isIndoor: true, hasLights: true, status: 'Active' },
    { id: '4', name: 'Court 4', type: 'Pickleball', surface: 'Hard', isIndoor: false, hasLights: false, status: 'Maintenance' },
  ]);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleAddNew = () => {
    setEditingCourt({
      id: `new-${Date.now()}`,
      name: '',
      type: 'Tennis',
      surface: 'Hard',
      isIndoor: false,
      hasLights: false,
      status: 'Active',
    });
    setIsAddingNew(true);
  };

  const handleEdit = (court: Court) => {
    setEditingCourt({ ...court });
    setIsAddingNew(false);
  };

  const handleSave = () => {
    if (!editingCourt) return;

    if (isAddingNew) {
      setCourts([...courts, editingCourt]);
    } else {
      setCourts(courts.map(c => c.id === editingCourt.id ? editingCourt : c));
    }
    setEditingCourt(null);
    setIsAddingNew(false);
  };

  const handleCancel = () => {
    setEditingCourt(null);
    setIsAddingNew(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this court?')) {
      setCourts(courts.filter(c => c.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
        currentPage="court-management"
      />

      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 ease-in-out p-8`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Court Management</h1>
            <Button onClick={handleAddNew} disabled={editingCourt !== null}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Court
            </Button>
          </div>

          {/* Edit/Add Form */}
          {editingCourt && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle>{isAddingNew ? 'Add New Court' : `Edit ${editingCourt.name}`}</CardTitle>
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
                    <Label htmlFor="courtType">Court Type</Label>
                    <Select
                      value={editingCourt.type}
                      onValueChange={(value) => setEditingCourt({ ...editingCourt, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tennis">Tennis</SelectItem>
                        <SelectItem value="Pickleball">Pickleball</SelectItem>
                        <SelectItem value="Dual">Dual Purpose</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courtSurface">Surface Type</Label>
                    <Select
                      value={editingCourt.surface}
                      onValueChange={(value) => setEditingCourt({ ...editingCourt, surface: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hard">Hard Court</SelectItem>
                        <SelectItem value="Clay">Clay Court</SelectItem>
                        <SelectItem value="Grass">Grass Court</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courtStatus">Status</Label>
                    <Select
                      value={editingCourt.status}
                      onValueChange={(value: 'Active' | 'Maintenance' | 'Inactive') => setEditingCourt({ ...editingCourt, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
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
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Court
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Courts List */}
          <div className="grid grid-cols-1 gap-4">
            {courts.map((court) => (
              <Card key={court.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{court.name}</h3>
                        <Badge className={getStatusColor(court.status)}>{court.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span>Type: <strong>{court.type}</strong></span>
                        <span>Surface: <strong>{court.surface}</strong></span>
                        <span>{court.isIndoor ? 'Indoor' : 'Outdoor'}</span>
                        <span>{court.hasLights ? 'With Lights' : 'No Lights'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(court)}
                        disabled={editingCourt !== null}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(court.id)}
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

          {courts.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">No courts configured. Click "Add New Court" to get started.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
