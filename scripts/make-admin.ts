// Set environment variables
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_89laIdCNsuQP@ep-damp-term-a8ahelzn-pooler.eastus2.azure.neon.tech/neondb?sslmode=require";

import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function makeAdmin(email: string) {
  try {
    const [updatedUser] = await db
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.email, email))
      .returning();

    if (!updatedUser) {
      console.error("User not found");
      process.exit(1);
    }

    console.log("Successfully updated user role to admin:", {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

makeAdmin("muheezadedejiokunade@gmail.com"); 