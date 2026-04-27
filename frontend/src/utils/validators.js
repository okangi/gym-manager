// src/utils/validators.js
import { VALIDATION_RULES } from './constants';

// ============ EMAIL VALIDATION ============
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ============ PHONE VALIDATION ============
// Kenyan phone number validation
export const isValidPhone = (phone) => {
  if (!phone) return false;
  // Kenyan format: 07XXXXXXXX or 01XXXXXXXX
  const phoneRegex = /^(07|01)[0-9]{8}$/;
  return phoneRegex.test(phone);
};

// International phone validation (more flexible)
export const isValidPhoneInternational = (phone) => {
  if (!phone) return false;
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

// ============ PASSWORD VALIDATION ============
export const isStrongPassword = (password) => {
  if (!password) return false;
  return password.length >= VALIDATION_RULES.MIN_PASSWORD_LENGTH;
};

export const doPasswordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "Weak", color: "#f44336" };
  
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  const strength = {
    0: { label: "Very Weak", color: "#f44336" },
    1: { label: "Weak", color: "#ff9800" },
    2: { label: "Fair", color: "#ffc107" },
    3: { label: "Good", color: "#8bc34a" },
    4: { label: "Strong", color: "#4caf50" },
    5: { label: "Very Strong", color: "#2e7d32" }
  };
  
  return { score, ...strength[Math.min(score, 5)] };
};

// ============ NAME VALIDATION ============
export const isValidName = (name) => {
  if (!name) return false;
  const nameRegex = /^[a-zA-Z\s\-']{2,100}$/;
  return nameRegex.test(name);
};

// ============ REQUIRED FIELD ============
export const isRequired = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  if (Array.isArray(value)) return value.length > 0;
  return !!value;
};

// ============ NUMBER VALIDATION ============
export const isNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

export const isInRange = (value, min, max) => {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
};

export const isPositiveNumber = (value) => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

// ============ DATE VALIDATION ============
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const isFutureDate = (dateString) => {
  if (!isValidDate(dateString)) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
};

export const isPastDate = (dateString) => {
  if (!isValidDate(dateString)) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

// ============ URL VALIDATION ============
export const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidYouTubeUrl = (url) => {
  if (!url) return false;
  const patterns = [
    /youtube\.com\/watch\?v=/,
    /youtu\.be\//,
    /youtube\.com\/embed\//,
    /youtube\.com\/shorts\//
  ];
  return patterns.some(pattern => pattern.test(url));
};

// ============ CLASS VALIDATION ============
export const isValidClassCapacity = (capacity) => {
  const num = Number(capacity);
  return !isNaN(num) && num >= 1 && num <= 100;
};

export const isValidTime = (time) => {
  if (!time) return false;
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// ============ BRANCH VALIDATION ============
export const isValidBranch = (branchId, availableBranches) => {
  if (!branchId) return false;
  return availableBranches.some(b => b.id === branchId);
};

// ============ PAYMENT VALIDATION ============
export const isValidCardNumber = (cardNumber) => {
  if (!cardNumber) return false;
  const num = cardNumber.replace(/\s/g, '');
  return /^[0-9]{15,16}$/.test(num);
};

export const isValidExpiry = (expiry) => {
  if (!expiry) return false;
  const [month, year] = expiry.split('/');
  if (!month || !year) return false;
  const monthNum = parseInt(month);
  const yearNum = parseInt(year);
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;
  
  if (monthNum < 1 || monthNum > 12) return false;
  if (yearNum < currentYear) return false;
  if (yearNum === currentYear && monthNum < currentMonth) return false;
  return true;
};

export const isValidCVV = (cvv) => {
  if (!cvv) return false;
  return /^[0-9]{3,4}$/.test(cvv);
};

// ============ FORM VALIDATION HELPERS ============
export const validateForm = (data, rules) => {
  const errors = {};
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    
    if (rule.required && !isRequired(value)) {
      errors[field] = rule.requiredMessage || `${field} is required`;
    }
    
    if (rule.email && value && !isValidEmail(value)) {
      errors[field] = rule.emailMessage || 'Invalid email format';
    }
    
    if (rule.phone && value && !isValidPhone(value)) {
      errors[field] = rule.phoneMessage || 'Invalid phone number';
    }
    
    if (rule.minLength && value && value.length < rule.minLength) {
      errors[field] = rule.minLengthMessage || `${field} must be at least ${rule.minLength} characters`;
    }
    
    if (rule.maxLength && value && value.length > rule.maxLength) {
      errors[field] = rule.maxLengthMessage || `${field} must be at most ${rule.maxLength} characters`;
    }
    
    if (rule.pattern && value && !rule.pattern.test(value)) {
      errors[field] = rule.patternMessage || `${field} is invalid`;
    }
    
    if (rule.match && value !== data[rule.match.field]) {
      errors[field] = rule.match.message || `${field} does not match`;
    }
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
};