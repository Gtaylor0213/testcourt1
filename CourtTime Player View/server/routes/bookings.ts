import express from 'express';
import {
  getBookingsByFacilityAndDate,
  getBookingsByCourtAndDate,
  getBookingsByUser,
  createBooking,
  cancelBooking,
  getBookingById
} from '../../src/services/bookingService';
import { notificationService } from '../../src/services/notificationService';
import { pool } from '../../src/database/connection';

const router = express.Router();

/**
 * GET /api/bookings/facility/:facilityId
 * Get bookings for a facility on a specific date
 */
router.get('/facility/:facilityId', async (req, res, next) => {
  try {
    const { facilityId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date parameter is required'
      });
    }

    const bookings = await getBookingsByFacilityAndDate(facilityId, date as string);

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bookings/court/:courtId
 * Get bookings for a specific court on a specific date
 */
router.get('/court/:courtId', async (req, res, next) => {
  try {
    const { courtId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date parameter is required'
      });
    }

    const bookings = await getBookingsByCourtAndDate(courtId, date as string);

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bookings/user/:userId
 * Get bookings for a specific user
 */
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { upcoming } = req.query;

    const bookings = await getBookingsByUser(
      userId,
      upcoming === 'true' || upcoming === undefined
    );

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bookings/:bookingId
 * Get a specific booking by ID
 */
router.get('/:bookingId', async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await getBookingById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings
 * Create a new booking
 */
router.post('/', async (req, res, next) => {
  try {
    const {
      courtId,
      userId,
      facilityId,
      bookingDate,
      startTime,
      endTime,
      durationMinutes,
      bookingType,
      notes
    } = req.body;

    // Validation
    if (!courtId || !userId || !facilityId || !bookingDate || !startTime || !endTime || !durationMinutes) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const result = await createBooking({
      courtId,
      userId,
      facilityId,
      bookingDate,
      startTime,
      endTime,
      durationMinutes,
      bookingType,
      notes
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Create notification for booking confirmation
    try {
      // Get booking details for notification
      const facilityQuery = await pool.query('SELECT name FROM facilities WHERE id = $1', [facilityId]);
      const courtQuery = await pool.query('SELECT name FROM courts WHERE id = $1', [courtId]);

      const facilityName = facilityQuery.rows[0]?.name || 'Your facility';
      const courtName = courtQuery.rows[0]?.name || 'Court';

      // Create the start and end datetime objects
      const startDateTime = new Date(`${bookingDate}T${startTime}`);
      const endDateTime = new Date(`${bookingDate}T${endTime}`);

      await notificationService.notifyBookingConfirmed(
        userId,
        facilityName,
        courtName,
        startDateTime,
        endDateTime
      );
    } catch (notificationError) {
      console.error('Error creating booking notification:', notificationError);
      // Don't fail the booking if notification fails
    }

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/bookings/:bookingId
 * Cancel a booking
 */
router.delete('/:bookingId', async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get booking details before cancelling
    const booking = await getBookingById(bookingId);

    const result = await cancelBooking(bookingId, userId as string);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Create notification for booking cancellation
    if (booking) {
      try {
        const facilityQuery = await pool.query('SELECT name FROM facilities WHERE id = $1', [booking.facilityId]);
        const courtQuery = await pool.query('SELECT name FROM courts WHERE id = $1', [booking.courtId]);

        const facilityName = facilityQuery.rows[0]?.name || 'Your facility';
        const courtName = courtQuery.rows[0]?.name || 'Court';

        const startDateTime = new Date(`${booking.bookingDate}T${booking.startTime}`);

        await notificationService.notifyBookingCancelled(
          userId as string,
          facilityName,
          courtName,
          startDateTime,
          'Cancelled by user'
        );
      } catch (notificationError) {
        console.error('Error creating cancellation notification:', notificationError);
        // Don't fail the cancellation if notification fails
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
