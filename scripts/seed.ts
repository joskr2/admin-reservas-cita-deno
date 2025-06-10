import { hash } from "@felix/bcrypt";

// Define all users to be seeded
const usersToSeed = [
  {
    email: "admin@horizonte.com",
    password: "password123",
    role: "superadmin" as const, // Use 'as const' for strict typing
  },
  {
    email: "carlos.mendoza@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
  },
  {
    email: "laura.jimenez@horizonte.com",
    password: "password123",
    role: "psychologist" as const,
  },
];

async function seedDatabase() {
  console.log("🌱 Starting database seeding...");
  const kv = await Deno.openKv();

  for (const userData of usersToSeed) {
    const { email, password, role } = userData;

    // Check if the user already exists to prevent overwriting
    const existingUser = await kv.get(["users", email]);
    if (existingUser.value) {
      console.log(`- User '${email}' already exists. Skipping.`);
      continue;
    }

    // Hash the password securely
    const passwordHash = await hash(password);

    const userRecord = {
      email: email,
      passwordHash: passwordHash,
      role: role,
      createdAt: new Date().toISOString(),
    };

    // Atomically set the user and index it by role
    const result = await kv
      .atomic()
      .set(["users", email], userRecord)
      .set(["users_by_role", role, email], userRecord)
      .commit();

    if (result.ok) {
      console.log(`✅ User '${email}' (${role}) created successfully!`);
    } else {
      console.error(`❌ Failed to create user '${email}'.`);
    }
  }

  await kv.close();
  console.log("🌱 Database seeding finished.");
}

// This allows the script to be run directly from the command line
if (import.meta.main) {
  await seedDatabase();
}
