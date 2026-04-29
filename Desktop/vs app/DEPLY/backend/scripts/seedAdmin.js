require("dotenv").config();

const connectDatabase = require("../src/config/db");
const User = require("../src/models/User");

const getEnv = (key) => (process.env[key] || "").trim();

const main = async () => {
  const email = getEnv("SEED_ADMIN_EMAIL");
  const password = getEnv("SEED_ADMIN_PASSWORD");
  const name = getEnv("SEED_ADMIN_NAME") || "Seed Admin";
  const department = getEnv("SEED_ADMIN_DEPARTMENT") || "";
  const force = String(process.env.SEED_ADMIN_FORCE || "false").toLowerCase() === "true";

  if (!email) {
    console.error("Missing SEED_ADMIN_EMAIL");
    process.exit(1);
  }
  if (!password) {
    console.error("Missing SEED_ADMIN_PASSWORD");
    process.exit(1);
  }

  await connectDatabase();

  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    const roleLower = (existing.role || "").toLowerCase();
    if (roleLower === "admin" && !force) {
      console.log(`Admin already exists for ${email}. Skipping.`);
      process.exit(0);
    }

    // Update to admin (and optionally update password) for demo stability.
    existing.name = name;
    existing.department = department;
    existing.role = "admin";
    existing.password = password;
    existing.isActive = true;
    await existing.save();

    console.log(`Admin updated for ${email}.`);
    process.exit(0);
  }

  await User.create({
    name,
    email: email.toLowerCase(),
    password,
    department,
    role: "admin",
    isActive: true
  });

  console.log(`Admin created for ${email}.`);
  process.exit(0);
};

main().catch((err) => {
  console.error("Seed admin failed:", err);
  process.exit(1);
});

