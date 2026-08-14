import { store, session } from "./store";
import { mockRequest, ApiError } from "./mockApi";
import { generateId } from "../utils/generateId";
import { validateEmail } from "../utils/validateEmail";
import { logActivity } from "./activityService";
import { ROLES } from "../constants/roles";

const SESSION_KEY = "teamsync.session";

function sanitize(user) {
  if (!user) return null;
  const { password: _password, ...safe } = user;
  return safe;
}

export async function login(email, password) {
  return mockRequest(() => {
    const user = store.users.find(
      (u) => u.email.toLowerCase() === String(email).toLowerCase().trim(),
    );

    if (!user || user.password !== password) {
      throw new ApiError("Invalid email or password.", 401);
    }

    session.userId = user.id;
    localStorage.setItem(SESSION_KEY, user.id);
    logActivity(user.id, "login", {
      type: "session",
      name: `${user.name} signed in`,
      id: user.id,
    });

    return sanitize(user);
  }, 400);
}

export async function register(name, email, password) {
  return mockRequest(() => {
    const cleanEmail = String(email).toLowerCase().trim();
    if (!name || name.trim().length < 2) {
      throw new ApiError("Please enter your full name.");
    }
    if (!validateEmail(cleanEmail)) {
      throw new ApiError("Please enter a valid email address.");
    }
    if (String(password).length < 8) {
      throw new ApiError("Password must be at least 8 characters.");
    }
    if (store.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      throw new ApiError("An account with this email already exists.", 409);
    }

    const user = {
      id: generateId("u"),
      name: name.trim(),
      email: cleanEmail,
      password,
      role: ROLES.MEMBER,
      title: "New member",
      bio: "",
      location: "",
      presence: "online",
      statusMessage: null,
      joinedAt: new Date().toISOString(),
    };

    store.users.push(user);
    session.userId = user.id;
    localStorage.setItem(SESSION_KEY, user.id);

    logActivity(user.id, "member.joined", {
      type: "member",
      name: `${user.name} joined the workspace`,
      id: user.id,
    });

    return sanitize(user);
  }, 500);
}

export async function logout() {
  return mockRequest(() => {
    const me = store.users.find((u) => u.id === session.userId);
    session.userId = null;
    localStorage.removeItem(SESSION_KEY);
    if (me) {
      logActivity(me.id, "logout", {
        type: "session",
        name: `${me.name} signed out`,
        id: me.id,
      });
    }
    return true;
  }, 150);
}

export async function forgotPassword(email) {
  return mockRequest(() => {
    if (!validateEmail(email)) {
      throw new ApiError("Please enter a valid email address.");
    }
    const exists = store.users.some(
      (u) => u.email.toLowerCase() === String(email).toLowerCase().trim(),
    );
    if (!exists) {
      throw new ApiError("No account found with this email.", 404);
    }
    return { ok: true };
  }, 600);
}

export function getCurrentUser() {
  if (!session.userId) return null;
  const me = store.users.find((u) => u.id === session.userId);
  return sanitize(me);
}

export function setCurrentUserId(userId) {
  session.userId = userId;
  if (userId) localStorage.setItem(SESSION_KEY, userId);
  else localStorage.removeItem(SESSION_KEY);
}
