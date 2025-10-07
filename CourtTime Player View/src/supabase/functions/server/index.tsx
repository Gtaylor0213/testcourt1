import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize Supabase clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to verify user authentication
async function verifyAuth(authHeader: string | undefined) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  
  // Check if this is the anon key (for login/register endpoints)
  if (token === supabaseAnonKey) {
    return 'anon';
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

// Health check endpoint
app.get("/make-server-76218beb/health", (c) => {
  return c.json({ status: "ok" });
});

// User registration endpoint
app.post("/make-server-76218beb/auth/register", async (c) => {
  try {
    console.log("Registration attempt received");
    const body = await c.req.json();
    const { email, password, fullName, userType = 'player' } = body;

    if (!email || !password || !fullName) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    console.log(`Attempting registration for: ${email}`);

    // Create user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        full_name: fullName,
        user_type: userType 
      },
      email_confirm: true // Auto-confirm since email server isn't configured
    });

    if (authError) {
      console.log("Auth registration error:", authError);
      return c.json({ error: authError.message }, 400);
    }

    // Store user profile in KV store
    const userId = authData.user.id;
    const userProfile = {
      id: userId,
      email,
      fullName,
      userType,
      createdAt: new Date().toISOString(),
      preferences: {
        notifications: true,
        timezone: 'America/New_York'
      }
    };

    await kv.set(`user:${userId}`, userProfile);
    console.log(`User registered successfully: ${email}`);

    return c.json({ 
      message: "User registered successfully",
      user: {
        id: userId,
        email,
        fullName,
        userType
      }
    });
  } catch (error) {
    console.log("Registration error:", error);
    return c.json({ error: "Registration failed" }, 500);
  }
});

// User login endpoint
app.post("/make-server-76218beb/auth/login", async (c) => {
  try {
    console.log("Login attempt received");
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: "Missing email or password" }, 400);
    }

    console.log(`Attempting login for: ${email}`);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("Login error:", error);
      return c.json({ error: error.message }, 401);
    }

    console.log(`Login successful for user: ${data.user.id}`);

    // Get user profile from KV store
    const userProfile = await kv.get(`user:${data.user.id}`);

    const responseUser = userProfile || {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.user_metadata?.full_name || 'User',
      userType: data.user.user_metadata?.user_type || 'player'
    };

    console.log("Returning user profile:", responseUser);

    return c.json({
      message: "Login successful",
      session: data.session,
      user: responseUser
    });
  } catch (error) {
    console.log("Login server error:", error);
    return c.json({ error: "Login failed" }, 500);
  }
});

// Get current user profile
app.get("/make-server-76218beb/auth/profile", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    
    if (!userProfile) {
      return c.json({ error: "User profile not found" }, 404);
    }

    return c.json({ user: userProfile });
  } catch (error) {
    console.log("Profile fetch error:", error);
    return c.json({ error: "Failed to fetch profile" }, 500);
  }
});

// Update user profile
app.put("/make-server-76218beb/auth/profile", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const existingProfile = await kv.get(`user:${user.id}`);
    
    if (!existingProfile) {
      return c.json({ error: "User profile not found" }, 404);
    }

    const updatedProfile = {
      ...existingProfile,
      ...body,
      id: user.id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString()
    };

    await kv.set(`user:${user.id}`, updatedProfile);

    return c.json({ 
      message: "Profile updated successfully",
      user: updatedProfile 
    });
  } catch (error) {
    console.log("Profile update error:", error);
    return c.json({ error: "Failed to update profile" }, 500);
  }
});

// Get facilities
app.get("/make-server-76218beb/facilities", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get all facilities from KV store
    const facilities = await kv.getByPrefix('facility:');
    
    return c.json({ facilities });
  } catch (error) {
    console.log("Facilities fetch error:", error);
    return c.json({ error: "Failed to fetch facilities" }, 500);
  }
});

