import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { UnifiedSidebar } from './UnifiedSidebar';
import { ArrowLeft, Save, Bell, Palette, Clock, Globe } from 'lucide-react';

interface SettingsProps {
  onBack: () => void;
  onLogout: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToPlayerDashboard?: () => void;
  onNavigateToCalendar?: () => void;
  onNavigateToClub?: (clubId: string) => void;
  selectedFacilityId?: string;
  onFacilityChange?: (facilityId: string) => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function Settings({ 
  onBack, 
  onLogout,
  onNavigateToProfile = () => {},
  onNavigateToPlayerDashboard = () => {},
  onNavigateToCalendar = () => {},
  onNavigateToClub = () => {},
  selectedFacilityId,
  onFacilityChange,
  sidebarCollapsed = false,
  onToggleSidebar
}: SettingsProps) {
  const [settings, setSettings] = useState({
    // Notification preferences
    emailBookingConfirmations: true,
    smsReminders: true,
    pushNotifications: true,
    reminderTiming: '2', // hours before
    clubUpdates: true,
    maintenanceAlerts: true,
    promotionalEmails: false,
    weeklyDigest: true,
    
    // Display preferences
    theme: 'light',
    timeFormat: '12',
    language: 'en',
    defaultCalendarView: 'week',
    weekStartDay: 'monday',
    timezone: 'auto'
  });

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Here you would typically save to your backend/context
    console.log('Saving settings:', settings);
    // Show success toast
    // toast.success('Settings saved successfully');
  };

  const handleThemeChange = (theme: string) => {
    handleSettingChange('theme', theme);
    // Apply theme immediately
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Unified Sidebar */}
      <UnifiedSidebar
        userType="player"
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToPlayerDashboard={onNavigateToPlayerDashboard}
        onNavigateToCalendar={onNavigateToCalendar}
        onNavigateToClub={onNavigateToClub}
        onLogout={onLogout}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={onToggleSidebar}
        currentPage="settings"
      />

      {/* Main Content */}
      <div className={`${sidebarCollapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 ease-in-out`}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="mr-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-xl font-medium text-gray-900">Settings</h1>
              </div>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </header>

        {/* Settings Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how and when you want to receive notifications about your bookings and club updates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Booking Notifications */}
                <div>
                  <h4 className="font-medium mb-4">Booking Notifications</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="email-confirmations">Email confirmations</Label>
                        <p className="text-sm text-gray-600">Receive email confirmations for new bookings and changes</p>
                      </div>
                      <Switch
                        id="email-confirmations"
                        checked={settings.emailBookingConfirmations}
                        onCheckedChange={(checked) => handleSettingChange('emailBookingConfirmations', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="sms-reminders">SMS reminders</Label>
                        <p className="text-sm text-gray-600">Get text message reminders before your booking time</p>
                      </div>
                      <Switch
                        id="sms-reminders"
                        checked={settings.smsReminders}
                        onCheckedChange={(checked) => handleSettingChange('smsReminders', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="push-notifications">Push notifications</Label>
                        <p className="text-sm text-gray-600">Receive push notifications for booking updates</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="reminder-timing">Reminder timing</Label>
                        <p className="text-sm text-gray-600">How far in advance to send booking reminders</p>
                      </div>
                      <Select value={settings.reminderTiming} onValueChange={(value) => handleSettingChange('reminderTiming', value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.5">30 minutes</SelectItem>
                          <SelectItem value="1">1 hour</SelectItem>
                          <SelectItem value="2">2 hours</SelectItem>
                          <SelectItem value="24">24 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Club & System Notifications */}
                <div>
                  <h4 className="font-medium mb-4">Club & System Updates</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="club-updates">Club announcements</Label>
                        <p className="text-sm text-gray-600">News, events, and updates from your clubs</p>
                      </div>
                      <Switch
                        id="club-updates"
                        checked={settings.clubUpdates}
                        onCheckedChange={(checked) => handleSettingChange('clubUpdates', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="maintenance-alerts">Maintenance alerts</Label>
                        <p className="text-sm text-gray-600">Court closures and maintenance notifications</p>
                      </div>
                      <Switch
                        id="maintenance-alerts"
                        checked={settings.maintenanceAlerts}
                        onCheckedChange={(checked) => handleSettingChange('maintenanceAlerts', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="weekly-digest">Weekly digest</Label>
                        <p className="text-sm text-gray-600">Summary of your activity and upcoming bookings</p>
                      </div>
                      <Switch
                        id="weekly-digest"
                        checked={settings.weeklyDigest}
                        onCheckedChange={(checked) => handleSettingChange('weeklyDigest', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="promotional-emails">Promotional emails</Label>
                        <p className="text-sm text-gray-600">Special offers and marketing updates</p>
                      </div>
                      <Switch
                        id="promotional-emails"
                        checked={settings.promotionalEmails}
                        onCheckedChange={(checked) => handleSettingChange('promotionalEmails', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Display Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Display Preferences
                </CardTitle>
                <CardDescription>
                  Customize how the app looks and behaves for your preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Appearance */}
                <div>
                  <h4 className="font-medium mb-4">Appearance</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="theme">Theme</Label>
                        <p className="text-sm text-gray-600">Choose your preferred color scheme</p>
                      </div>
                      <Select value={settings.theme} onValueChange={handleThemeChange}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Time & Date */}
                <div>
                  <h4 className="font-medium mb-4">Time & Date</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="time-format">Time format</Label>
                        <p className="text-sm text-gray-600">How times are displayed throughout the app</p>
                      </div>
                      <Select value={settings.timeFormat} onValueChange={(value) => handleSettingChange('timeFormat', value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="12">12-hour</SelectItem>
                          <SelectItem value="24">24-hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="week-start">Week starts on</Label>
                        <p className="text-sm text-gray-600">First day of the week in calendar views</p>
                      </div>
                      <Select value={settings.weekStartDay} onValueChange={(value) => handleSettingChange('weekStartDay', value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sunday">Sunday</SelectItem>
                          <SelectItem value="monday">Monday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Calendar */}
                <div>
                  <h4 className="font-medium mb-4">Calendar</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="default-view">Default calendar view</Label>
                        <p className="text-sm text-gray-600">Your preferred view when opening the calendar</p>
                      </div>
                      <Select value={settings.defaultCalendarView} onValueChange={(value) => handleSettingChange('defaultCalendarView', value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Day</SelectItem>
                          <SelectItem value="week">Week</SelectItem>
                          <SelectItem value="month">Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Language & Region */}
                <div>
                  <h4 className="font-medium mb-4">Language & Region</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="language">Language</Label>
                        <p className="text-sm text-gray-600">App language preference</p>
                      </div>
                      <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <p className="text-sm text-gray-600">Automatically detect or set manually</p>
                      </div>
                      <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto-detect</SelectItem>
                          <SelectItem value="est">Eastern Time</SelectItem>
                          <SelectItem value="cst">Central Time</SelectItem>
                          <SelectItem value="mst">Mountain Time</SelectItem>
                          <SelectItem value="pst">Pacific Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}