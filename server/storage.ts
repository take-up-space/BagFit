import {
  users,
  airlines,
  bags,
  userBags,
  bagChecks,
  type User,
  type UpsertUser,
  type Airline,
  type Bag,
  type UserBag,
  type BagCheck,
  type InsertAirline,
  type InsertBag,
  type InsertUserBag,
  type InsertBagCheck,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, ne } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser & { id: string }): Promise<User>;
  
  // Airline operations
  getAllAirlines(): Promise<Airline[]>;
  getAirlineByIataCode(iataCode: string): Promise<Airline | undefined>;
  createAirline(airline: InsertAirline): Promise<Airline>;
  updateAirline(id: string, airline: Partial<InsertAirline>): Promise<Airline>;
  
  // Bag operations
  getAllBags(): Promise<Bag[]>;
  getPopularBags(): Promise<Bag[]>; // Only pre-loaded popular bags, not user-created
  getBagById(id: string): Promise<Bag | undefined>;
  searchBagsByBrand(brand: string): Promise<Bag[]>;
  createBag(bag: InsertBag): Promise<Bag>;
  
  // User bag operations
  getUserBags(userId: string): Promise<(UserBag & { bag: Bag })[]>;
  addUserBag(userBag: InsertUserBag): Promise<UserBag>;
  updateUserBag(userId: string, userBagId: string, updateData: { customName: string }): Promise<UserBag>;
  removeUserBag(userId: string, bagId: string): Promise<void>;
  
  // Bag check operations
  createBagCheck(bagCheck: InsertBagCheck): Promise<BagCheck>;
  getUserBagChecks(userId: string): Promise<(BagCheck & { airline: Airline; bag?: Bag })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser & { id: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Airline operations
  async getAllAirlines(): Promise<Airline[]> {
    return await db.select().from(airlines).orderBy(airlines.name);
  }

  async getAirlineByIataCode(iataCode: string): Promise<Airline | undefined> {
    const [airline] = await db
      .select()
      .from(airlines)
      .where(eq(airlines.iataCode, iataCode.toUpperCase()));
    return airline;
  }

  async createAirline(airline: InsertAirline): Promise<Airline> {
    const [newAirline] = await db
      .insert(airlines)
      .values(airline)
      .returning();
    return newAirline;
  }

  async updateAirline(id: string, airlineData: Partial<InsertAirline>): Promise<Airline> {
    const [updatedAirline] = await db
      .update(airlines)
      .set({ ...airlineData, updatedAt: new Date() })
      .where(eq(airlines.id, id))
      .returning();
    return updatedAirline;
  }

  // Bag operations
  async getAllBags(): Promise<Bag[]> {
    return await db.select().from(bags).orderBy(bags.brand, bags.model);
  }

  async getPopularBags(): Promise<Bag[]> {
    // Only return verified/popular bags that were pre-loaded in the system
    // Filter out any user-created bags (typically have "Custom" brand or were created recently)
    return await db.select().from(bags)
      .where(and(
        ne(bags.brand, 'Custom Manual Entry'),
        ne(bags.brand, 'Custom'),
        eq(bags.isVerified, true)
      ))
      .orderBy(bags.brand, bags.model);
  }

  async getBagById(id: string): Promise<Bag | undefined> {
    const [bag] = await db.select().from(bags).where(eq(bags.id, id));
    return bag;
  }

  async searchBagsByBrand(brand: string): Promise<Bag[]> {
    return await db
      .select()
      .from(bags)
      .where(eq(bags.brand, brand))
      .orderBy(bags.model);
  }

  async createBag(bag: InsertBag): Promise<Bag> {
    const [newBag] = await db
      .insert(bags)
      .values(bag)
      .returning();
    return newBag;
  }

  // User bag operations
  async getUserBags(userId: string): Promise<(UserBag & { bag: Bag })[]> {
    return await db
      .select({
        id: userBags.id,
        userId: userBags.userId,
        bagId: userBags.bagId,
        customName: userBags.customName,
        createdAt: userBags.createdAt,
        bag: bags,
      })
      .from(userBags)
      .innerJoin(bags, eq(userBags.bagId, bags.id))
      .where(eq(userBags.userId, userId))
      .orderBy(desc(userBags.createdAt));
  }

  async addUserBag(userBag: InsertUserBag): Promise<UserBag> {
    const [newUserBag] = await db
      .insert(userBags)
      .values(userBag)
      .returning();
    return newUserBag;
  }

  async updateUserBag(userId: string, userBagId: string, updateData: { customName?: string; isPetCarrier?: boolean }): Promise<UserBag> {
    // Get the current user bag first
    const [currentUserBag] = await db
      .select()
      .from(userBags)
      .where(and(eq(userBags.userId, userId), eq(userBags.id, userBagId)))
      .limit(1);

    if (!currentUserBag) {
      throw new Error("User bag not found");
    }

    // Build the update object conditionally
    const userBagUpdate: any = {};
    if (updateData.customName !== undefined) {
      userBagUpdate.customName = updateData.customName;
    }

    // Update the user bag if there are changes
    let updatedUserBag = currentUserBag;
    if (Object.keys(userBagUpdate).length > 0) {
      [updatedUserBag] = await db
        .update(userBags)
        .set(userBagUpdate)
        .where(and(eq(userBags.userId, userId), eq(userBags.id, userBagId)))
        .returning();
    }

    // If isPetCarrier is provided, also update the underlying bag record
    if (updateData.isPetCarrier !== undefined) {
      await db
        .update(bags)
        .set({
          isPetCarrier: updateData.isPetCarrier
        })
        .where(eq(bags.id, updatedUserBag.bagId));
    }

    return updatedUserBag;
  }

  async removeUserBag(userId: string, bagId: string): Promise<void> {
    await db
      .delete(userBags)
      .where(and(eq(userBags.userId, userId), eq(userBags.bagId, bagId)));
  }

  // Bag check operations
  async createBagCheck(bagCheck: InsertBagCheck): Promise<BagCheck> {
    const [newBagCheck] = await db
      .insert(bagChecks)
      .values(bagCheck)
      .returning();
    return newBagCheck;
  }

  async getUserBagChecks(userId: string): Promise<(BagCheck & { airline: Airline; bag?: Bag })[]> {
    return await db
      .select({
        id: bagChecks.id,
        userId: bagChecks.userId,
        bagId: bagChecks.bagId,
        airlineId: bagChecks.airlineId,
        flightNumber: bagChecks.flightNumber,
        bagLengthCm: bagChecks.bagLengthCm,
        bagWidthCm: bagChecks.bagWidthCm,
        bagHeightCm: bagChecks.bagHeightCm,
        isPetCarrier: bagChecks.isPetCarrier,
        fitsUnderSeat: bagChecks.fitsUnderSeat,
        createdAt: bagChecks.createdAt,
        airline: airlines,
        bag: bags as any,
      })
      .from(bagChecks)
      .innerJoin(airlines, eq(bagChecks.airlineId, airlines.id))
      .leftJoin(bags, eq(bagChecks.bagId, bags.id))
      .where(eq(bagChecks.userId, userId))
      .orderBy(desc(bagChecks.createdAt));
  }
}

export const storage = new DatabaseStorage();
