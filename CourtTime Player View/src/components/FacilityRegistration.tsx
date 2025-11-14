import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import {
  ArrowLeft, ArrowRight, Building, MapPin, Clock, FileText,
  Plus, Trash2, Check, AlertCircle, Upload, Mail, User, Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logoImage from 'figma:asset/8775e46e6be583b8cd937eefe50d395e0a3fcf52.png';
import { toast } from 'sonner';

interface FacilityRegistrationProps {
  onBack: () => void;
  onRegistrationComplete: () => void;
}

interface Court {
  id: string;
  name: string;
  courtNumber: number;
  surfaceType: 'Hard' | 'Clay' | 'Grass' | 'Synthetic';
  courtType: 'Tennis' | 'Pickleball' | 'Dual';
  isIndoor: boolean;
  hasLights: boolean;
  canSplit: boolean;
  splitConfig?: {
    splitNames: string[];
    splitType: 'Tennis' | 'Pickleball';
  };
}

interface AdminInvite {
  id: string;
  email: string;
  status: 'pending' | 'sent';
}

export function FacilityRegistration({ onBack, onRegistrationComplete }: FacilityRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, user } = useAuth();

  const [formData, setFormData] = useState({
    // Step 1: Super Admin Account (if not logged in)
    adminEmail: user?.email || '',
    adminPassword: '',
    adminConfirmPassword: '',
    adminFullName: user?.fullName || '',

    // Step 2: Facility Information
    facilityName: '',
    facilityType: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    contactName: '',
    description: '',

    // Operating Hours
    operatingHours: {
      monday: { open: '08:00', close: '20:00', closed: false },
      tuesday: { open: '08:00', close: '20:00', closed: false },
      wednesday: { open: '08:00', close: '20:00', closed: false },
      thursday: { open: '08:00', close: '20:00', closed: false },
      friday: { open: '08:00', close: '20:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: false },
    },

    // Step 3: Facility-Wide Rules
    generalRules: '',
    bookingRules: '',
    cancellationPolicy: '',
    maxBookingsPerWeek: '3',
    maxBookingDurationHours: '2',
    advanceBookingDays: '14',
    cancellationNoticehours: '24',

    // Step 4: Courts (will be filled dynamically)
    courts: [] as Court[],

    // Step 5: Additional Admins
    adminInvites: [] as AdminInvite[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [courtFormMode, setCourtFormMode] = useState<'individual' | 'bulk'>('individual');
  const [bulkCourtData, setBulkCourtData] = useState({
    count: '1',
    startingNumber: '1',
    surfaceType: 'Hard' as const,
    courtType: 'Tennis' as const,
    isIndoor: false,
    hasLights: false,
  });

  const totalSteps = user ? 5 : 6; // 6 steps if creating admin account, 5 if already logged in

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleOperatingHoursChange = (day: string, field: 'open' | 'close' | 'closed', value: any) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day as keyof typeof prev.operatingHours],
          [field]: value
        }
      }
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (!user && step === 1) {
      // Validate Super Admin Account
      if (!formData.adminFullName.trim()) newErrors.adminFullName = 'Full name is required';
      if (!formData.adminEmail.trim()) newErrors.adminEmail = 'Email is required';
      if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) newErrors.adminEmail = 'Email is invalid';
      if (!formData.adminPassword) newErrors.adminPassword = 'Password is required';
      if (formData.adminPassword.length < 8) newErrors.adminPassword = 'Password must be at least 8 characters';
      if (formData.adminPassword !== formData.adminConfirmPassword) {
        newErrors.adminConfirmPassword = 'Passwords do not match';
      }
    }

    const facilityStep = user ? 1 : 2;
    if (step === facilityStep) {
      // Validate Facility Information
      if (!formData.facilityName.trim()) newErrors.facilityName = 'Facility name is required';
      if (!formData.facilityType) newErrors.facilityType = 'Facility type is required';
      if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Street address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
      if (!formData.contactName.trim()) newErrors.contactName = 'Contact name is required';
    }

    const rulesStep = user ? 2 : 3;
    if (step === rulesStep) {
      // Validate Facility Rules
      if (!formData.generalRules.trim()) newErrors.generalRules = 'General rules are required';
      if (!formData.maxBookingsPerWeek) newErrors.maxBookingsPerWeek = 'Required';
      if (!formData.maxBookingDurationHours) newErrors.maxBookingDurationHours = 'Required';
    }

    const courtsStep = user ? 3 : 4;
    if (step === courtsStep) {
      // Validate Courts
      if (formData.courts.length === 0) {
        newErrors.courts = 'At least one court is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const addCourt = () => {
    const newCourt: Court = {
      id: `court-${Date.now()}`,
      name: `Court ${formData.courts.length + 1}`,
      courtNumber: formData.courts.length + 1,
      surfaceType: 'Hard',
      courtType: 'Tennis',
      isIndoor: false,
      hasLights: false,
      canSplit: false,
    };
    setFormData(prev => ({
      ...prev,
      courts: [...prev.courts, newCourt]
    }));
  };

  const addBulkCourts = () => {
    const count = parseInt(bulkCourtData.count);
    const startNum = parseInt(bulkCourtData.startingNumber);

    if (isNaN(count) || count < 1 || count > 50) {
      toast.error('Please enter a valid count (1-50)');
      return;
    }

    const newCourts: Court[] = [];
    for (let i = 0; i < count; i++) {
      const courtNumber = startNum + i;
      newCourts.push({
        id: `court-${Date.now()}-${i}`,
        name: `Court ${courtNumber}`,
        courtNumber,
        surfaceType: bulkCourtData.surfaceType,
        courtType: bulkCourtData.courtType,
        isIndoor: bulkCourtData.isIndoor,
        hasLights: bulkCourtData.hasLights,
        canSplit: false,
      });
    }

    setFormData(prev => ({
      ...prev,
      courts: [...prev.courts, ...newCourts]
    }));

    toast.success(`Added ${count} courts successfully`);
    setCourtFormMode('individual');
  };

  const updateCourt = (courtId: string, updates: Partial<Court>) => {
    setFormData(prev => ({
      ...prev,
      courts: prev.courts.map(court =>
        court.id === courtId ? { ...court, ...updates } : court
      )
    }));
  };

  const removeCourt = (courtId: string) => {
    setFormData(prev => ({
      ...prev,
      courts: prev.courts.filter(court => court.id !== courtId)
    }));
  };

  const addAdminInvite = () => {
    const newInvite: AdminInvite = {
      id: `invite-${Date.now()}`,
      email: '',
      status: 'pending'
    };
    setFormData(prev => ({
      ...prev,
      adminInvites: [...prev.adminInvites, newInvite]
    }));
  };

  const updateAdminInvite = (inviteId: string, email: string) => {
    setFormData(prev => ({
      ...prev,
      adminInvites: prev.adminInvites.map(invite =>
        invite.id === inviteId ? { ...invite, email } : invite
      )
    }));
  };

  const removeAdminInvite = (inviteId: string) => {
    setFormData(prev => ({
      ...prev,
      adminInvites: prev.adminInvites.filter(invite => invite.id !== inviteId)
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    try {
      // TODO: Implement actual API calls
      // 1. Create super admin account (if needed)
      // 2. Create facility with all data
      // 3. Create courts
      // 4. Send admin invitations

      console.log('Submitting facility registration:', formData);

      toast.success('Facility registered successfully!');
      setTimeout(() => {
        onRegistrationComplete();
      }, 1500);

    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={stepNumber} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted
                      ? 'bg-green-600 border-green-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
                </div>
                <div className={`text-xs mt-2 text-center ${isCurrent ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                  {!user && stepNumber === 1 && 'Admin Account'}
                  {user && stepNumber === 1 && 'Facility Info'}
                  {!user && stepNumber === 2 && 'Facility Info'}
                  {user && stepNumber === 2 && 'Rules'}
                  {!user && stepNumber === 3 && 'Rules'}
                  {user && stepNumber === 3 && 'Courts'}
                  {!user && stepNumber === 4 && 'Courts'}
                  {user && stepNumber === 4 && 'Admins'}
                  {!user && stepNumber === 5 && 'Admins'}
                  {user && stepNumber === 5 && 'Review'}
                  {!user && stepNumber === 6 && 'Review'}
                </div>
              </div>
              {stepNumber < totalSteps && (
                <div
                  className={`h-0.5 flex-1 mx-2 transition-colors ${
                    isCompleted ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep1AdminAccount = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Create Super Admin Account</h3>
        <p className="text-sm text-gray-600 mb-6">
          As the facility creator, you will be the super administrator with full access to manage your facility.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="adminFullName">Full Name *</Label>
          <Input
            id="adminFullName"
            value={formData.adminFullName}
            onChange={(e) => handleInputChange('adminFullName', e.target.value)}
            placeholder="John Smith"
          />
          {errors.adminFullName && (
            <p className="text-sm text-red-600 mt-1">{errors.adminFullName}</p>
          )}
        </div>

        <div>
          <Label htmlFor="adminEmail">Email Address *</Label>
          <Input
            id="adminEmail"
            type="email"
            value={formData.adminEmail}
            onChange={(e) => handleInputChange('adminEmail', e.target.value)}
            placeholder="admin@facility.com"
          />
          {errors.adminEmail && (
            <p className="text-sm text-red-600 mt-1">{errors.adminEmail}</p>
          )}
        </div>

        <div>
          <Label htmlFor="adminPassword">Password *</Label>
          <Input
            id="adminPassword"
            type="password"
            value={formData.adminPassword}
            onChange={(e) => handleInputChange('adminPassword', e.target.value)}
            placeholder="Minimum 8 characters"
          />
          {errors.adminPassword && (
            <p className="text-sm text-red-600 mt-1">{errors.adminPassword}</p>
          )}
        </div>

        <div>
          <Label htmlFor="adminConfirmPassword">Confirm Password *</Label>
          <Input
            id="adminConfirmPassword"
            type="password"
            value={formData.adminConfirmPassword}
            onChange={(e) => handleInputChange('adminConfirmPassword', e.target.value)}
            placeholder="Re-enter password"
          />
          {errors.adminConfirmPassword && (
            <p className="text-sm text-red-600 mt-1">{errors.adminConfirmPassword}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2FacilityInfo = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Facility Information</h3>
        <p className="text-sm text-gray-600 mb-6">
          Provide basic information about your tennis or pickleball facility.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="facilityName">Facility Name *</Label>
          <Input
            id="facilityName"
            value={formData.facilityName}
            onChange={(e) => handleInputChange('facilityName', e.target.value)}
            placeholder="Sunrise Valley Tennis Courts"
          />
          {errors.facilityName && (
            <p className="text-sm text-red-600 mt-1">{errors.facilityName}</p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="facilityType">Facility Type *</Label>
          <Select
            value={formData.facilityType}
            onValueChange={(value) => handleInputChange('facilityType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select facility type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HOA Tennis & Pickleball Courts">HOA Tennis & Pickleball Courts</SelectItem>
              <SelectItem value="Tennis Club">Tennis Club</SelectItem>
              <SelectItem value="Pickleball Club">Pickleball Club</SelectItem>
              <SelectItem value="Racquet Club">Racquet Club</SelectItem>
              <SelectItem value="Public Recreation Facility">Public Recreation Facility</SelectItem>
              <SelectItem value="Private Sports Club">Private Sports Club</SelectItem>
            </SelectContent>
          </Select>
          {errors.facilityType && (
            <p className="text-sm text-red-600 mt-1">{errors.facilityType}</p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="streetAddress">Street Address *</Label>
          <Input
            id="streetAddress"
            value={formData.streetAddress}
            onChange={(e) => handleInputChange('streetAddress', e.target.value)}
            placeholder="123 Main Street"
          />
          {errors.streetAddress && (
            <p className="text-sm text-red-600 mt-1">{errors.streetAddress}</p>
          )}
        </div>

        <div>
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            placeholder="Richmond"
          />
          {errors.city && (
            <p className="text-sm text-red-600 mt-1">{errors.city}</p>
          )}
        </div>

        <div>
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            placeholder="VA"
          />
          {errors.state && (
            <p className="text-sm text-red-600 mt-1">{errors.state}</p>
          )}
        </div>

        <div>
          <Label htmlFor="zipCode">ZIP Code *</Label>
          <Input
            id="zipCode"
            value={formData.zipCode}
            onChange={(e) => handleInputChange('zipCode', e.target.value)}
            placeholder="23220"
          />
          {errors.zipCode && (
            <p className="text-sm text-red-600 mt-1">{errors.zipCode}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="(804) 555-1234"
          />
          {errors.phone && (
            <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="email">Facility Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="info@facility.com"
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email}</p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="contactName">Primary Contact Name *</Label>
          <Input
            id="contactName"
            value={formData.contactName}
            onChange={(e) => handleInputChange('contactName', e.target.value)}
            placeholder="John Smith"
          />
          {errors.contactName && (
            <p className="text-sm text-red-600 mt-1">{errors.contactName}</p>
          )}
        </div>

        <div className="col-span-2">
          <Label htmlFor="description">Facility Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Brief description of your facility..."
            rows={3}
          />
        </div>
      </div>

      <Separator className="my-6" />

      <div>
        <h4 className="font-semibold mb-4">Operating Hours</h4>
        <div className="space-y-3">
          {Object.keys(formData.operatingHours).map((day) => {
            const hours = formData.operatingHours[day as keyof typeof formData.operatingHours];
            return (
              <div key={day} className="flex items-center gap-4">
                <div className="w-28 font-medium capitalize">{day}</div>
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={hours.open}
                    onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                    disabled={hours.closed}
                    className="w-32"
                  />
                  <span className="text-gray-500">to</span>
                  <Input
                    type="time"
                    value={hours.close}
                    onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                    disabled={hours.closed}
                    className="w-32"
                  />
                  <div className="flex items-center gap-2 ml-4">
                    <Switch
                      checked={hours.closed}
                      onCheckedChange={(checked) => handleOperatingHoursChange(day, 'closed', checked)}
                    />
                    <Label className="text-sm">Closed</Label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderStep3Rules = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Facility-Wide Rules & Policies</h3>
        <p className="text-sm text-gray-600 mb-6">
          Set rules and policies that apply to all courts at your facility.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="generalRules">General Usage Rules *</Label>
          <Textarea
            id="generalRules"
            value={formData.generalRules}
            onChange={(e) => handleInputChange('generalRules', e.target.value)}
            placeholder="E.g., No food on courts, Proper tennis attire required, Clean up after use..."
            rows={4}
          />
          <p className="text-xs text-gray-500 mt-1">
            These rules will be displayed to all members
          </p>
          {errors.generalRules && (
            <p className="text-sm text-red-600 mt-1">{errors.generalRules}</p>
          )}
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-3">Booking Restrictions</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxBookingsPerWeek">Max Bookings Per Week *</Label>
              <Input
                id="maxBookingsPerWeek"
                type="number"
                min="1"
                max="20"
                value={formData.maxBookingsPerWeek}
                onChange={(e) => handleInputChange('maxBookingsPerWeek', e.target.value)}
              />
              {errors.maxBookingsPerWeek && (
                <p className="text-sm text-red-600 mt-1">{errors.maxBookingsPerWeek}</p>
              )}
            </div>

            <div>
              <Label htmlFor="maxBookingDurationHours">Max Booking Duration (hours) *</Label>
              <Input
                id="maxBookingDurationHours"
                type="number"
                min="0.5"
                max="8"
                step="0.5"
                value={formData.maxBookingDurationHours}
                onChange={(e) => handleInputChange('maxBookingDurationHours', e.target.value)}
              />
              {errors.maxBookingDurationHours && (
                <p className="text-sm text-red-600 mt-1">{errors.maxBookingDurationHours}</p>
              )}
            </div>

            <div>
              <Label htmlFor="advanceBookingDays">Advance Booking Window (days)</Label>
              <Input
                id="advanceBookingDays"
                type="number"
                min="1"
                max="90"
                value={formData.advanceBookingDays}
                onChange={(e) => handleInputChange('advanceBookingDays', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                How far in advance members can book
              </p>
            </div>

            <div>
              <Label htmlFor="cancellationNoticehours">Cancellation Notice (hours)</Label>
              <Input
                id="cancellationNoticehours"
                type="number"
                min="1"
                max="168"
                value={formData.cancellationNoticehours}
                onChange={(e) => handleInputChange('cancellationNoticehours', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum notice required to cancel
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <Label htmlFor="bookingRules">Additional Booking Rules</Label>
          <Textarea
            id="bookingRules"
            value={formData.bookingRules}
            onChange={(e) => handleInputChange('bookingRules', e.target.value)}
            placeholder="E.g., Peak hours restrictions, Weekend policies..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
          <Textarea
            id="cancellationPolicy"
            value={formData.cancellationPolicy}
            onChange={(e) => handleInputChange('cancellationPolicy', e.target.value)}
            placeholder="E.g., Cancellations must be made 24 hours in advance..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderStep4Courts = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Court Setup</h3>
        <p className="text-sm text-gray-600 mb-6">
          Add courts to your facility. You can add them individually or in bulk if they have identical properties.
        </p>
      </div>

      {errors.courts && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.courts}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 mb-4">
        <Button
          type="button"
          variant={courtFormMode === 'individual' ? 'default' : 'outline'}
          onClick={() => setCourtFormMode('individual')}
          className="flex-1"
        >
          Add Individual Court
        </Button>
        <Button
          type="button"
          variant={courtFormMode === 'bulk' ? 'default' : 'outline'}
          onClick={() => setCourtFormMode('bulk')}
          className="flex-1"
        >
          Bulk Create Courts
        </Button>
      </div>

      {courtFormMode === 'individual' && (
        <Button
          type="button"
          onClick={addCourt}
          variant="outline"
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Court
        </Button>
      )}

      {courtFormMode === 'bulk' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bulk Create Identical Courts</CardTitle>
            <CardDescription>
              Create multiple courts with the same properties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Number of Courts</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={bulkCourtData.count}
                  onChange={(e) => setBulkCourtData(prev => ({ ...prev, count: e.target.value }))}
                />
              </div>
              <div>
                <Label>Starting Court Number</Label>
                <Input
                  type="number"
                  min="1"
                  value={bulkCourtData.startingNumber}
                  onChange={(e) => setBulkCourtData(prev => ({ ...prev, startingNumber: e.target.value }))}
                />
              </div>
              <div>
                <Label>Surface Type</Label>
                <Select
                  value={bulkCourtData.surfaceType}
                  onValueChange={(value: any) => setBulkCourtData(prev => ({ ...prev, surfaceType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hard">Hard</SelectItem>
                    <SelectItem value="Clay">Clay</SelectItem>
                    <SelectItem value="Grass">Grass</SelectItem>
                    <SelectItem value="Synthetic">Synthetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Court Type</Label>
                <Select
                  value={bulkCourtData.courtType}
                  onValueChange={(value: any) => setBulkCourtData(prev => ({ ...prev, courtType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tennis">Tennis</SelectItem>
                    <SelectItem value="Pickleball">Pickleball</SelectItem>
                    <SelectItem value="Dual">Dual Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={bulkCourtData.isIndoor}
                  onCheckedChange={(checked) => setBulkCourtData(prev => ({ ...prev, isIndoor: checked }))}
                />
                <Label>Indoor</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={bulkCourtData.hasLights}
                  onCheckedChange={(checked) => setBulkCourtData(prev => ({ ...prev, hasLights: checked }))}
                />
                <Label>Has Lights</Label>
              </div>
            </div>
            <Button type="button" onClick={addBulkCourts} className="w-full">
              Create {bulkCourtData.count} Court{parseInt(bulkCourtData.count) !== 1 ? 's' : ''}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4 mt-6">
        <h4 className="font-semibold">Courts ({formData.courts.length})</h4>
        {formData.courts.map((court) => (
          <Card key={court.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div className="font-semibold">{court.name}</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCourt(court.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Court Number</Label>
                  <Input
                    type="number"
                    value={court.courtNumber}
                    onChange={(e) => updateCourt(court.id, { courtNumber: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Surface Type</Label>
                  <Select
                    value={court.surfaceType}
                    onValueChange={(value: any) => updateCourt(court.id, { surfaceType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hard">Hard</SelectItem>
                      <SelectItem value="Clay">Clay</SelectItem>
                      <SelectItem value="Grass">Grass</SelectItem>
                      <SelectItem value="Synthetic">Synthetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Court Type</Label>
                  <Select
                    value={court.courtType}
                    onValueChange={(value: any) => updateCourt(court.id, { courtType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tennis">Tennis</SelectItem>
                      <SelectItem value="Pickleball">Pickleball</SelectItem>
                      <SelectItem value="Dual">Dual Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={court.isIndoor}
                      onCheckedChange={(checked) => updateCourt(court.id, { isIndoor: checked })}
                    />
                    <Label className="text-sm">Indoor</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={court.hasLights}
                      onCheckedChange={(checked) => updateCourt(court.id, { hasLights: checked })}
                    />
                    <Label className="text-sm">Lights</Label>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Switch
                    checked={court.canSplit}
                    onCheckedChange={(checked) => updateCourt(court.id, { canSplit: checked })}
                  />
                  <Label className="text-sm">Can be split into multiple courts</Label>
                </div>

                {court.canSplit && (
                  <div className="ml-6 mt-3 p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm mb-2 block">Split Configuration</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Split Names (comma-separated)</Label>
                        <Input
                          placeholder="3a, 3b"
                          value={court.splitConfig?.splitNames.join(', ') || ''}
                          onChange={(e) => {
                            const names = e.target.value.split(',').map(n => n.trim()).filter(Boolean);
                            updateCourt(court.id, {
                              splitConfig: { ...court.splitConfig, splitNames: names } as any
                            });
                          }}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Split Type</Label>
                        <Select
                          value={court.splitConfig?.splitType || 'Pickleball'}
                          onValueChange={(value: any) => {
                            updateCourt(court.id, {
                              splitConfig: { ...court.splitConfig, splitType: value } as any
                            });
                          }}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Tennis">Tennis</SelectItem>
                            <SelectItem value="Pickleball">Pickleball</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Split courts share booking conflicts with the parent court
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStep5Admins = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Additional Administrators (Optional)</h3>
        <p className="text-sm text-gray-600 mb-6">
          Invite other administrators to help manage your facility. You can also do this later from the admin dashboard.
        </p>
      </div>

      <Button
        type="button"
        onClick={addAdminInvite}
        variant="outline"
        className="w-full"
      >
        <Mail className="h-4 w-4 mr-2" />
        Add Admin Invitation
      </Button>

      {formData.adminInvites.length > 0 && (
        <div className="space-y-3 mt-6">
          <h4 className="font-semibold">Admin Invitations ({formData.adminInvites.length})</h4>
          {formData.adminInvites.map((invite) => (
            <div key={invite.id} className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="email"
                  value={invite.email}
                  onChange={(e) => updateAdminInvite(invite.id, e.target.value)}
                  placeholder="admin@email.com"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAdminInvite(invite.id)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {formData.adminInvites.length === 0 && (
        <Alert>
          <AlertDescription>
            You can skip this step and invite administrators later from your facility dashboard.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderStep6Review = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Review & Submit</h3>
        <p className="text-sm text-gray-600 mb-6">
          Please review your facility information before submitting.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Facility Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="font-medium">Name:</span> {formData.facilityName}</div>
          <div><span className="font-medium">Type:</span> {formData.facilityType}</div>
          <div><span className="font-medium">Address:</span> {formData.streetAddress}, {formData.city}, {formData.state} {formData.zipCode}</div>
          <div><span className="font-medium">Phone:</span> {formData.phone}</div>
          <div><span className="font-medium">Email:</span> {formData.email}</div>
          <div><span className="font-medium">Contact:</span> {formData.contactName}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Courts ({formData.courts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {formData.courts.map((court) => (
              <div key={court.id} className="flex justify-between">
                <span>{court.name}</span>
                <span className="text-gray-600">
                  {court.surfaceType} · {court.courtType} · {court.isIndoor ? 'Indoor' : 'Outdoor'}
                  {court.canSplit && ` · Splits into ${court.splitConfig?.splitNames.join(', ')}`}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Booking Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="font-medium">Max bookings per week:</span> {formData.maxBookingsPerWeek}</div>
          <div><span className="font-medium">Max booking duration:</span> {formData.maxBookingDurationHours} hours</div>
          <div><span className="font-medium">Advance booking window:</span> {formData.advanceBookingDays} days</div>
          <div><span className="font-medium">Cancellation notice:</span> {formData.cancellationNoticehours} hours</div>
        </CardContent>
      </Card>

      {formData.adminInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin Invitations ({formData.adminInvites.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {formData.adminInvites.map((invite) => (
                <div key={invite.id}>{invite.email}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          By submitting this registration, you confirm that all information provided is accurate and you agree to the terms of service.
        </AlertDescription>
      </Alert>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-6">
            <img src={logoImage} alt="CourtTime" className="h-8" />
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>
          <CardTitle className="text-2xl">Facility Registration</CardTitle>
          <CardDescription>
            Register your tennis or pickleball facility with CourtTime
          </CardDescription>
        </CardHeader>

        <CardContent>
          {renderProgressBar()}

          <div className="mt-8">
            {!user && currentStep === 1 && renderStep1AdminAccount()}
            {(user ? currentStep === 1 : currentStep === 2) && renderStep2FacilityInfo()}
            {(user ? currentStep === 2 : currentStep === 3) && renderStep3Rules()}
            {(user ? currentStep === 3 : currentStep === 4) && renderStep4Courts()}
            {(user ? currentStep === 4 : currentStep === 5) && renderStep5Admins()}
            {(user ? currentStep === 5 : currentStep === 6) && renderStep6Review()}
          </div>

          <div className="flex justify-between mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Complete Registration'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
