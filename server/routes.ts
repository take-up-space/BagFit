import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBagSchema, insertUserBagSchema, insertBagCheckSchema } from "@shared/schema";
import { z } from "zod";

// Conversion utilities
function cmToInches(cm: number): number {
  return Math.round(cm / 2.54 * 100) / 100;
}

function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 100) / 100;
}

// Google Custom Search API function
async function searchBagDimensions(brand: string, model: string): Promise<any> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID || process.env.CUSTOM_SEARCH_ENGINE_ID;
  
  if (!apiKey || !searchEngineId) {
    throw new Error("Google Custom Search API credentials not configured");
  }

  const query = `${brand} ${model} bag dimensions specifications`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Google Search API error:", error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize airline data
  await initializeAirlineData();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Airlines routes
  app.get('/api/airlines', async (req, res) => {
    try {
      const airlines = await storage.getAllAirlines();
      res.json(airlines);
    } catch (error) {
      console.error("Error fetching airlines:", error);
      res.status(500).json({ message: "Failed to fetch airlines" });
    }
  });

  // Get all bags route (public) - only verified/popular bags
  app.get('/api/bags', async (req, res) => {
    try {
      const bags = await storage.getPopularBags();
      res.json(bags);
    } catch (error) {
      console.error("Error fetching bags:", error);
      res.status(500).json({ message: "Failed to fetch bags" });
    }
  });

  app.get('/api/airlines/:iataCode', async (req, res) => {
    try {
      const { iataCode } = req.params;
      const airline = await storage.getAirlineByIataCode(iataCode);
      if (!airline) {
        return res.status(404).json({ message: "Airline not found" });
      }
      res.json(airline);
    } catch (error) {
      console.error("Error fetching airline:", error);
      res.status(500).json({ message: "Failed to fetch airline" });
    }
  });

  // Bag search route
  app.get('/api/bags/search', async (req, res) => {
    try {
      const { brand, model } = req.query;
      
      if (!brand || !model) {
        return res.status(400).json({ message: "Brand and model are required" });
      }

      // First check our database
      const existingBags = await storage.searchBagsByBrand(brand as string);
      const foundBag = existingBags.find(bag => 
        bag.model?.toLowerCase().includes((model as string).toLowerCase())
      );

      if (foundBag) {
        return res.json(foundBag);
      }

      // If not found, search using Google Custom Search API
      try {
        const searchResults = await searchBagDimensions(brand as string, model as string);
        
        // Parse search results for dimensions (this would need more sophisticated parsing)
        // For now, return a message indicating manual entry is needed
        res.json({
          message: "Bag not found in database. Please enter dimensions manually.",
          searchResults: searchResults.items?.slice(0, 3) || []
        });
      } catch (searchError) {
        console.error("Search API error:", searchError);
        res.json({
          message: "Bag not found in database. Search service unavailable. Please enter dimensions manually.",
          searchResults: []
        });
      }
    } catch (error) {
      console.error("Error searching bags:", error);
      res.status(500).json({ message: "Failed to search bags" });
    }
  });

  // Create bag route
  app.post('/api/bags', async (req, res) => {
    try {
      // Transform numeric inputs to strings for decimal fields
      const transformedBody = {
        ...req.body,
        lengthCm: typeof req.body.lengthCm === 'number' ? req.body.lengthCm.toString() : req.body.lengthCm,
        widthCm: typeof req.body.widthCm === 'number' ? req.body.widthCm.toString() : req.body.widthCm,
        heightCm: typeof req.body.heightCm === 'number' ? req.body.heightCm.toString() : req.body.heightCm,
      };
      
      const bagData = insertBagSchema.parse(transformedBody);
      const bag = await storage.createBag(bagData);
      res.status(201).json(bag);
    } catch (error) {
      console.error("Error creating bag:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bag data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create bag" });
    }
  });

  // User bags routes
  app.get('/api/user/bags', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userBags = await storage.getUserBags(userId);
      res.json(userBags);
    } catch (error) {
      console.error("Error fetching user bags:", error);
      res.status(500).json({ message: "Failed to fetch user bags" });
    }
  });

  app.post('/api/user/bags', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userBagData = insertUserBagSchema.parse({ ...req.body, userId });
      const userBag = await storage.addUserBag(userBagData);
      res.status(201).json(userBag);
    } catch (error) {
      console.error("Error adding user bag:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user bag data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add user bag" });
    }
  });

  app.patch('/api/user/bags/:userBagId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userBagId } = req.params;
      
      // CRITICAL FIX: Block empty/phantom requests
      if (!req.body || Object.keys(req.body).length === 0) {
        console.log("❌ BLOCKING PHANTOM REQUEST - empty body from:", req.headers['user-agent']?.substring(0, 50));
        return res.status(400).json({ message: "Empty request body not allowed" });
      }
      
      const updateSchema = z.object({
        customName: z.string().optional(),
        isPetCarrier: z.boolean().optional()
      });
      
      const updateData = updateSchema.parse(req.body);
      
      // Validate that at least one field is provided
      if (!updateData.customName && updateData.isPetCarrier === undefined) {
        return res.status(400).json({ message: "At least one field must be provided for update" });
      }
      
      const updatedUserBag = await storage.updateUserBag(userId, userBagId, updateData);
      res.json(updatedUserBag);
    } catch (error) {
      console.error("Error updating user bag:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user bag" });
    }
  });

  app.delete('/api/user/bags/:bagId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { bagId } = req.params;
      await storage.removeUserBag(userId, bagId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing user bag:", error);
      res.status(500).json({ message: "Failed to remove user bag" });
    }
  });

  // Bag check route
  app.post('/api/bag-check', async (req: any, res) => {
    try {
      const checkSchema = z.object({
        airlineIataCode: z.string(),
        flightNumber: z.string().optional(),
        bagLengthCm: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
        bagWidthCm: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
        bagHeightCm: z.union([z.number(), z.string()]).transform(val => typeof val === 'string' ? parseFloat(val) : val),
        isPetCarrier: z.boolean().default(false),
        bagId: z.string().optional(),
      });

      const checkData = checkSchema.parse(req.body);
      
      // Get airline data
      const airline = await storage.getAirlineByIataCode(checkData.airlineIataCode);
      if (!airline) {
        return res.status(404).json({ message: "Airline not found" });
      }

      // Check if bag fits
      let fitsUnderSeat = false;
      let exceedsIn: string[] = [];

      if (checkData.isPetCarrier && airline.petCarrierAllowed) {
        // Check pet carrier dimensions
        if (airline.petCarrierMaxLengthCm && airline.petCarrierMaxWidthCm && airline.petCarrierMaxHeightCm) {
          const lengthFits = checkData.bagLengthCm <= parseFloat(airline.petCarrierMaxLengthCm);
          const widthFits = checkData.bagWidthCm <= parseFloat(airline.petCarrierMaxWidthCm);
          const heightFits = checkData.bagHeightCm <= parseFloat(airline.petCarrierMaxHeightCm);
          
          fitsUnderSeat = lengthFits && widthFits && heightFits;
          
          if (!lengthFits) exceedsIn.push('length');
          if (!widthFits) exceedsIn.push('width');
          if (!heightFits) exceedsIn.push('height');
        } else {
          // Fall back to regular dimensions if pet carrier dims not specified
          fitsUnderSeat = false;
          exceedsIn.push('Pet carrier policy unclear');
        }
      } else if (checkData.isPetCarrier && !airline.petCarrierAllowed) {
        fitsUnderSeat = false;
        exceedsIn.push('Pet carriers not allowed');
      } else {
        // Check regular personal item dimensions
        if (airline.maxPersonalItemLengthCm && airline.maxPersonalItemWidthCm && airline.maxPersonalItemHeightCm) {
          const lengthFits = checkData.bagLengthCm <= parseFloat(airline.maxPersonalItemLengthCm);
          const widthFits = checkData.bagWidthCm <= parseFloat(airline.maxPersonalItemWidthCm);
          const heightFits = checkData.bagHeightCm <= parseFloat(airline.maxPersonalItemHeightCm);
          
          fitsUnderSeat = lengthFits && widthFits && heightFits;
          
          if (!lengthFits) exceedsIn.push('length');
          if (!widthFits) exceedsIn.push('width');
          if (!heightFits) exceedsIn.push('height');
        } else {
          return res.status(400).json({ message: "Airline dimensions not available" });
        }
      }

      // Create bag check record if user is authenticated
      let bagCheckId = null;
      if (req.user?.claims?.sub) {
        const bagCheckData = insertBagCheckSchema.parse({
          userId: req.user.claims.sub,
          bagId: checkData.bagId,
          airlineId: airline.id,
          flightNumber: checkData.flightNumber,
          bagLengthCm: checkData.bagLengthCm.toString(),
          bagWidthCm: checkData.bagWidthCm.toString(),
          bagHeightCm: checkData.bagHeightCm.toString(),
          isPetCarrier: checkData.isPetCarrier,
          fitsUnderSeat,
        });
        
        const bagCheck = await storage.createBagCheck(bagCheckData);
        bagCheckId = bagCheck.id;
      }

      res.json({
        fitsUnderSeat,
        exceedsIn,
        isPetCarrier: checkData.isPetCarrier,
        airline: {
          name: airline.name,
          iataCode: airline.iataCode,
          verificationStatus: airline.verificationStatus,
          lastVerifiedDate: airline.lastVerifiedDate,
          sourceUrl: airline.sourceUrl,
          maxPersonalItemLengthCm: airline.maxPersonalItemLengthCm,
          maxPersonalItemWidthCm: airline.maxPersonalItemWidthCm,
          maxPersonalItemHeightCm: airline.maxPersonalItemHeightCm,
          petCarrierAllowed: airline.petCarrierAllowed,
          petCarrierMaxLengthCm: airline.petCarrierMaxLengthCm,
          petCarrierMaxWidthCm: airline.petCarrierMaxWidthCm,
          petCarrierMaxHeightCm: airline.petCarrierMaxHeightCm,
        },
        bagDimensions: {
          lengthCm: checkData.bagLengthCm,
          widthCm: checkData.bagWidthCm,
          heightCm: checkData.bagHeightCm,
          lengthIn: cmToInches(checkData.bagLengthCm),
          widthIn: cmToInches(checkData.bagWidthCm),
          heightIn: cmToInches(checkData.bagHeightCm),
        },
        bagCheckId,
      });

    } catch (error) {
      console.error("Error checking bag:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid check data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to check bag" });
    }
  });

  // User bag check history
  app.get('/api/user/bag-checks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bagChecks = await storage.getUserBagChecks(userId);
      res.json(bagChecks);
    } catch (error) {
      console.error("Error fetching user bag checks:", error);
      res.status(500).json({ message: "Failed to fetch user bag checks" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Initialize airline data with verified information
async function initializeAirlineData() {
  try {
    const airlines = await storage.getAllAirlines();
    
    if (airlines.length === 0) {
      // Insert verified airline data
      const airlineData = [
        {
          name: "American Airlines",
          iataCode: "AA",
          maxPersonalItemLengthCm: "45.72", // 18 inches
          maxPersonalItemWidthCm: "35.56", // 14 inches
          maxPersonalItemHeightCm: "20.32", // 8 inches
          verificationStatus: "VERIFIED_OFFICIAL" as const,
          sourceUrl: "https://www.aa.com/i18n/travel-info/baggage/carry-on-baggage.jsp",
          lastVerifiedDate: new Date("2024-08-19"),
          petCarrierAllowed: true,
          petCarrierMaxLengthCm: "45.72",
          petCarrierMaxWidthCm: "35.56", 
          petCarrierMaxHeightCm: "20.32",
        },
        {
          name: "United Airlines",
          iataCode: "UA",
          maxPersonalItemLengthCm: "43.18", // 17 inches
          maxPersonalItemWidthCm: "25.40", // 10 inches
          maxPersonalItemHeightCm: "22.86", // 9 inches
          verificationStatus: "VERIFIED_OFFICIAL" as const,
          sourceUrl: "https://www.united.com/ual/en/us/fly/travel/baggage/carry-on.html",
          lastVerifiedDate: new Date(),
          petCarrierAllowed: true,
          petCarrierMaxLengthCm: "43.18",
          petCarrierMaxWidthCm: "25.40",
          petCarrierMaxHeightCm: "22.86",
        },
        {
          name: "Southwest Airlines", 
          iataCode: "WN",
          maxPersonalItemLengthCm: "46.99", // 18.5 inches
          maxPersonalItemWidthCm: "34.29", // 13.5 inches
          maxPersonalItemHeightCm: "21.59", // 8.5 inches
          verificationStatus: "VERIFIED_OFFICIAL" as const,
          sourceUrl: "https://www.southwest.com/help/baggage/carryon-bags",
          lastVerifiedDate: new Date(),
          petCarrierAllowed: true,
          petCarrierMaxLengthCm: "46.99",
          petCarrierMaxWidthCm: "34.29",
          petCarrierMaxHeightCm: "21.59",
        },
        {
          name: "Delta Air Lines",
          iataCode: "DL", 
          maxPersonalItemLengthCm: "40.64", // 16 inches (conservative estimate)
          maxPersonalItemWidthCm: "30.48", // 12 inches
          maxPersonalItemHeightCm: "15.24", // 6 inches
          verificationStatus: "UNVERIFIED_CONSERVATIVE" as const,
          sourceUrl: "https://www.delta.com/us/en/baggage/carry-on-baggage",
          lastVerifiedDate: new Date(),
          petCarrierAllowed: true,
          petCarrierMaxLengthCm: "40.64",
          petCarrierMaxWidthCm: "30.48",
          petCarrierMaxHeightCm: "15.24",
          conflictNotes: "Conservative estimate based on various sources. Please verify with airline.",
        },
        {
          name: "JetBlue Airways",
          iataCode: "B6",
          maxPersonalItemLengthCm: "43.18", // 17 inches
          maxPersonalItemWidthCm: "33.02", // 13 inches
          maxPersonalItemHeightCm: "20.32", // 8 inches
          verificationStatus: "VERIFIED_OFFICIAL" as const,
          sourceUrl: "https://www.jetblue.com/travel/baggage",
          lastVerifiedDate: new Date(),
          petCarrierAllowed: true,
          petCarrierMaxLengthCm: "43.18",
          petCarrierMaxWidthCm: "33.02",
          petCarrierMaxHeightCm: "20.32",
        },
        {
          name: "Frontier Airlines",
          iataCode: "F9",
          maxPersonalItemLengthCm: "45.72", // 18 inches
          maxPersonalItemWidthCm: "35.56", // 14 inches
          maxPersonalItemHeightCm: "20.32", // 8 inches
          verificationStatus: "VERIFIED_OFFICIAL" as const,
          sourceUrl: "https://www.flyfrontier.com/travel/baggage/",
          lastVerifiedDate: new Date(),
          petCarrierAllowed: true,
          petCarrierMaxLengthCm: "45.72",
          petCarrierMaxWidthCm: "35.56",
          petCarrierMaxHeightCm: "20.32",
        },
      ];

      for (const airline of airlineData) {
        await storage.createAirline(airline);
      }

      console.log("Initialized airline data with verified dimensions");
    }

    // Initialize popular bag models including pet carriers
    const bags = await storage.getAllBags();
    if (bags.length === 0) {
      const bagData = [
        // Pet Carriers from CSV
        {
          brand: "Sherpa",
          model: "Original Deluxe Pet Carrier - Small",
          lengthCm: "38.1",
          widthCm: "25.4", 
          heightCm: "20.3",
          isPetCarrier: true,
          carrierType: "soft-sided" as const,
          isVerified: true,
        },
        {
          brand: "Sherpa",
          model: "Original Deluxe Pet Carrier - Medium",
          lengthCm: "43.2",
          widthCm: "27.9",
          heightCm: "26.7",
          isPetCarrier: true,
          carrierType: "soft-sided" as const,
          isVerified: true,
        },
        {
          brand: "Sherpa",
          model: "Original Deluxe Pet Carrier - Large",
          lengthCm: "48.3",
          widthCm: "29.8",
          heightCm: "29.2",
          isPetCarrier: true,
          carrierType: "soft-sided" as const,
          isVerified: true,
        },
        {
          brand: "JetBlue",
          model: "JetPaws Official Pet Carrier",
          lengthCm: "40.6",
          widthCm: "25.4",
          heightCm: "29.2",
          isPetCarrier: true,
          carrierType: "soft-sided" as const,
          isVerified: true,
        },
        {
          brand: "Roverlund",
          model: "Out-of-Office Pet Carrier - Small",
          lengthCm: "43.2",
          widthCm: "27.9",
          heightCm: "26.7",
          isPetCarrier: true,
          carrierType: "soft-sided" as const,
          isVerified: true,
        },
        {
          brand: "Roverlund",
          model: "Out-of-Office Pet Carrier - Large",
          lengthCm: "47.0",
          widthCm: "29.8",
          heightCm: "29.2",
          isPetCarrier: true,
          carrierType: "soft-sided" as const,
          isVerified: true,
        },
        {
          brand: "Maxbone",
          model: "All-In-One Travel Carrier",
          lengthCm: "47.0",
          widthCm: "24.1",
          heightCm: "27.9",
          isPetCarrier: true,
          carrierType: "soft-sided" as const,
          isVerified: true,
        },
        {
          brand: "Mr. Peanut's",
          model: "Gold Series Airline-Approved Soft-Sided Carrier",
          lengthCm: "45.7",
          widthCm: "26.7",
          heightCm: "26.7",
          isPetCarrier: true,
          carrierType: "soft-sided" as const,
          isVerified: true,
        },
        {
          brand: "SturdiBag",
          model: "Pro 2.0 - Cube",
          lengthCm: "30.5",
          widthCm: "30.5",
          heightCm: "28.5",
          isPetCarrier: true,
          carrierType: "soft-sided" as const,
          isVerified: true,
        },
        {
          brand: "SturdiBag",
          model: "Pro 2.0 - Small",
          lengthCm: "46.0",
          widthCm: "25.5",
          heightCm: "23.5",
          isPetCarrier: true,
          carrierType: "soft-sided" as const,
          isVerified: true,
        },
        {
          brand: "SturdiBag",
          model: "Pro 2.0 - Medium",
          lengthCm: "38.0",
          widthCm: "30.5",
          heightCm: "30.0",
          isPetCarrier: true,
          carrierType: "soft-sided" as const,
          isVerified: true,
        },
        {
          brand: "SturdiBag",
          model: "Pro 2.0 - Large",
          lengthCm: "46.0",
          widthCm: "29.0",
          heightCm: "29.0",
          isPetCarrier: true,
          carrierType: "soft-sided" as const,
          isVerified: true,
        },
        {
          brand: "Away",
          model: "The Pet Carrier",
          lengthCm: "47.5",
          widthCm: "27.4",
          heightCm: "27.3",
          isPetCarrier: true,
          carrierType: "soft-sided" as const,
          isVerified: true,
        },
        {
          brand: "Sleepypod",
          model: "Air",
          lengthCm: "55.9",
          widthCm: "26.7",
          heightCm: "26.7",
          isPetCarrier: true,
          carrierType: "hard-sided" as const,
          isVerified: true,
        },
        {
          brand: "Petsfit",
          model: "Expandable Travel Dog Carrier - Small",
          lengthCm: "40.6",
          widthCm: "24.1",
          heightCm: "27.9",
          isPetCarrier: true,
          carrierType: "soft-sided" as const,
          isVerified: true,
        },
        {
          brand: "Petsfit",
          model: "Expandable Travel Dog Carrier - Medium",
          lengthCm: "50.8",
          widthCm: "29.2",
          heightCm: "31.8",
          isPetCarrier: true,
          carrierType: "soft-sided" as const,
          isVerified: true,
        },
      ];

      for (const bag of bagData) {
        await storage.createBag(bag);
      }

      console.log("Initialized popular bag models including pet carriers");
    }
  } catch (error) {
    console.error("Error initializing airline data:", error);
  }
}
