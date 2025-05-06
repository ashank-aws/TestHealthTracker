import { db } from "@db";
import { 
  environments, 
  metrics, 
  dailyStatus, 
  teams, 
  bookings, 
  incidents,
  users,
  funds,
  EnvironmentInsert,
  MetricInsert,
  DailyStatusInsert,
  TeamInsert,
  BookingInsert,
  IncidentInsert,
  InsertUser,
  FundInsert
} from "@shared/schema";
import { eq, and, or, lt, gte, lte, between, desc, sql, count } from "drizzle-orm";

// Environment operations
export const getAllEnvironments = async () => {
  return await db.query.environments.findMany({
    orderBy: environments.name,
  });
};

export const getEnvironmentById = async (id: number) => {
  return await db.query.environments.findFirst({
    where: eq(environments.id, id),
  });
};

export const createEnvironment = async (data: EnvironmentInsert) => {
  const [newEnvironment] = await db.insert(environments).values(data).returning();
  return newEnvironment;
};

// Metrics operations
export const getMetrics = async (
  environmentId?: number, 
  startDate?: Date, 
  endDate?: Date
) => {
  let query = db.select().from(metrics);

  if (environmentId) {
    query = query.where(eq(metrics.environmentId, environmentId));
  }

  if (startDate && endDate) {
    query = query.where(and(
      gte(metrics.date, startDate),
      lte(metrics.date, endDate)
    ));
  } else if (startDate) {
    query = query.where(gte(metrics.date, startDate));
  } else if (endDate) {
    query = query.where(lte(metrics.date, endDate));
  }

  query = query.orderBy(desc(metrics.date));
  return await query;
};

export const getLatestMetrics = async (environmentId?: number) => {
  if (environmentId) {
    // Get the latest metric for a specific environment
    const result = await db.query.metrics.findFirst({
      where: eq(metrics.environmentId, environmentId),
      orderBy: desc(metrics.date),
    });
    return result ? [result] : [];
  } else {
    // Get the latest metric for each environment
    // This is a bit more complex with Drizzle
    // We'll use a subquery to get the max date for each environment
    const subquery = db
      .select({
        environmentId: metrics.environmentId,
        maxDate: sql<string>`max(${metrics.date})`,
      })
      .from(metrics)
      .groupBy(metrics.environmentId)
      .as("latest");

    const result = await db
      .select()
      .from(metrics)
      .innerJoin(
        subquery,
        and(
          eq(metrics.environmentId, subquery.environmentId),
          eq(metrics.date, subquery.maxDate)
        )
      );

    // Map the result to just include the metrics
    return result.map((row) => row.metrics);
  }
};

export const createMetric = async (data: MetricInsert) => {
  const [newMetric] = await db.insert(metrics).values(data).returning();
  return newMetric;
};

// Daily status operations
export const getDailyStatus = async (
  environmentId?: number, 
  startDate?: Date, 
  endDate?: Date
) => {
  let query = db.select().from(dailyStatus);

  if (environmentId) {
    query = query.where(eq(dailyStatus.environmentId, environmentId));
  }

  if (startDate && endDate) {
    query = query.where(and(
      gte(dailyStatus.date, startDate),
      lte(dailyStatus.date, endDate)
    ));
  } else if (startDate) {
    query = query.where(gte(dailyStatus.date, startDate));
  } else if (endDate) {
    query = query.where(lte(dailyStatus.date, endDate));
  }

  query = query.orderBy(dailyStatus.date);
  return await query;
};

export const createDailyStatus = async (data: DailyStatusInsert) => {
  const [newStatus] = await db.insert(dailyStatus).values(data).returning();
  return newStatus;
};

// Team operations
export const getAllTeams = async () => {
  return await db.query.teams.findMany({
    orderBy: teams.name,
  });
};

export const createTeam = async (data: TeamInsert) => {
  const [newTeam] = await db.insert(teams).values(data).returning();
  return newTeam;
};

