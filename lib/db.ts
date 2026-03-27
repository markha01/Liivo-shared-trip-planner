import { Pool, PoolClient } from 'pg'

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  }
  return pool
}

let dbReady = false

export async function initDb(): Promise<void> {
  if (dbReady) return

  const client = await getPool().connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`
      ALTER TABLE trips ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS destinations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        country VARCHAR(100),
        notes TEXT,
        emoji VARCHAR(10) DEFAULT '🗺️',
        position INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        destination_id UUID REFERENCES destinations(id) ON DELETE CASCADE,
        trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
        voter_id VARCHAR(255) NOT NULL,
        vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(activity_id, voter_id)
      )
    `)

    const { rows } = await client.query('SELECT COUNT(*)::int as count FROM trips')
    if (rows[0].count === 0) {
      await seedDemoData(client)
    }

    dbReady = true
  } finally {
    client.release()
  }
}

async function seedDemoData(client: PoolClient) {
  const tripResult = await client.query(
    `INSERT INTO trips (name, description) VALUES ($1, $2) RETURNING id`,
    [
      'Summer in the Mediterranean 2025',
      'Two weeks exploring the best of Italy and Greece with the whole squad ✈️',
    ]
  )
  const tripId = tripResult.rows[0].id

  const destinations = [
    { name: 'Rome', country: 'Italy', emoji: '🏛️', notes: 'First stop — 4 nights', position: 1 },
    { name: 'Amalfi Coast', country: 'Italy', emoji: '🌊', notes: 'Coastal road trip — 3 nights', position: 2 },
    { name: 'Santorini', country: 'Greece', emoji: '🌅', notes: 'Grand finale — 4 nights', position: 3 },
  ]

  const destIds: Record<string, string> = {}
  for (const dest of destinations) {
    const r = await client.query(
      `INSERT INTO destinations (trip_id, name, country, emoji, notes, position) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [tripId, dest.name, dest.country, dest.emoji, dest.notes, dest.position]
    )
    destIds[dest.name] = r.rows[0].id
  }

  const romeActivities = [
    {
      name: 'Colosseum & Roman Forum tour',
      description: 'Skip-the-line tickets, 3-hour guided tour. Book at least 2 weeks ahead — sells out fast.',
      category: 'Sightseeing',
    },
    {
      name: 'Vatican Museums & Sistine Chapel',
      description: 'Early 8am entry to beat the crowds. Half-day experience. Dress code: covered shoulders and knees.',
      category: 'Culture',
    },
    {
      name: 'Evening in Trastevere',
      description: 'Wander cobblestone streets, aperitivo at Bar San Calisto, dinner at Da Enzo al 29. Very local vibe.',
      category: 'Food & Drinks',
    },
    {
      name: 'Pasta-making class',
      description: 'Learn to make fresh cacio e pepe with a local host. 2-hour class near Campo de\' Fiori. Max 8 people.',
      category: 'Food & Drinks',
    },
  ]

  for (const act of romeActivities) {
    await client.query(
      `INSERT INTO activities (destination_id, trip_id, name, description, category) VALUES ($1,$2,$3,$4,$5)`,
      [destIds['Rome'], tripId, act.name, act.description, act.category]
    )
  }

  const amalfiActivities = [
    {
      name: 'Boat tour along the coastline',
      description: 'Half-day private boat with stops at sea caves and hidden beaches. Departs from Amalfi harbour at 9am.',
      category: 'Adventure',
    },
    {
      name: 'Path of the Gods hike',
      description: '7.5km trail from Bomerano down to Positano. Breathtaking views the entire way, 3–4 hours.',
      category: 'Adventure',
    },
    {
      name: 'Lazy day in Positano',
      description: 'Explore the village, swim at Spiaggia Grande, lunch at Il Tridente with sea views.',
      category: 'Relaxation',
    },
    {
      name: 'Limoncello tasting & seafood dinner',
      description: 'Visit a family-run limoncello distillery, then dinner at Ristorante Marina Grande with fresh catch of the day.',
      category: 'Food & Drinks',
    },
  ]

  for (const act of amalfiActivities) {
    await client.query(
      `INSERT INTO activities (destination_id, trip_id, name, description, category) VALUES ($1,$2,$3,$4,$5)`,
      [destIds['Amalfi Coast'], tripId, act.name, act.description, act.category]
    )
  }

  const santoriniActivities = [
    {
      name: 'Sunset at Oia village',
      description: 'Arrive 2 hours early for a good spot on the castle walls. Head to Sunset Bar for cocktails after.',
      category: 'Sightseeing',
    },
    {
      name: 'Catamaran cruise to hot springs',
      description: 'Full-day tour: soak in volcanic hot springs, swim at Red Beach, BBQ lunch on deck. One of the best days.',
      category: 'Adventure',
    },
    {
      name: 'Akrotiri archaeological site',
      description: 'Preserved Bronze Age city buried by volcanic eruption. 2 hours with an audio guide. Bring sunscreen.',
      category: 'Culture',
    },
    {
      name: 'Wine tasting at Santo Wines',
      description: 'Cliff-edge winery with local Assyrtiko white wine and sweeping caldera views. Book the sunset slot.',
      category: 'Food & Drinks',
    },
  ]

  for (const act of santoriniActivities) {
    await client.query(
      `INSERT INTO activities (destination_id, trip_id, name, description, category) VALUES ($1,$2,$3,$4,$5)`,
      [destIds['Santorini'], tripId, act.name, act.description, act.category]
    )
  }
}

export function query(text: string, params?: unknown[]) {
  return getPool().query(text, params)
}
