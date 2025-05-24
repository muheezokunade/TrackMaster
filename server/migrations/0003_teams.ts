import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";

export async function up(db: ReturnType<typeof drizzle>) {
  // Create teams table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS teams (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_by_id INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create team_members table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS team_members (
      id SERIAL PRIMARY KEY,
      team_id INTEGER NOT NULL REFERENCES teams(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      role TEXT NOT NULL DEFAULT 'member',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Add team_id to invitations table
  await db.execute(sql`
    ALTER TABLE invitations 
    ADD COLUMN team_id INTEGER REFERENCES teams(id);
  `);

  // Create teams for existing users
  const users = await db.execute<{ id: number; first_name: string; role: string }>(sql`
    SELECT id, first_name, role FROM users;
  `);

  for (const user of users.rows) {
    // Create team
    const team = await db.execute<{ id: number }>(sql`
      INSERT INTO teams (name, created_by_id)
      VALUES (${`${user.first_name}'s Team`}, ${user.id})
      RETURNING id;
    `);

    // Add user to team
    await db.execute(sql`
      INSERT INTO team_members (team_id, user_id, role)
      VALUES (${team.rows[0].id}, ${user.id}, ${user.role});
    `);
  }

  // Make team_id not null
  await db.execute(sql`
    ALTER TABLE invitations 
    ALTER COLUMN team_id SET NOT NULL;
  `);
}

export async function down(db: ReturnType<typeof drizzle>) {
  await db.execute(sql`
    ALTER TABLE invitations DROP COLUMN team_id;
  `);
  
  await db.execute(sql`
    DROP TABLE IF EXISTS team_members;
  `);
  
  await db.execute(sql`
    DROP TABLE IF EXISTS teams;
  `);
} 