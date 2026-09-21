import express from "express";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { createUser, getUser, setUserIdentity } from "../services/store.js";
import {
  authenticatedEmail,
  createAuthToken,
  requireAuth,
} from "../services/authToken.js";

const router = express.Router();
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

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
    monthlyIncome: user?.monthlyIncome ?? null,
    goal: user?.goal ?? null,
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

    return res.status(200).json({
      user: serializeUser(user),
      token: createAuthToken(user.email),
    });
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
      return res
        .status(409)
        .json({ error: "That email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    user = await createUser(normalizedEmail, hashedPassword);
    if (!user) {
      return res
        .status(409)
        .json({ error: "That email is already registered." });
    }

    res.status(201).json({
      user: serializeUser(user),
      token: createAuthToken(user.email),
    });
  } catch (err) {
    console.error("auth/register error:", err);
    res.status(500).json({ error: "Could not register you." });
  }
});

router.post("/google", async (req, res) => {
  const { credential } = req.body;

  if (!googleClient || !credential) {
    return res.status(400).json({ error: "Google sign-in is not configured." });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload?.email?.trim().toLowerCase();

    if (!email || !payload.email_verified) {
      return res
        .status(401)
        .json({ error: "Google account email is not verified." });
    }

    const user = await setUserIdentity(email, {
      name: payload.name || "Friend",
      image: payload.picture || null,
    });

    if (!user) {
      return res.status(500).json({ error: "Could not create your account." });
    }

    return res.status(200).json({
      user: serializeUser(user),
      token: createAuthToken(user.email),
    });
  } catch (err) {
    console.error("auth/google error:", err.message);
    return res.status(401).json({ error: "Could not verify Google sign-in." });
  }
});

router.post("/basic-info", requireAuth, async (req, res) => {
  const { name, age, city, occupation, phone, monthlyIncome, goal, email } =
    req.body;

  try {
    const identityEmail = authenticatedEmail(req);
    if (!identityEmail) {
      return res.status(400).json({ error: "Email is required." });
    }

    if (email && String(email).trim().toLowerCase() !== identityEmail) {
      return res
        .status(403)
        .json({ error: "You cannot update another user's details." });
    }

    if (!(await getUser(identityEmail))) {
      return res
        .status(401)
        .json({ error: "Please sign in before saving your details." });
    }

    if (
      !isNonEmptyString(name) ||
      !isNonEmptyString(city) ||
      !isNonEmptyString(occupation)
    ) {
      return res
        .status(400)
        .json({ error: "Name, city, and occupation are required." });
    }

    const ageNum = Number(age);
    if (!Number.isFinite(ageNum) || ageNum <= 0) {
      return res.status(400).json({ error: "A valid age is required." });
    }

    const basicInfoComplete = true;

    const user = await setUserIdentity(identityEmail, {
      name: clean(name),
      age: ageNum,
      city: clean(city),
      occupation: clean(occupation),
      phone: clean(phone),
      monthlyIncome:
        Number.isFinite(Number(monthlyIncome)) && Number(monthlyIncome) > 0
          ? Number(monthlyIncome)
          : null,
      goal: clean(goal),
      basicInfoComplete,
    });

    if (!user) {
      return res.status(400).json({ error: "Could not save your details." });
    }

    res.status(200).json({ user: serializeUser(user) });
  } catch (err) {
    console.error("auth/basic-info error:", err);
    res.status(500).json({ error: "Could not save your details." });
  }
});

export default router;