// Create facility (admin only)
app.post("/make-server-76218beb/facilities", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile || userProfile.userType !== 'admin') {
      return c.json({ error: "Admin access required" }, 403);
    }

    const body = await c.req.json();
    const { name, type, address, courts } = body;

    if (!name || !type || !courts) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const facilityId = `facility_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const facility = {
      id: facilityId,
      name,
      type,
      address,
      courts,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    await kv.set(`facility:${facilityId}`, facility);

    return c.json({ 
      message: "Facility created successfully",
      facility 
    });
  } catch (error) {
    console.log("Facility creation error:", error);
    return c.json({ error: "Failed to create facility" }, 500);
  }
});

// Get bookings for a user
app.get("/make-server-76218beb/bookings", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userBookings = await kv.getByPrefix(`booking:user:${user.id}`);
    
    return c.json({ bookings: userBookings });
  } catch (error) {
    console.log("Bookings fetch error:", error);
    return c.json({ error: "Failed to fetch bookings" }, 500);
  }
});

// Create a booking
app.post("/make-server-76218beb/bookings", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { facilityId, court, date, time, duration } = body;

    if (!facilityId || !court || !date || !time || !duration) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const booking = {
      id: bookingId,
      userId: user.id,
      facilityId,
      court,
      date,
      time,
      duration,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    // Store booking with multiple keys for efficient querying
    await kv.set(`booking:${bookingId}`, booking);
    await kv.set(`booking:user:${user.id}:${bookingId}`, booking);
    await kv.set(`booking:facility:${facilityId}:${date}:${court}:${time}`, booking);

    return c.json({ 
      message: "Booking created successfully",
      booking 
    });
  } catch (error) {
    console.log("Booking creation error:", error);
    return c.json({ error: "Failed to create booking" }, 500);
  }
});

// Get facility bookings for a specific date
app.get("/make-server-76218beb/facilities/:facilityId/bookings/:date", async (c) => {
  try {
    const user = await verifyAuth(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const facilityId = c.req.param('facilityId');
    const date = c.req.param('date');

    const facilityBookings = await kv.getByPrefix(`booking:facility:${facilityId}:${date}`);
    
    return c.json({ bookings: facilityBookings });
  } catch (error) {
    console.log("Facility bookings fetch error:", error);
    return c.json({ error: "Failed to fetch facility bookings" }, 500);
  }
});

// Initialize default data on server startup
async function initializeDefaultData() {
  try {
    // Initialize demo users first
    await initializeDemoUsers();
    
    // Check if facilities already exist
    const existingFacilities = await kv.getByPrefix('facility:');
    
    if (existingFacilities.length === 0) {
      console.log("Initializing default facilities...");
      
      const defaultFacilities = [
        {
          id: 'sunrise-valley',
          name: 'Sunrise Valley HOA',
          type: 'HOA Tennis & Pickleball Courts',
          address: '123 Sunrise Valley Dr, Reston, VA 20191',
          courts: [
            { name: 'Tennis Court 1', type: 'tennis' },
            { name: 'Tennis Court 2', type: 'tennis' },
            { name: 'Pickleball Court 1', type: 'pickleball' },
            { name: 'Pickleball Court 2', type: 'pickleball' }
          ],
          createdAt: new Date().toISOString(),
          status: 'active'
        },
        {
          id: 'downtown',
          name: 'Downtown Tennis Center',
          type: 'Tennis Club',
          address: '456 Main St, Downtown, VA 22101',
          courts: [
            { name: 'Court 1', type: 'tennis' },
            { name: 'Court 2', type: 'tennis' },
            { name: 'Court 3', type: 'tennis' },
            { name: 'Court 4', type: 'tennis' }
          ],
          createdAt: new Date().toISOString(),
          status: 'active'
        },
        {
          id: 'riverside',
          name: 'Riverside Tennis Club',
          type: 'Premium Tennis Club',
          address: '789 River Rd, Riverside, VA 22102',
          courts: [
            { name: 'Center Court', type: 'tennis' },
            { name: 'Court A', type: 'tennis' },
            { name: 'Court B', type: 'tennis' },
            { name: 'Practice Court', type: 'tennis' }
          ],
          createdAt: new Date().toISOString(),
          status: 'active'
        },
        {
          id: 'westside',
          name: 'Westside Pickleball Club',
          type: 'Pickleball Club',
          address: '321 West Ave, Westside, VA 22103',
          courts: [
            { name: 'Court 1', type: 'pickleball' },
            { name: 'Court 2', type: 'pickleball' },
            { name: 'Court 3', type: 'pickleball' },
            { name: 'Court 4', type: 'pickleball' },
            { name: 'Court 5', type: 'pickleball' },
            { name: 'Court 6', type: 'pickleball' }
          ],
          createdAt: new Date().toISOString(),
          status: 'active'
        },
        {
          id: 'eastgate',
          name: 'Eastgate Sports Complex',
          type: 'Multi-Sport Complex',
          address: '654 East Gate Blvd, Eastgate, VA 22104',
          courts: [
            { name: 'Tennis Court A', type: 'tennis' },
            { name: 'Tennis Court B', type: 'tennis' },
            { name: 'Pickleball Court 1', type: 'pickleball' },
            { name: 'Pickleball Court 2', type: 'pickleball' },
            { name: 'Pickleball Court 3', type: 'pickleball' },
            { name: 'Pickleball Court 4', type: 'pickleball' }
          ],
          createdAt: new Date().toISOString(),
          status: 'active'
        }
      ];

      for (const facility of defaultFacilities) {
        await kv.set(`facility:${facility.id}`, facility);
      }
      
      console.log("Default facilities initialized successfully");
    }
  } catch (error) {
    console.log("Error initializing default data:", error);
  }
}

// Initialize demo users
async function initializeDemoUsers() {
  try {
    console.log("Checking demo users...");
    
    const demoUsers = [
      {
        email: 'admin@courttime.com',
        password: 'admin123',
        fullName: 'John Doe',
        userType: 'admin'
      },
      {
        email: 'player@courttime.com',
        password: 'player123',
        fullName: 'Jane Smith',
        userType: 'player'
      }
    ];

    for (const demoUser of demoUsers) {
      try {
        // Check if user already exists
        const existingProfile = await kv.get(`user:email:${demoUser.email}`);
        
        if (!existingProfile) {
          console.log(`Creating demo user: ${demoUser.email}`);
          
          // Create auth user
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: demoUser.email,
            password: demoUser.password,
            user_metadata: { 
              full_name: demoUser.fullName,
              user_type: demoUser.userType 
            },
            email_confirm: true
          });

          if (authError) {
            console.log(`Error creating demo user ${demoUser.email}:`, authError);
            continue;
          }

          // Store user profile
          const userId = authData.user.id;
          const userProfile = {
            id: userId,
            email: demoUser.email,
            fullName: demoUser.fullName,
            userType: demoUser.userType,
            createdAt: new Date().toISOString(),
            preferences: {
              notifications: true,
              timezone: 'America/New_York'
            }
          };

          await kv.set(`user:${userId}`, userProfile);
          await kv.set(`user:email:${demoUser.email}`, userProfile);
          
          console.log(`Demo user created successfully: ${demoUser.email}`);
        } else {
          console.log(`Demo user already exists: ${demoUser.email}`);
        }
      } catch (error) {
        console.log(`Error processing demo user ${demoUser.email}:`, error);
      }
    }
  } catch (error) {
    console.log("Error initializing demo users:", error);
  }
}

// Initialize default data on startup (non-blocking)
initializeDefaultData().catch(console.error);

Deno.serve(app.fetch);