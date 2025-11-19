# Admin Pages Implementation Guide

This document describes how the admin pages have been updated to use real database data.

## All Admin Pages Complete! ✅

All admin pages have been successfully updated to use real database data. The ViewSwitcher has been removed as it's no longer needed.

### 1. AdminDashboard (`src/components/admin/AdminDashboard.tsx`)
**Status**: ✅ Complete - Uses real database data

**Features**:
- Fetches real-time statistics from `/api/admin/dashboard/:facilityId`
- Displays actual booking counts, member statistics, and court utilization
- Shows recent activity from the database
- Includes loading states and error handling

**API Endpoint**: `GET /api/admin/dashboard/:facilityId`

### 2. MemberManagement (`src/components/admin/MemberManagement.tsx`)
**Status**: ✅ Complete - Uses real database data

**Features**:
- Fetches members from `/api/members/facility/:facilityId`
- Allows updating member status and membership type
- Search and filter functionality
- Toggle admin privileges

**API Endpoints**:
- `GET /api/members/facility/:facilityId`
- `PATCH /api/members/:membershipId`

### 3. FacilityManagement (`src/components/admin/FacilityManagement.tsx`)
**Status**: ✅ Complete - Uses real database data

**Features**:
- Fetches facility data from `/api/facilities/:facilityId`
- Displays facility name, type, address, contact info, description
- Shows amenities and operating hours from database
- Edit mode with save/cancel functionality
- Updates facility using `/api/admin/facilities/:facilityId`
- Loading and error states with toast notifications

**API Endpoints**:
- `GET /api/facilities/:facilityId` - Fetch facility details
- `PATCH /api/admin/facilities/:facilityId` - Update facility

### 4. CourtManagement (`src/components/admin/CourtManagement.tsx`)
**Status**: ✅ Complete - Uses real database data

**Features**:
- Fetches all courts from `/api/facilities/:facilityId/courts`
- Displays court name, number, type, surface, indoor/outdoor, lights
- Edit existing courts with inline form
- Updates court details using `/api/admin/courts/:courtId`
- Deactivate courts (soft delete)
- Loading states and error handling

**API Endpoints**:
- `GET /api/facilities/:facilityId/courts` - Fetch courts
- `PATCH /api/admin/courts/:courtId` - Update court

### 5. BookingManagement (`src/components/admin/BookingManagement.tsx`)
**Status**: ✅ Complete - Uses real database data

**Features**:
- Fetches bookings from `/api/admin/bookings/:facilityId`
- Filters by status, court, and date range
- Search by member name, email, or court
- Cancel bookings
- Mark bookings as completed
- Shows court, member, date, time, type, and status
- Default date range of ±7 days from today

**API Endpoints**:
- `GET /api/admin/bookings/:facilityId` - Fetch bookings with filters
- `PATCH /api/admin/bookings/:bookingId/status` - Update booking status

### 6. Analytics (`src/components/admin/Analytics.tsx`)
**Status**: ✅ Complete - Uses real database data

**Features**:
- Fetches analytics from `/api/admin/analytics/:facilityId`
- Time range selector (7, 30, 90, 365 days)
- Key metrics: Total bookings, court utilization, new members, total courts
- Booking trends chart (bar graph visualization)
- Member growth timeline
- Peak hours analysis (top 4 time slots)
- Top courts by booking count
- Calculated court utilization percentage

**API Endpoint**:
- `GET /api/admin/analytics/:facilityId?period=30` - Fetch analytics data

### 7. AdminBooking (`src/components/admin/AdminBooking.tsx`)
**Status**: ✅ Already Complete - Uses real database

**Features**:
- Create new bookings for members
- Select member, court, date, and time
- Real-time conflict checking
- Integration with existing booking system

## Sample Data

The database has been populated with sample data for Sunrise Valley HOA:

- **5 Members**:
  - john.doe@email.com (password: password123)
  - jane.smith@email.com (password: password123)
  - mike.johnson@email.com (password: password123)
  - sarah.williams@email.com (password: password123)
  - david.brown@email.com (password: password123)

- **1 Admin**:
  - admin@sunrisevalley.com (password: admin123)

- **53 Bookings** spread across the past 2 weeks and next 2 weeks

- **4 Courts** at Sunrise Valley HOA

## Implementation Pattern Used

All admin pages follow this consistent pattern:

```typescript
import { useAuth } from '../../contexts/AuthContext';
import { adminApi, facilitiesApi } from '../../api/client';
import { toast } from 'sonner';

export function AdminPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentFacilityId = user?.memberFacilities?.[0];

  useEffect(() => {
    if (currentFacilityId) {
      loadData();
    }
  }, [currentFacilityId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getMethod(currentFacilityId);

      if (response.success && response.data) {
        setData(response.data);
      } else {
        toast.error(response.error || 'Failed to load data');
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Loading spinner while fetching
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Rest of component...
}
```

## Database Schema Notes

All admin operations work with these main tables:

- **facilities** - Facility information
- **courts** - Court details and status
- **bookings** - All court reservations
- **facility_memberships** - User-facility relationships
- **users** - User accounts and profiles

The `is_facility_admin` flag in `facility_memberships` table determines admin access.

## Testing

1. **Login as Admin**: Use admin@sunrisevalley.com / admin123
2. **Navigate Admin Pages**: Use the sidebar to access all admin pages
3. **Test Features**:
   - AdminDashboard: View real-time stats and recent activity
   - FacilityManagement: Edit facility details and save changes
   - CourtManagement: View courts, edit details, change status
   - BookingManagement: Filter bookings, cancel/complete bookings
   - MemberManagement: View members, update status and privileges
   - Analytics: Change time range, view booking trends and peak hours
   - AdminBooking: Create new bookings with conflict checking

## Summary

✅ **All 7 admin pages are now fully functional with real database integration!**

Key accomplishments:
- Removed ViewSwitcher component (no longer needed)
- All pages use real data from PostgreSQL database
- Consistent error handling with toast notifications
- Loading states for better UX
- All CRUD operations working (Create, Read, Update, Delete/Deactivate)
- Sample data populated for testing
- Complete API coverage for all admin operations
