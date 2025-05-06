import { db } from "./index";
import * as schema from "@shared/schema";
import { addDays, subDays, subMonths, format } from "date-fns";

async function seed() {
  try {
    console.log("Seeding database...");

    // Seed users
    const users = await seedUsers();
    // Seed environments
    const environments = await seedEnvironments();
    // Seed teams
    const teams = await seedTeams();
    // Seed metrics
    await seedMetrics(environments[0].id);
    // Seed daily status
    await seedDailyStatus(environments[0].id);
    // Seed bookings
    await seedBookings(environments, teams, users[0].id);
    // Seed incidents
    await seedIncidents(environments[0].id);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

async function seedUsers() {
  console.log("Seeding users...");
  const existingUsers = await db.query.users.findMany();
  
  if (existingUsers.length > 0) {
    console.log(`Found ${existingUsers.length} existing users. Skipping user creation.`);
    return existingUsers;
  }
  
  const usersData = [
    { username: "admin", password: "admin123" },
    { username: "testuser", password: "password123" }
  ];
  
  const insertedUsers = await db.insert(schema.users).values(usersData).returning();
  console.log(`Inserted ${insertedUsers.length} users.`);
  return insertedUsers;
}

async function seedEnvironments() {
  console.log("Seeding environments...");
  const existingEnvironments = await db.query.environments.findMany();
  
  if (existingEnvironments.length > 0) {
    console.log(`Found ${existingEnvironments.length} existing environments. Skipping environment creation.`);
    return existingEnvironments;
  }
  
  const environmentsData = [
    { name: "UAT Environment", description: "User Acceptance Testing Environment" },
    { name: "Dev Environment", description: "Development Environment" },
    { name: "Testing Environment", description: "QA Testing Environment" },
    { name: "Pre-production", description: "Pre-production Environment" }
  ];
  
  const insertedEnvironments = await db.insert(schema.environments).values(environmentsData).returning();
  console.log(`Inserted ${insertedEnvironments.length} environments.`);
  return insertedEnvironments;
}

async function seedTeams() {
  console.log("Seeding teams...");
  const existingTeams = await db.query.teams.findMany();
  
  if (existingTeams.length > 0) {
    console.log(`Found ${existingTeams.length} existing teams. Skipping team creation.`);
    return existingTeams;
  }
  
  const teamsData = [
    { name: "Frontend Team", description: "Frontend Development Team", abbreviation: "FT" },
    { name: "Backend Integration", description: "Backend Integration Team", abbreviation: "BI" },
    { name: "Quality Assurance", description: "QA Testing Team", abbreviation: "QA" },
    { name: "DevOps", description: "DevOps Team", abbreviation: "DO" }
  ];
  
  const insertedTeams = await db.insert(schema.teams).values(teamsData).returning();
  console.log(`Inserted ${insertedTeams.length} teams.`);
  return insertedTeams;
}

async function seedMetrics(environmentId: number) {
  console.log("Seeding metrics...");
  const existingMetrics = await db.query.metrics.findMany();
  
  if (existingMetrics.length > 0) {
    console.log(`Found ${existingMetrics.length} existing metrics. Skipping metrics creation.`);
    return;
  }
  
  // Generate 30 days of metrics
  const today = new Date();
  const metricsData = [];
  
  for (let i = 0; i < 30; i++) {
    const date = subDays(today, i);
    
    // Create some variation in the metrics
    const uptime = 98 + Math.random() * 2; // 98-100%
    const mttr = 30 + Math.floor(Math.random() * 40); // 30-70 minutes
    const mtbf = 10 + Math.floor(Math.random() * 8); // 10-18 days in minutes
    const resourceUtilization = 70 + Math.random() * 15; // 70-85%
    const occupancy = 75 + Math.random() * 20; // 75-95%
    
    metricsData.push({
      environmentId,
      date,
      uptime,
      mttr,
      mtbf: mtbf * 24 * 60, // Convert days to minutes
      resourceUtilization,
      occupancy
    });
  }
  
  const insertedMetrics = await db.insert(schema.metrics).values(metricsData).returning();
  console.log(`Inserted ${insertedMetrics.length} metrics.`);
}

async function seedDailyStatus(environmentId: number) {
  console.log("Seeding daily status...");
  const existingStatus = await db.query.dailyStatus.findMany();
  
  if (existingStatus.length > 0) {
    console.log(`Found ${existingStatus.length} existing daily status records. Skipping status creation.`);
    return;
  }
  
  // Generate 30 days of status
  const today = new Date();
  const statusData = [];
  
  for (let i = 0; i < 30; i++) {
    const date = subDays(today, i);
    
    // Randomly assign status based on probabilities
    let status: 'healthy' | 'issues' | 'down';
    let uptimePercentage: number;
    let hasIncident: boolean;
    let incidentCount: number;
    let recoveryTime: number | null;
    
    const random = Math.random();
    
    if (random < 0.8) { // 80% chance of healthy
      status = 'healthy';
      uptimePercentage = 99 + (Math.random() * 1); // 99-100%
      hasIncident = false;
      incidentCount = 0;
      recoveryTime = null;
    } else if (random < 0.95) { // 15% chance of issues
      status = 'issues';
      uptimePercentage = 90 + (Math.random() * 9); // 90-99%
      hasIncident = true;
      incidentCount = 1;
      recoveryTime = 30 + Math.floor(Math.random() * 30); // 30-60 minutes
    } else { // 5% chance of down
      status = 'down';
      uptimePercentage = 60 + (Math.random() * 30); // 60-90%
      hasIncident = true;
      incidentCount = 1 + Math.floor(Math.random() * 2); // 1-2 incidents
      recoveryTime = 60 + Math.floor(Math.random() * 180); // 60-240 minutes
    }
    
    statusData.push({
      environmentId,
      date,
      status,
      uptimePercentage,
      hasIncident,
      incidentCount,
      recoveryTime
    });
  }
  
  const insertedStatus = await db.insert(schema.dailyStatus).values(statusData).returning();
  console.log(`Inserted ${insertedStatus.length} daily status records.`);
}

async function seedBookings(environments: any[], teams: any[], userId: number) {
  console.log("Seeding bookings...");
  const existingBookings = await db.query.bookings.findMany();
  
  if (existingBookings.length > 0) {
    console.log(`Found ${existingBookings.length} existing bookings. Skipping booking creation.`);
    return;
  }
  
  const now = new Date();
  
  // Create a mix of current, past, and future bookings
  const bookingsData = [
    // Current bookings
    {
      environmentId: environments[0].id,
      teamId: teams[0].id,
      userId,
      startDate: subDays(now, 3),
      endDate: addDays(now, 3),
      purpose: "Frontend testing for new UI components",
      configuration: "Standard Config",
      status: "active"
    },
    {
      environmentId: environments[1].id,
      teamId: teams[1].id,
      userId,
      startDate: subDays(now, 10),
      endDate: addDays(now, 5),
      purpose: "Backend integration testing with new API endpoints",
      configuration: "Extended Resources",
      status: "active"
    },
    {
      environmentId: environments[2].id,
      teamId: teams[2].id,
      userId,
      startDate: subDays(now, 2),
      endDate: addDays(now, 4),
      purpose: "Quality assurance testing for release 2.0",
      configuration: "Base Configuration",
      status: "active"
    },
    
    // Past bookings
    {
      environmentId: environments[0].id,
      teamId: teams[2].id,
      userId,
      startDate: subDays(now, 15),
      endDate: subDays(now, 10),
      purpose: "Regression testing",
      configuration: "Standard Config",
      status: "completed"
    },
    {
      environmentId: environments[1].id,
      teamId: teams[0].id,
      userId,
      startDate: subDays(now, 20),
      endDate: subDays(now, 18),
      purpose: "Performance testing",
      configuration: "Extended Resources",
      status: "completed"
    },
    
    // Future bookings
    {
      environmentId: environments[0].id,
      teamId: teams[1].id,
      userId,
      startDate: addDays(now, 5),
      endDate: addDays(now, 8),
      purpose: "Security testing for upcoming release",
      configuration: "Standard Config",
      status: "scheduled"
    },
    {
      environmentId: environments[2].id,
      teamId: teams[3].id,
      userId,
      startDate: addDays(now, 10),
      endDate: addDays(now, 15),
      purpose: "Infrastructure upgrade testing",
      configuration: "Extended Resources",
      status: "scheduled"
    }
  ];
  
  const insertedBookings = await db.insert(schema.bookings).values(bookingsData).returning();
  console.log(`Inserted ${insertedBookings.length} bookings.`);
}

async function seedIncidents(environmentId: number) {
  console.log("Seeding incidents...");
  const existingIncidents = await db.query.incidents.findMany();
  
  if (existingIncidents.length > 0) {
    console.log(`Found ${existingIncidents.length} existing incidents. Skipping incident creation.`);
    return;
  }
  
  // Create a mix of resolved and open incidents
  const now = new Date();
  const incidentsData = [
    // Resolved incidents
    {
      environmentId,
      startTime: subDays(now, 15),
      endTime: subDays(now, 15, 2), // 2 hours later
      description: "Database connection failure",
      status: "resolved",
      recoveryTime: 120 // 2 hours in minutes
    },
    {
      environmentId,
      startTime: subDays(now, 10),
      endTime: subDays(now, 10, 1), // 1 hour later
      description: "Application server crash",
      status: "resolved",
      recoveryTime: 60 // 1 hour in minutes
    },
    {
      environmentId,
      startTime: subDays(now, 5),
      endTime: subDays(now, 5, 0.5), // 30 minutes later
      description: "Network connectivity issues",
      status: "resolved",
      recoveryTime: 30 // 30 minutes
    },
    
    // Open incident
    {
      environmentId,
      startTime: subDays(now, 1),
      description: "Memory leak in application",
      status: "open"
    }
  ];
  
  const insertedIncidents = await db.insert(schema.incidents).values(incidentsData).returning();
  console.log(`Inserted ${insertedIncidents.length} incidents.`);
}

// Run the seed function
seed();
