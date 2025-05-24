#!/usr/bin/env node

// Set environment variables
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_89laIdCNsuQP@ep-damp-term-a8ahelzn-pooler.eastus2.azure.neon.tech/neondb?sslmode=require';
process.env.PORT = '3000';

// Update user role
import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function makeAdmin() {
  try {
    const [updatedUser] = await db
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.email, "muheezadedejiokunade@gmail.com"))
      .returning();

    if (updatedUser) {
      console.log("Successfully updated user role to admin:", {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role
      });
    } else {
      console.error("User not found");
    }
  } catch (error) {
    console.error("Error updating user role:", error);
  }
}

// Make the user admin and then start the app
await makeAdmin();

// Start the app
import { spawn } from 'child_process';
const child = spawn('npm', ['run', 'dev'], { 
  stdio: 'inherit',
  env: {
    ...process.env,
    // Ensure these environment variables are set
    DATABASE_URL: process.env.DATABASE_URL,
    PORT: process.env.PORT
  }
});

child.on('error', (error) => {
  console.error('Failed to start app:', error);
}); 