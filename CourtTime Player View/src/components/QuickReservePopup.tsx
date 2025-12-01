import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
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
  const [selectedCourtType, setSelectedCourtType] = useState<'tennis' | 'pickleball' | null>(null);
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState('1');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingBookings, setExistingBookings] = useState<any>({});

  // Advanced booking state
  const [advancedBooking, setAdvancedBooking] = useState(false);
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [recurringEndDate, setRecurringEndDate] = useState('');

  // Initialize with current date and time, reset notes when modal opens
  useEffect(() => {
    if (!isOpen) return;

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

    // Reset notes and advanced booking when modal opens
    setNotes('');
    setAdvancedBooking(false);
    setRecurringDays([]);
    setRecurringEndDate('');
  }, [isOpen]);

  // Reset court selection when facility changes
  useEffect(() => {
    setSelectedCourt('');
    setSelectedCourtId('');
    setSelectedCourtType(null);
  }, [selectedFacility]);

  const currentFacility = facilities.find(f => f.id === selectedFacility);
  const allCourts = currentFacility?.courts || [];

  // Filter courts by selected type
  const availableCourts = React.useMemo(() => {
    if (selectedCourtType === null) {
      return allCourts;
    }
    return allCourts.filter(court => court.type === selectedCourtType);
  }, [allCourts, selectedCourtType]);

  // Fetch bookings when modal opens, facility changes, or date changes
  useEffect(() => {
    const fetchBookings = async () => {
      if (!isOpen || !selectedFacility || !selectedDate) return;

      try {
        const response = await bookingApi.getByFacility(selectedFacility, selectedDate);
        if (response.success && response.data?.bookings) {
          // Transform bookings into a lookup object by court name and time
          const bookingsMap: any = {};
          response.data.bookings.forEach((booking: any) => {
            const courtName = booking.courtName;

            // Convert 24h time to 12h format
            const [hours24, minutes] = booking.startTime.split(':').map(Number);
            const period = hours24 >= 12 ? 'PM' : 'AM';
            const hours12 = hours24 % 12 || 12;
            const startTime12h = `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;

            if (!bookingsMap[courtName]) {
              bookingsMap[courtName] = new Set();
            }

            // Mark all time slots this booking occupies
            const slotsToFill = Math.ceil(booking.durationMinutes / 15);
            for (let i = 0; i < slotsToFill; i++) {
              const slotMinutes = minutes + (i * 15);
              const slotHours24 = hours24 + Math.floor(slotMinutes / 60);
              const actualMinutes = slotMinutes % 60;
              const slotPeriod = slotHours24 >= 12 ? 'PM' : 'AM';
              const slotHours12 = slotHours24 % 12 || 12;
              const slotTime = `${slotHours12}:${actualMinutes.toString().padStart(2, '0')} ${slotPeriod}`;
              bookingsMap[courtName].add(slotTime);
            }
          });
          setExistingBookings(bookingsMap);
        } else {
          setExistingBookings({});
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setExistingBookings({});
      }
    };

    fetchBookings();
  }, [isOpen, selectedFacility, selectedDate]);

  // Auto-select first available court and find soonest available time when court type changes
  useEffect(() => {
    if (selectedCourtType && availableCourts.length > 0) {
      // Generate time slots for checking
      const generateTimeSlots = () => {
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
      };

      const allTimeSlots = generateTimeSlots();

      // Find the current time index
      const now = new Date();
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
      const currentTimeSlot = `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
      const currentTimeIndex = allTimeSlots.indexOf(currentTimeSlot);

      // Find the SOONEST available time across ALL courts of this type
      let soonestSlot: { court: any; time: string; timeIndex: number } | null = null;

      // Check each time slot starting from current time
      for (let i = currentTimeIndex; i < allTimeSlots.length && i >= 0; i++) {
        const timeSlot = allTimeSlots[i];

        // Check if ANY court is available at this time
        for (const court of availableCourts) {
          const courtBookings = existingBookings[court.name] || new Set();

          if (!courtBookings.has(timeSlot)) {
            // Found an available court at this time!
            soonestSlot = { court, time: timeSlot, timeIndex: i };
            break;
          }
        }

        // If we found a slot, use it (it's the soonest)
        if (soonestSlot) break;
      }

      if (soonestSlot) {
        // Set the court and time to the soonest available
        setSelectedCourtId(soonestSlot.court.id);
        setSelectedCourt(soonestSlot.court.name);
        setSelectedTime(soonestSlot.time);

        // Set to today's date
        const dateStr = now.toISOString().split('T')[0];
        setSelectedDate(dateStr);
      } else {
        // No available slots found, just select first court and current time
        const firstCourt = availableCourts[0];
        setSelectedCourtId(firstCourt.id);
        setSelectedCourt(firstCourt.name);
        setSelectedTime(currentTimeSlot);
        const dateStr = now.toISOString().split('T')[0];
        setSelectedDate(dateStr);
      }
    } else {
      setSelectedCourt('');
      setSelectedCourtId('');
    }
  }, [selectedCourtType, availableCourts, existingBookings]);

  // Determine if facility has both types of courts
  const hasTennisCourts = allCourts.some(court => court.type === 'tennis');
  const hasPickleballCourts = allCourts.some(court => court.type === 'pickleball');
  const hasMultipleCourtTypes = hasTennisCourts && hasPickleballCourts;

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

  const toggleRecurringDay = (day: string) => {
    setRecurringDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const getDayOfWeek = (date: Date): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const generateRecurringDates = (): string[] => {
    if (!advancedBooking || recurringDays.length === 0 || !recurringEndDate) {
      return [selectedDate];
    }

    const dates: string[] = [];
    const start = new Date(selectedDate + 'T00:00:00');
    const end = new Date(recurringEndDate + 'T00:00:00');

    let current = new Date(start);
    while (current <= end) {
      const dayName = getDayOfWeek(current);
      if (recurringDays.includes(dayName)) {
        dates.push(current.toISOString().split('T')[0]);
      }
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

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

    // Validate advanced booking
    if (advancedBooking) {
      if (recurringDays.length === 0) {
        alert('Please select at least one day of the week for recurring bookings');
        return;
      }
      if (!recurringEndDate) {
        alert('Please select an end date for recurring bookings');
        return;
      }
      if (new Date(recurringEndDate) < new Date(selectedDate)) {
        alert('End date must be on or after the start date');
        return;
      }
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

      // Generate dates for booking
      const datesToBook = generateRecurringDates();

      // Create bookings for all dates
      const results = await Promise.all(
        datesToBook.map(date =>
          bookingApi.create({
            courtId: selectedCourtId,
            userId: user.id,
            facilityId: selectedFacility,
            bookingDate: date,
            startTime: startTime24,
            endTime: endTime24,
            durationMinutes: Math.round(durationMinutes),
            notes: notes || undefined
          })
        )
      );

      const failedBookings = results.filter(r => !r.success);
      const successfulBookings = results.filter(r => r.success);

      if (successfulBookings.length > 0) {
        // Call the parent callback to refresh bookings
        const reservation = {
          facility: currentFacility?.name || '',
          court: selectedCourt,
          date: selectedDate,
          time: selectedTime,
          duration,
          playerName: user.name || user.email || 'Player'
        };
        onReserve(reservation);

        if (failedBookings.length > 0) {
          alert(`${successfulBookings.length} bookings created successfully. ${failedBookings.length} bookings failed (possibly due to conflicts).`);
        }

        onClose();
      } else {
        alert('Failed to create any bookings. There may be conflicts with existing reservations.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('An error occurred while creating your booking(s)');
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
            Quick Reserve autofills for the soonest possible date and time of reservation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto min-h-0">
          <form onSubmit={handleSubmit} id="quick-reserve-form" className="h-full flex flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto pb-24">
              {/* Facility Selection */}
              <div className="flex items-center gap-3">
                <Label htmlFor="facility" className="flex items-center gap-2 min-w-[80px]">
                  <MapPin className="h-4 w-4" />
                  Facility
                </Label>
                <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                  <SelectTrigger className="flex-1">
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

          {/* Court Type Filter - Only show if facility has multiple court types */}
          {hasMultipleCourtTypes && (
            <div className="flex items-center gap-3">
              <Label className="min-w-[80px]">Court Type</Label>
              <div className="flex gap-2">
                {hasTennisCourts && (
                  <Button
                    type="button"
                    variant={selectedCourtType === 'tennis' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCourtType(selectedCourtType === 'tennis' ? null : 'tennis')}
                    className={selectedCourtType === 'tennis' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    Tennis
                  </Button>
                )}
                {hasPickleballCourts && (
                  <Button
                    type="button"
                    variant={selectedCourtType === 'pickleball' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCourtType(selectedCourtType === 'pickleball' ? null : 'pickleball')}
                    className={selectedCourtType === 'pickleball' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    Pickleball
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Court Selection */}
          <div className="flex items-center gap-3">
            <Label htmlFor="court" className="min-w-[80px]">Court</Label>
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
              <SelectTrigger className="flex-1">
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
          <div className="flex items-center gap-3">
            <Label htmlFor="date" className="flex items-center gap-2 min-w-[80px]">
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
              className="flex-1"
            />
          </div>

          {/* Time Selection */}
          <div className="flex items-center gap-3">
            <Label htmlFor="time" className="flex items-center gap-2 min-w-[80px]">
              <Clock className="h-4 w-4" />
              Time
            </Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="flex-1">
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
          <div className="flex items-center gap-3">
            <Label htmlFor="duration" className="min-w-[80px]">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="flex-1">
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

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any special requests or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Advanced Booking Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="advanced-booking"
              checked={advancedBooking}
              onCheckedChange={(checked) => setAdvancedBooking(checked === true)}
            />
            <Label htmlFor="advanced-booking" className="text-sm font-medium cursor-pointer">
              Advanced Booking (Recurring)
            </Label>
          </div>

          {/* Recurring Options - Show when Advanced Booking is checked */}
          {advancedBooking && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-md border border-gray-200">
              {/* Days of the Week */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Days of the Week</Label>
                <div className="grid grid-cols-4 gap-2">
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                    <div key={day} className="flex items-center gap-2">
                      <Checkbox
                        id={`day-${day}`}
                        checked={recurringDays.includes(day)}
                        onCheckedChange={() => toggleRecurringDay(day)}
                      />
                      <Label htmlFor={`day-${day}`} className="text-xs cursor-pointer">
                        {day.slice(0, 3)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="recurring-end-date" className="text-sm font-medium">
                  Repeat Until
                </Label>
                <Input
                  id="recurring-end-date"
                  type="date"
                  value={recurringEndDate}
                  onChange={(e) => setRecurringEndDate(e.target.value)}
                  min={selectedDate}
                  className="w-full"
                />
              </div>

              {/* Recurring Summary */}
              {recurringDays.length > 0 && recurringEndDate && (
                <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                  <span className="font-medium">Will create bookings:</span>
                  <div className="mt-1">
                    Every {recurringDays.join(', ')} from {new Date(selectedDate + 'T00:00:00').toLocaleDateString()} to {new Date(recurringEndDate + 'T00:00:00').toLocaleDateString()}
                  </div>
                  <div className="mt-1 font-medium">
                    Total bookings: {generateRecurringDates().length}
                  </div>
                </div>
              )}
            </div>
          )}

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

          </form>
        </div>

        {/* Action Buttons - Fixed footer */}
        <div className="flex gap-2 p-4 border-t border-gray-200 bg-white flex-shrink-0">
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
            form="quick-reserve-form"
            disabled={isSubmitting || !selectedCourt}
            className="flex-1"
          >
            {isSubmitting ? 'Reserving...' : 'Quick Reserve'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}