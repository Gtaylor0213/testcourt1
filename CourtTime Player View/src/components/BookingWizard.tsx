import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  court: string;
  date: string;
  time: string;
  facility: string;
  selectedSlots?: Array<{ court: string; time: string }>;
}

export function BookingWizard({ isOpen, onClose, court, date, time, facility, selectedSlots }: BookingWizardProps) {
  const [duration, setDuration] = useState('1');
  const [notes, setNotes] = useState('');
  const [playerName, setPlayerName] = useState('John Doe');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Booking submitted:', {
      court,
      date,
      time,
      duration,
      notes,
      playerName,
      facility,
      selectedSlots
    });
    
    setIsSubmitting(false);
    onClose();
    
    // Show success notification
    const reservationDetails = {
      facility,
      court,
      date,
      time: selectedSlots && selectedSlots.length > 1 && timeRange 
        ? `${timeRange.start} - ${timeRange.end}` 
        : `${time} - ${calculateEndTime(time, duration)}`
    };

    if (selectedSlots && selectedSlots.length > 1) {
      showToast(
        'reservation_confirmed',
        'Multiple Courts Booked!',
        `${selectedSlots.length} consecutive slots at ${facility} have been confirmed.`,
        reservationDetails
      );
    } else {
      showToast(
        'reservation_confirmed',
        'Court Reservation Confirmed',
        `Your ${court} booking at ${facility} has been confirmed.`,
        reservationDetails
      );
    }

    // Simulate additional payment notification after a short delay
    setTimeout(() => {
      const cost = selectedSlots && selectedSlots.length > 1 
        ? selectedSlots.length * 35 
        : parseFloat(duration) * 35;
      
      showToast(
        'payment_received',
        'Payment Processed',
        `Payment of ${cost}.00 has been successfully processed for your court reservation.`,
        reservationDetails
      );
    }, 2000);
  };

  const calculateEndTime = (startTime: string, durationHours: string) => {
    const [time, period] = startTime.split(' ');
    const timeParts = time.split(':');
    let hours = parseInt(timeParts[0]);
    let minutes = timeParts[1] ? parseInt(timeParts[1]) : 0; // Default to 0 if no minutes
    
    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    // Add duration (handle fractional hours)
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

  const getTimeRangeForSelectedSlots = () => {
    if (!selectedSlots || selectedSlots.length === 0) return null;
    
    // Sort slots by time
    const sortedSlots = [...selectedSlots].sort((a, b) => {
      const timeA = a.time;
      const timeB = b.time;
      return timeA.localeCompare(timeB);
    });
    
    const firstSlot = sortedSlots[0];
    const lastSlot = sortedSlots[sortedSlots.length - 1];
    
    return {
      start: firstSlot.time,
      end: calculateEndTime(lastSlot.time, '1')
    };
  };

  const timeRange = getTimeRangeForSelectedSlots();

  return (
    <Dialog open={isOpen} onOpenChange={() => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Court</DialogTitle>
          <DialogDescription>
            Complete your reservation details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Court & Facility Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{facility}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{date}</span>
            </div>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{court}</span>
              </div>
              <div className="text-sm text-blue-600 mt-1">
                {selectedSlots && selectedSlots.length > 1 ? (
                  <>
                    <div className="font-medium mb-1">{selectedSlots.length} consecutive slots selected</div>
                    <div className="text-xs">
                      {timeRange ? `${timeRange.start} - ${timeRange.end}` : 'Multiple time slots'}
                    </div>
                  </>
                ) : (
                  `${time} - ${calculateEndTime(time, duration)}`
                )}
              </div>
            </div>
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

          {/* Duration - Hide for multi-slot selections since duration is predetermined */}
          {(!selectedSlots || selectedSlots.length <= 1) && (
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">30 minutes</SelectItem>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="1.5">1.5 hours</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="2.5">2.5 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any special requests or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
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
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Booking...' : 'Book Court'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}