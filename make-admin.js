import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_89laIdCNsuQP@ep-damp-term-a8ahelzn-pooler.eastus2.azure.neon.tech/neondb?sslmode=require'
});

async function makeAdmin() {
  try {
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE email = $2 RETURNING id, email, role',
      ['admin', 'muheezadedejiokunade@gmail.com']
    );

    if (result.rows[0]) {
      console.log('Successfully updated user role to admin:', result.rows[0]);
    } else {
      console.error('User not found');
    }
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    await pool.end();
  }
}

makeAdmin(); 