// Booking operations
export const getBookings = async (
  environmentId?: number, 
  teamId?: number, 
  status?: string,
  startDate?: Date, 
  endDate?: Date
) => {
  let query = db.select({
    booking: bookings,
    team: teams,
    environment: environments,
  }).from(bookings)
    .innerJoin(teams, eq(bookings.teamId, teams.id))
    .innerJoin(environments, eq(bookings.environmentId, environments.id));

  const conditions = [];

  if (environmentId) {
    conditions.push(eq(bookings.environmentId, environmentId));
  }

  if (teamId) {
    conditions.push(eq(bookings.teamId, teamId));
  }

  if (status) {
    conditions.push(eq(bookings.status, status));
  }

  if (startDate && endDate) {
    // Get all bookings that overlap with the provided date range
    conditions.push(or(
      and(
        lte(bookings.startDate, endDate),
        gte(bookings.endDate, startDate)
      ),
      and(
        gte(bookings.startDate, startDate),
        lte(bookings.endDate, endDate)
      )
    ));
  } else if (startDate) {
    conditions.push(gte(bookings.startDate, startDate));
  } else if (endDate) {
    conditions.push(lte(bookings.endDate, endDate));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  query = query.orderBy(desc(bookings.startDate));
  
  const result = await query;
  
  // Format the result to include nested objects
  return result.map(row => ({
    ...row.booking,
    team: row.team,
    environment: row.environment
  }));
};

export const getBookingById = async (id: number) => {
  const result = await db.select({
    booking: bookings,
    team: teams,
    environment: environments,
  }).from(bookings)
    .innerJoin(teams, eq(bookings.teamId, teams.id))
    .innerJoin(environments, eq(bookings.environmentId, environments.id))
    .where(eq(bookings.id, id));

  if (result.length === 0) {
    return null;
  }

  return {
    ...result[0].booking,
    team: result[0].team,
    environment: result[0].environment
  };
};

export const checkBookingConflicts = async (
  environmentId: number,
  startDate: Date,
  endDate: Date
) => {
  // Find any bookings that overlap with the requested time period
  const conflicts = await db.select().from(bookings)
    .where(and(
      eq(bookings.environmentId, environmentId),
      eq(bookings.status, 'scheduled'),
      or(
        // Case 1: New booking starts during an existing booking
        and(
          gte(startDate, bookings.startDate),
          lte(startDate, bookings.endDate)
        ),
        // Case 2: New booking ends during an existing booking
        and(
          gte(endDate, bookings.startDate),
          lte(endDate, bookings.endDate)
        ),
        // Case 3: New booking completely surrounds an existing booking
        and(
          lte(startDate, bookings.startDate),
          gte(endDate, bookings.endDate)
        )
      )
    ));

  return conflicts;
};

export const createBooking = async (data: BookingInsert) => {
  const [newBooking] = await db.insert(bookings).values(data).returning();
  return newBooking;
};

export const updateBooking = async (id: number, data: Partial<BookingInsert>) => {
  const [updatedBooking] = await db.update(bookings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning();
  return updatedBooking;
};

export const deleteBooking = async (id: number) => {
  await db.delete(bookings).where(eq(bookings.id, id));
};

// Incident operations
export const getIncidents = async (
  environmentId?: number, 
  status?: string,
  startDate?: Date, 
  endDate?: Date
) => {
  let query = db.select().from(incidents);

  const conditions = [];

  if (environmentId) {
    conditions.push(eq(incidents.environmentId, environmentId));
  }

  if (status) {
    conditions.push(eq(incidents.status, status));
  }

  if (startDate && endDate) {
    conditions.push(and(
      gte(incidents.startTime, startDate),
      lte(incidents.startTime, endDate)
    ));
  } else if (startDate) {
    conditions.push(gte(incidents.startTime, startDate));
  } else if (endDate) {
    conditions.push(lte(incidents.startTime, endDate));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  query = query.orderBy(desc(incidents.startTime));
  return await query;
};

export const getIncidentById = async (id: number) => {
  return await db.query.incidents.findFirst({
    where: eq(incidents.id, id),
  });
};

export const createIncident = async (data: IncidentInsert) => {
  const [newIncident] = await db.insert(incidents).values(data).returning();
  return newIncident;
};

export const resolveIncident = async (id: number, endTime: Date) => {
  // Get the incident first to calculate the recovery time
  const incident = await getIncidentById(id);
  if (!incident) {
    throw new Error("Incident not found");
  }

  // Calculate recovery time in minutes
  const startTime = new Date(incident.startTime);
  const recoveryTime = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

  // Update the incident
  const [resolvedIncident] = await db.update(incidents)
    .set({
      status: 'resolved',
      endTime,
      recoveryTime,
      updatedAt: new Date()
    })
    .where(eq(incidents.id, id))
    .returning();

  return resolvedIncident;
};

// Analytics operations
export const getEnvironmentHealthAnalytics = async (
  environmentId?: number, 
  startDate?: Date, 
  endDate?: Date
) => {
  // Get metrics data for the analysis
  const metricsData = await getMetrics(environmentId, startDate, endDate);
  
  if (metricsData.length === 0) {
    return {
      averageUptime: 0,
      averageMTTR: 0,
      averageMTBF: 0,
      averageResourceUtilization: 0,
      averageOccupancy: 0,
    };
  }

  // Calculate averages
  const averageUptime = metricsData.reduce((sum, metric) => sum + Number(metric.uptime), 0) / metricsData.length;
  const averageMTTR = metricsData.reduce((sum, metric) => sum + metric.mttr, 0) / metricsData.length;
  const averageMTBF = metricsData.reduce((sum, metric) => sum + metric.mtbf, 0) / metricsData.length;
  const averageResourceUtilization = metricsData.reduce((sum, metric) => sum + Number(metric.resourceUtilization), 0) / metricsData.length;
  const averageOccupancy = metricsData.reduce((sum, metric) => sum + Number(metric.occupancy), 0) / metricsData.length;

  return {
    averageUptime,
    averageMTTR,
    averageMTBF,
    averageResourceUtilization,
    averageOccupancy,
  };
};

export const getGreenDaysAnalytics = async (
  environmentId?: number, 
  startDate?: Date, 
  endDate?: Date
) => {
  // Get daily status data for the analysis
  const statusData = await getDailyStatus(environmentId, startDate, endDate);
  
  if (statusData.length === 0) {
    return {
      totalDays: 0,
      greenDays: 0,
      yellowDays: 0,
      redDays: 0,
      greenDaysPercentage: 0,
    };
  }

  // Count days by status
  const greenDays = statusData.filter(day => day.status === 'healthy').length;
  const yellowDays = statusData.filter(day => day.status === 'issues').length;
  const redDays = statusData.filter(day => day.status === 'down').length;
  const totalDays = statusData.length;

  return {
    totalDays,
    greenDays,
    yellowDays,
    redDays,
    greenDaysPercentage: (greenDays / totalDays) * 100,
  };
};

// User operations
export const getUserByUsername = async (username: string) => {
  return await db.query.users.findFirst({
    where: eq(users.username, username),
  });
};

export const createUser = async (data: InsertUser) => {
  const [newUser] = await db.insert(users).values(data).returning();
  return newUser;
};

// Fund operations
export const getAllFunds = async (status?: string) => {
  let query = db.select().from(funds);
  
  if (status) {
    query = query.where(eq(funds.status, status));
  }
  
  return await query.orderBy(funds.name);
};

export const getFundById = async (id: number) => {
  return await db.query.funds.findFirst({
    where: eq(funds.id, id),
  });
};

export const getFundByCode = async (code: string) => {
  return await db.query.funds.findFirst({
    where: eq(funds.code, code),
  });
};

export const createFund = async (data: FundInsert) => {
  const [newFund] = await db.insert(funds).values(data).returning();
  return newFund;
};

export const updateFund = async (id: number, data: Partial<FundInsert>) => {
  const [updatedFund] = await db.update(funds)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(funds.id, id))
    .returning();
  return updatedFund;
};

export const deleteFund = async (id: number) => {
  await db.delete(funds).where(eq(funds.id, id));
};

// Generate test funds
export const generateTestFunds = async (count: number = 100) => {
  const testFunds: FundInsert[] = [];
  
  for (let i = 1; i <= count; i++) {
    const fundCode = `TF${i.toString().padStart(4, '0')}`;
    
    // Check if fund code already exists
    const existingFund = await getFundByCode(fundCode);
    if (existingFund) continue;
    
    testFunds.push({
      name: `Test Fund ${i}`,
      code: fundCode,
      description: `Automatically generated test fund ${i}`,
      projects: `Project A, Project B, Project ${i}`,
      status: 'active'
    });
  }
  
  if (testFunds.length > 0) {
    return await db.insert(funds).values(testFunds).returning();
  }
  
  return [];
};

// Export all functions
export const storage = {
  getAllEnvironments,
  getEnvironmentById,
  createEnvironment,
  getMetrics,
  getLatestMetrics,
  createMetric,
  getDailyStatus,
  createDailyStatus,
  getAllTeams,
  createTeam,
  getBookings,
  getBookingById,
  checkBookingConflicts,
  createBooking,
  updateBooking,
  deleteBooking,
  getIncidents,
  getIncidentById,
  createIncident,
  resolveIncident,
  getEnvironmentHealthAnalytics,
  getGreenDaysAnalytics,
  getUserByUsername,
  createUser,
  getAllFunds,
  getFundById,
  getFundByCode,
  createFund,
  updateFund,
  deleteFund,
  generateTestFunds,
};
