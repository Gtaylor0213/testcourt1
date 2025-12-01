import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Clock, MapPin, User, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { bookingApi } from '../api/client';

interface QuickReservePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onReserve: (reservation: {
    facility: string;
    court: string;
    date: string;
    time: string;
    duration: string;
    playerName: string;
  }) => void;
  facilities: Array<{
    id: string;
    name: string;
    type: string;
    courts: Array<{ name: string; type: string }>;
  }>;
  selectedFacilityId: string;
}

export function QuickReservePopup({
  isOpen,
  onClose,
  onReserve,
  facilities,
  selectedFacilityId
}: QuickReservePopupProps) {
  const { user } = useAuth();
  const [selectedFacility, setSelectedFacility] = useState(selectedFacilityId);
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState('1');
  const [playerName, setPlayerName] = useState('John Doe');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with current date and time
  useEffect(() => {
    const now = new Date();
    
    // Set current date
    const dateStr = now.toISOString().split('T')[0];
    setSelectedDate(dateStr);

    // Set current time rounded to next 15-minute interval
    const currentMinutes = now.getMinutes();
    const roundedMinutes = Math.ceil(currentMinutes / 15) * 15;

    const nextTime = new Date(now);
    if (roundedMinutes >= 60) {
      nextTime.setHours(now.getHours() + 1, 0, 0, 0);
    } else {
      nextTime.setMinutes(roundedMinutes, 0, 0);
    }

    let hours = nextTime.getHours();
    const minutes = nextTime.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;

    setSelectedTime(`${hours}:${minutes.toString().padStart(2, '0')} ${period}`);
  }, [isOpen]);

  // Reset court selection when facility changes
  useEffect(() => {
    setSelectedCourt('');
    setSelectedCourtId('');
  }, [selectedFacility]);

  const currentFacility = facilities.find(f => f.id === selectedFacility);
  const availableCourts = currentFacility?.courts || [];

  // Generate time slots (15-minute intervals)
  const timeSlots = React.useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 21; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const displayMinute = minute.toString().padStart(2, '0');
        slots.push(`${displayHour}:${displayMinute} ${period}`);
      }
    }
    return slots;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourt || !selectedCourtId) {
      alert('Please select a court');
      return;
    }

    if (!user?.id) {
      alert('You must be logged in to make a reservation');
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert 12h time to 24h format
      const [time, period] = selectedTime.split(' ');
      let [hours, minutes] = time.split(':').map(Number);

      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      const startTime24 = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

      // Calculate end time
      const durationMinutes = parseFloat(duration) * 60;
      const endMinutes = minutes + durationMinutes;
      const endHours = hours + Math.floor(endMinutes / 60);
      const actualEndMinutes = endMinutes % 60;
      const endTime24 = `${endHours.toString().padStart(2, '0')}:${actualEndMinutes.toString().padStart(2, '0')}:00`;

      // Create booking via API
      const result = await bookingApi.create({
        courtId: selectedCourtId,
        userId: user.id,
        facilityId: selectedFacility,
        bookingDate: selectedDate,
        startTime: startTime24,
        endTime: endTime24,
        durationMinutes: Math.round(durationMinutes),
        notes: ''
      });

      if (result.success) {
        // Call the parent callback to refresh bookings
        const reservation = {
          facility: currentFacility?.name || '',
          court: selectedCourt,
          date: selectedDate,
          time: selectedTime,
          duration,
          playerName
        };
        onReserve(reservation);
        onClose();
      } else {
        alert(result.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('An error occurred while creating your booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDisplayDate = (date: string) => {
    return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateEndTime = (startTime: string, durationHours: string) => {
    const [time, period] = startTime.split(' ');
    const timeParts = time.split(':');
    let hours = parseInt(timeParts[0]);
    let minutes = timeParts[1] ? parseInt(timeParts[1]) : 0;
    
    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    // Add duration
    const durationFloat = parseFloat(durationHours);
    hours += Math.floor(durationFloat);
    minutes += (durationFloat % 1) * 60;
    
    // Handle minutes overflow
    if (minutes >= 60) {
      hours += Math.floor(minutes / 60);
      minutes = minutes % 60;
    }
    
    // Convert back to 12-hour format
    const endPeriod = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours === 12 ? 12 : hours;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${endPeriod}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Quick Reserve
          </DialogTitle>
          <DialogDescription>
            Make a quick court reservation with current date and time pre-filled.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto min-h-0">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto">
              {/* Facility Selection */}
              <div className="space-y-2">
                <Label htmlFor="facility" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Facility
                </Label>
                <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map((facility) => (
                      <SelectItem key={facility.id} value={facility.id}>
                        {facility.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

          {/* Court Selection */}
          <div className="space-y-2">
            <Label htmlFor="court">Court</Label>
            <Select
              value={selectedCourtId}
              onValueChange={(value) => {
                const court = availableCourts.find(c => c.id === value);
                if (court) {
                  setSelectedCourtId(value);
                  setSelectedCourt(court.name);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select court" />
              </SelectTrigger>
              <SelectContent>
                {availableCourts.map((court) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.name} ({court.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
            {selectedDate && (
              <p className="text-sm text-gray-600">
                {formatDisplayDate(selectedDate)}
              </p>
            )}
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time
            </Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.25">15 minutes</SelectItem>
                <SelectItem value="0.5">30 minutes</SelectItem>
                <SelectItem value="0.75">45 minutes</SelectItem>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="1.25">1 hour 15 minutes</SelectItem>
                <SelectItem value="1.5">1 hour 30 minutes</SelectItem>
                <SelectItem value="1.75">1 hour 45 minutes</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="2.5">2 hours 30 minutes</SelectItem>
                <SelectItem value="3">3 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Player Name */}
          <div className="space-y-2">
            <Label htmlFor="playerName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Player Name
            </Label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
            />
          </div>

              {/* Reservation Summary */}
              {selectedCourt && selectedTime && selectedDate && (
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                  <div className="text-sm">
                    <div className="font-medium text-blue-800 mb-1">Reservation Summary</div>
                    <div className="text-blue-700">
                      <div>{currentFacility?.name}</div>
                      <div>{selectedCourt}</div>
                      <div>{formatDisplayDate(selectedDate)}</div>
                      <div>{selectedTime} - {calculateEndTime(selectedTime, duration)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex gap-2 pt-4 border-t border-gray-200 bg-white flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !selectedCourt}
                className="flex-1"
              >
                {isSubmitting ? 'Reserving...' : 'Quick Reserve'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}