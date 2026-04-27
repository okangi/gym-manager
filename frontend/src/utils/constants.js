// src/utils/constants.js

// App Information
export const APP_NAME = "Cyprian's Workout Wizard";
export const APP_VERSION = "1.0.0";
export const APP_DESCRIPTION = "Complete Gym Management System";

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// User Roles
export const USER_ROLES = {
  ADMIN: "admin",
  TRAINER: "trainer",
  MEMBER: "member"
};

// User Roles Array for mapping
export const USER_ROLES_LIST = [
  { value: "admin", label: "Administrator", color: "#ff9800" },
  { value: "trainer", label: "Trainer", color: "#4caf50" },
  { value: "member", label: "Member", color: "#1877f2" }
];

// Membership Statuses
export const MEMBERSHIP_STATUS = {
  ACTIVE: "active",
  EXPIRED: "expired",
  PENDING: "pending",
  CANCELLED: "cancelled",
  SUSPENDED: "suspended"
};

// Membership Status Colors
export const MEMBERSHIP_STATUS_COLORS = {
  active: "#4caf50",
  expired: "#f44336",
  pending: "#ff9800",
  cancelled: "#9e9e9e",
  suspended: "#f44336"
};

// Payment Statuses
export const PAYMENT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded"
};

// Payment Methods
export const PAYMENT_METHODS = [
  { value: "card", label: "Credit/Debit Card", icon: "💳" },
  { value: "mpesa", label: "M-Pesa", icon: "📱" },
  { value: "airtel", label: "Airtel Money", icon: "📱" },
  { value: "cash", label: "Cash", icon: "💰" },
  { value: "bank_transfer", label: "Bank Transfer", icon: "🏦" }
];

// Class Days
export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

// Class Categories
export const CLASS_CATEGORIES = [
  { value: "yoga", label: "Yoga", icon: "🧘" },
  { value: "cardio", label: "Cardio", icon: "🏃" },
  { value: "strength", label: "Strength", icon: "💪" },
  { value: "hiit", label: "HIIT", icon: "⚡" },
  { value: "dance", label: "Dance", icon: "💃" },
  { value: "boxing", label: "Boxing", icon: "🥊" },
  { value: "pilates", label: "Pilates", icon: "🧘‍♀️" }
];

// Pagination Defaults
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;
export const MAX_PAGE_SIZE = 100;

// Date Formats
export const DATE_FORMATS = {
  SHORT: "MM/DD/YYYY",
  LONG: "MMMM DD, YYYY",
  FULL: "dddd, MMMM DD, YYYY",
  TIME: "HH:mm",
  DATETIME: "MM/DD/YYYY HH:mm"
};

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error"
};

// Activity Log Actions
export const ACTIVITY_ACTIONS = {
  LOGIN: "Login",
  LOGOUT: "Logout",
  PROFILE_EDIT: "Profile Edit",
  PASSWORD_CHANGE: "Password Change",
  CLASS_BOOKING: "Class Booking",
  CLASS_CANCEL: "Class Cancel",
  PAYMENT: "Payment",
  MEMBERSHIP_JOIN: "Membership Join",
  MEMBERSHIP_UPGRADE: "Membership Upgrade",
  TRAINER_CREATE: "Trainer Create",
  TRAINER_EDIT: "Trainer Edit",
  TRAINER_DELETE: "Trainer Delete",
  CLASS_CREATE: "Class Create",
  CLASS_EDIT: "Class Edit",
  CLASS_DELETE: "Class Delete",
  BRANCH_CREATE: "Branch Create",
  BRANCH_EDIT: "Branch Edit",
  BRANCH_DELETE: "Branch Delete",
  PLAN_CREATE: "Plan Create",
  PLAN_EDIT: "Plan Edit",
  PLAN_DELETE: "Plan Delete",
  CHECKIN: "Check-in",
  CHECKOUT: "Check-out"
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: "authToken",
  USER: "userData",
  THEME: "theme",
  SETTINGS: "gym_settings",
  NOTIFICATIONS: "gym_notifications"
};

// Validation Rules
export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 50,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MAX_PHONE_LENGTH: 15,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_CLASS_CAPACITY: 100,
  MIN_CLASS_CAPACITY: 1
};

// File Upload Limits
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/jpg", "image/gif", "image/webp"]
};

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: "#1877f2",
  SECONDARY: "#4caf50",
  DANGER: "#f44336",
  WARNING: "#ff9800",
  INFO: "#2196f3",
  PURPLE: "#9c27b0",
  CYAN: "#00bcd4"
};

// Default Avatar Colors
export const AVATAR_COLORS = [
  "#1877f2", "#4caf50", "#ff9800", "#f44336", 
  "#9c27b0", "#00bcd4", "#795548", "#607d8b"
];

// Plan Durations
export const PLAN_DURATIONS = [
  { value: 7, label: "Weekly", days: 7 },
  { value: 30, label: "Monthly", days: 30 },
  { value: 90, label: "Quarterly", days: 90 },
  { value: 365, label: "Yearly", days: 365 }
];