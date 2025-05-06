import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  environmentsInsertSchema,
  metricsInsertSchema,
  dailyStatusInsertSchema,
  teamsInsertSchema,
  bookingsInsertSchema,
  incidentsInsertSchema,
  insertUserSchema,
  fundsInsertSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix for all routes
  const apiPrefix = "/api";

  // Environment routes
  app.get(`${apiPrefix}/environments`, async (req, res) => {
    try {
      const environments = await storage.getAllEnvironments();
      return res.status(200).json(environments);
    } catch (error) {
      console.error("Error fetching environments:", error);
      return res.status(500).json({ error: "Failed to fetch environments" });
    }
  });

  app.get(`${apiPrefix}/environments/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid environment ID" });
      }
      
      const environment = await storage.getEnvironmentById(id);
      if (!environment) {
        return res.status(404).json({ error: "Environment not found" });
      }
      
      return res.status(200).json(environment);
    } catch (error) {
      console.error("Error fetching environment:", error);
      return res.status(500).json({ error: "Failed to fetch environment" });
    }
  });

  app.post(`${apiPrefix}/environments`, async (req, res) => {
    try {
      const validatedData = environmentsInsertSchema.parse(req.body);
      const newEnvironment = await storage.createEnvironment(validatedData);
      return res.status(201).json(newEnvironment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating environment:", error);
      return res.status(500).json({ error: "Failed to create environment" });
    }
  });

  // Metrics routes
  app.get(`${apiPrefix}/metrics`, async (req, res) => {
    try {
      const environmentId = req.query.environmentId ? parseInt(req.query.environmentId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const metrics = await storage.getMetrics(environmentId, startDate, endDate);
      return res.status(200).json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      return res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  app.get(`${apiPrefix}/metrics/latest`, async (req, res) => {
    try {
      const environmentId = req.query.environmentId ? parseInt(req.query.environmentId as string) : undefined;
      
      const latestMetrics = await storage.getLatestMetrics(environmentId);
      return res.status(200).json(latestMetrics);
    } catch (error) {
      console.error("Error fetching latest metrics:", error);
      return res.status(500).json({ error: "Failed to fetch latest metrics" });
    }
  });

  app.post(`${apiPrefix}/metrics`, async (req, res) => {
    try {
      const validatedData = metricsInsertSchema.parse(req.body);
      const newMetric = await storage.createMetric(validatedData);
      return res.status(201).json(newMetric);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating metric:", error);
      return res.status(500).json({ error: "Failed to create metric" });
    }
  });

  // Daily status routes
  app.get(`${apiPrefix}/daily-status`, async (req, res) => {
    try {
      const environmentId = req.query.environmentId ? parseInt(req.query.environmentId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const statusData = await storage.getDailyStatus(environmentId, startDate, endDate);
      return res.status(200).json(statusData);
    } catch (error) {
      console.error("Error fetching daily status:", error);
      return res.status(500).json({ error: "Failed to fetch daily status" });
    }
  });

  app.post(`${apiPrefix}/daily-status`, async (req, res) => {
    try {
      const validatedData = dailyStatusInsertSchema.parse(req.body);
      const newStatus = await storage.createDailyStatus(validatedData);
      return res.status(201).json(newStatus);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating daily status:", error);
      return res.status(500).json({ error: "Failed to create daily status" });
    }
  });

  // Team routes
  app.get(`${apiPrefix}/teams`, async (req, res) => {
    try {
      const teams = await storage.getAllTeams();
      return res.status(200).json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      return res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.post(`${apiPrefix}/teams`, async (req, res) => {
    try {
      const validatedData = teamsInsertSchema.parse(req.body);
      const newTeam = await storage.createTeam(validatedData);
      return res.status(201).json(newTeam);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating team:", error);
      return res.status(500).json({ error: "Failed to create team" });
    }
  });

  // Booking routes
  app.get(`${apiPrefix}/bookings`, async (req, res) => {
    try {
      const environmentId = req.query.environmentId ? parseInt(req.query.environmentId as string) : undefined;
      const teamId = req.query.teamId ? parseInt(req.query.teamId as string) : undefined;
      const status = req.query.status as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const bookings = await storage.getBookings(environmentId, teamId, status, startDate, endDate);
      return res.status(200).json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.post(`${apiPrefix}/bookings`, async (req, res) => {
    try {
      const validatedData = bookingsInsertSchema.parse(req.body);
      
      // Check for booking conflicts
      const conflicts = await storage.checkBookingConflicts(
        validatedData.environmentId,
        validatedData.startDate,
        validatedData.endDate
      );
      
      if (conflicts.length > 0) {
        return res.status(409).json({ 
          error: "Booking conflict detected", 
          conflicts 
        });
      }
      
      const newBooking = await storage.createBooking(validatedData);
      return res.status(201).json(newBooking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating booking:", error);
      return res.status(500).json({ error: "Failed to create booking" });
    }
  });

  app.patch(`${apiPrefix}/bookings/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid booking ID" });
      }
      
      const booking = await storage.getBookingById(id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      // Only allow updating status or configuration
      const updateData = z.object({
        status: z.enum(['scheduled', 'active', 'completed', 'cancelled']).optional(),
        configuration: z.string().optional(),
        purpose: z.string().optional(),
      }).parse(req.body);
      
      const updatedBooking = await storage.updateBooking(id, updateData);
      return res.status(200).json(updatedBooking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating booking:", error);
      return res.status(500).json({ error: "Failed to update booking" });
    }
  });

  app.delete(`${apiPrefix}/bookings/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid booking ID" });
      }
      
      const booking = await storage.getBookingById(id);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      await storage.deleteBooking(id);
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting booking:", error);
      return res.status(500).json({ error: "Failed to delete booking" });
    }
  });

  // Incident routes
  app.get(`${apiPrefix}/incidents`, async (req, res) => {
    try {
      const environmentId = req.query.environmentId ? parseInt(req.query.environmentId as string) : undefined;
      const status = req.query.status as string | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const incidents = await storage.getIncidents(environmentId, status, startDate, endDate);
      return res.status(200).json(incidents);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      return res.status(500).json({ error: "Failed to fetch incidents" });
    }
  });

  app.post(`${apiPrefix}/incidents`, async (req, res) => {
    try {
      const validatedData = incidentsInsertSchema.parse(req.body);
      const newIncident = await storage.createIncident(validatedData);
      return res.status(201).json(newIncident);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating incident:", error);
      return res.status(500).json({ error: "Failed to create incident" });
    }
  });

  app.patch(`${apiPrefix}/incidents/:id/resolve`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid incident ID" });
      }
      
      const incident = await storage.getIncidentById(id);
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }
      
      if (incident.status === 'resolved') {
        return res.status(400).json({ error: "Incident is already resolved" });
      }
      
      const endTime = new Date();
      const resolvedIncident = await storage.resolveIncident(id, endTime);
      return res.status(200).json(resolvedIncident);
    } catch (error) {
      console.error("Error resolving incident:", error);
      return res.status(500).json({ error: "Failed to resolve incident" });
    }
  });

  // Analytics routes
  app.get(`${apiPrefix}/analytics/environment-health`, async (req, res) => {
    try {
      const environmentId = req.query.environmentId ? parseInt(req.query.environmentId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const healthData = await storage.getEnvironmentHealthAnalytics(environmentId, startDate, endDate);
      return res.status(200).json(healthData);
    } catch (error) {
      console.error("Error fetching environment health analytics:", error);
      return res.status(500).json({ error: "Failed to fetch environment health analytics" });
    }
  });

  app.get(`${apiPrefix}/analytics/green-days`, async (req, res) => {
    try {
      const environmentId = req.query.environmentId ? parseInt(req.query.environmentId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      
      const greenDaysData = await storage.getGreenDaysAnalytics(environmentId, startDate, endDate);
      return res.status(200).json(greenDaysData);
    } catch (error) {
      console.error("Error fetching green days analytics:", error);
      return res.status(500).json({ error: "Failed to fetch green days analytics" });
    }
  });

  // User routes (simplified, using the existing user table)
  app.post(`${apiPrefix}/users`, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }
      
      const newUser = await storage.createUser(validatedData);
      // Don't return the password in the response
      const { password, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating user:", error);
      return res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.post(`${apiPrefix}/login`, async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // In a real app, you would use proper authentication with tokens
      // For this demo, we'll just return the user ID
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Error logging in:", error);
      return res.status(500).json({ error: "Failed to log in" });
    }
  });

  // Fund routes
  app.get(`${apiPrefix}/funds`, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const funds = await storage.getAllFunds(status);
      return res.status(200).json(funds);
    } catch (error) {
      console.error("Error fetching funds:", error);
      return res.status(500).json({ error: "Failed to fetch funds" });
    }
  });

  app.get(`${apiPrefix}/funds/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid fund ID" });
      }
      
      const fund = await storage.getFundById(id);
      if (!fund) {
        return res.status(404).json({ error: "Fund not found" });
      }
      
      return res.status(200).json(fund);
    } catch (error) {
      console.error("Error fetching fund:", error);
      return res.status(500).json({ error: "Failed to fetch fund" });
    }
  });

  app.post(`${apiPrefix}/funds`, async (req, res) => {
    try {
      const validatedData = fundsInsertSchema.parse(req.body);
      const newFund = await storage.createFund(validatedData);
      return res.status(201).json(newFund);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating fund:", error);
      return res.status(500).json({ error: "Failed to create fund" });
    }
  });

  app.patch(`${apiPrefix}/funds/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid fund ID" });
      }
      
      const fund = await storage.getFundById(id);
      if (!fund) {
        return res.status(404).json({ error: "Fund not found" });
      }
      
      // Only allow updating certain fields
      const updateData = z.object({
        name: z.string().min(2).optional(),
        description: z.string().optional(),
        projects: z.string().optional(),
        status: z.enum(['active', 'inactive']).optional(),
      }).parse(req.body);
      
      const updatedFund = await storage.updateFund(id, updateData);
      return res.status(200).json(updatedFund);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error updating fund:", error);
      return res.status(500).json({ error: "Failed to update fund" });
    }
  });

  app.delete(`${apiPrefix}/funds/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid fund ID" });
      }
      
      const fund = await storage.getFundById(id);
      if (!fund) {
        return res.status(404).json({ error: "Fund not found" });
      }
      
      await storage.deleteFund(id);
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting fund:", error);
      return res.status(500).json({ error: "Failed to delete fund" });
    }
  });

  // Generate test funds endpoint
  app.post(`${apiPrefix}/funds/generate-test-data`, async (req, res) => {
    try {
      const count = req.query.count ? parseInt(req.query.count as string) : 100;
      
      const generatedFunds = await storage.generateTestFunds(count);
      return res.status(201).json({
        message: `Successfully generated ${generatedFunds.length} test funds`,
        count: generatedFunds.length
      });
    } catch (error) {
      console.error("Error generating test funds:", error);
      return res.status(500).json({ error: "Failed to generate test funds" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
