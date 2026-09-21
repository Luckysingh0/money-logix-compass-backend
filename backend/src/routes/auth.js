import express from "express";
import bcrypt from "bcrypt";
import { createUser, getUser, setUserIdentity } from "../services/store.js";

const router = express.Router();

function serializeUser(user) {
  return {
    _id: user?._id?.toString() ?? null,
    name: user?.name ?? "Friend",
    email: user?.email ?? null,
    image: user?.image ?? null,
    age: user?.age ?? null,
    city: user?.city ?? null,
    occupation: user?.occupation ?? null,
    phone: user?.phone ?? null,
    basicInfoComplete: Boolean(user?.basicInfoComplete),
    onboardingComplete: Boolean(user?.onboardingComplete),
  };
}

const clean = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password)
      return res
        .status(400)
        .json({ error: "Email and password are required." });

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await getUser(normalizedEmail);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (!user.password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    return res.status(200).json({ user: serializeUser(user) });
  } catch (err) {
    console.error("auth/login error:", err);
    res.status(500).json({ error: "Could not sign you in." });
  }
});

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password)
      return res
        .status(400)
        .json({ error: "Email and password are required." });

    const normalizedEmail = String(email).trim().toLowerCase();
    let user = await getUser(normalizedEmail);

    if (user) {
      return res.status(200).json({ user: serializeUser(user) });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    user = await createUser(normalizedEmail, hashedPassword);
    if (!user) {
      return res
        .status(409)
        .json({ error: "That email is already registered." });
    }

    res.status(201).json({ user: serializeUser(user) });
  } catch (err) {
    console.error("auth/register error:", err);
    res.status(500).json({ error: "Could not register you." });
  }
});

router.post("/basic-info", async (req, res) => {
  const { name, age, city, occupation, phone, income, goal, email } = req.body;

  try {
    if (!email || !isNonEmptyString(String(email))) {
      return res.status(400).json({ error: "Email is required." });
    }

    if (
      !isNonEmptyString(name) ||
      !isNonEmptyString(city) ||
      !isNonEmptyString(occupation) ||
      !isNonEmptyString(phone)
    ) {
      return res
        .status(400)
        .json({ error: "Name, city, occupation, and phone are required." });
    }

    const ageNum = Number(age);
    if (!Number.isFinite(ageNum) || ageNum <= 0) {
      return res.status(400).json({ error: "A valid age is required." });
    }

    const basicInfoComplete = true;

    const user = await setUserIdentity(String(email).trim().toLowerCase(), {
      name: clean(name),
      age: ageNum,
      city: clean(city),
      occupation: clean(occupation),
      phone: clean(phone),
      basicInfoComplete,
    });

    if (!user) {
      return res.status(400).json({ error: "Could not save your details." });
    }

    res.status(201).json({ user: serializeUser(user) });
  } catch (err) {
    console.error("auth/basic-info error:", err);
    res.status(500).json({ error: "Could not save your details." });
  }
});

router.post("/sync-user", async (req, res) => {
  const { name, email, image } = req.body;

  try {
    if (!email || !name)
      return res.status(400).json({ error: "Name and Email are required." });

    const normalizedEmail = String(email).trim().toLowerCase();
    let user = await getUser(normalizedEmail);

    if (!user) {
      user = await setUserIdentity(normalizedEmail, {
        name,
        image,
        basicInfoComplete: false,
        onboardingComplete: false,
      });
    }

    res.status(201).json({ user: serializeUser(user) });
  } catch (err) {
    console.error("/auth/sync-user error:", err);
    res.status(500).json({ error: "Could not sync user." });
  }
});

export default router;
