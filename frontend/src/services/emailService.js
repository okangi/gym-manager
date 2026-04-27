import { getUsers } from './userService';
import { getPayments } from './paymentService';

const API_BASE_URL = 'http://localhost:5000/api';

// Send email via backend API
const sendEmail = async (to, subject, body, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ to, subject, body })
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Send expiry reminder email
export const sendExpiryReminder = async (userEmail, userName, planName, expiryDate, token) => {
  const subject = 'Your gym membership is expiring soon!';
  const body = `Hello ${userName},\n\nYour ${planName} membership expires on ${new Date(expiryDate).toLocaleDateString()}. Please renew to continue enjoying our services.\n\nThank you for choosing us!\n\nGym Management Team`;
  
  // Log simulation (for development)
  console.log(`📧 SIMULATED EMAIL to ${userEmail}:`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Body: ${body}`);
  
  // Actually send email if backend has email configured
  if (token) {
    return await sendEmail(userEmail, subject, body, token);
  }
  return true; // Simulated success
};

// Get active memberships from backend
const getActiveMemberships = async (token) => {
  try {
    const payments = await getPayments(token);
    // Consider payments as active memberships if status is Completed
    const activeMemberships = payments.filter(p => p.status === 'Completed');
    
    // Group by user and get the most recent membership
    const membershipsByUser = {};
    activeMemberships.forEach(payment => {
      if (!membershipsByUser[payment.userId] || new Date(payment.expiryDate) > new Date(membershipsByUser[payment.userId].expiryDate)) {
        membershipsByUser[payment.userId] = {
          id: payment._id,
          userId: payment.userId,
          userEmail: payment.userEmail,
          userName: payment.userName,
          planName: payment.planName,
          startDate: payment.paymentDate,
          endDate: payment.expiryDate,
          status: 'active'
        };
      }
    });
    
    return Object.values(membershipsByUser);
  } catch (error) {
    console.error('Error fetching memberships:', error);
    return [];
  }
};

// Check and send expiry reminders
export const checkAndSendExpiryReminders = async (daysThreshold = 3, token) => {
  if (!token) {
    console.warn('No token provided for email reminders');
    return;
  }
  
  console.log('🔍 Checking for memberships expiring within', daysThreshold, 'days...');
  
  try {
    const memberships = await getActiveMemberships(token);
    const users = await getUsers(token);
    
    const now = new Date();
    const threshold = new Date();
    threshold.setDate(now.getDate() + daysThreshold);
    
    console.log('Active memberships found:', memberships.length);
    
    // Get reminders already sent from localStorage (for tracking)
    const remindersSent = JSON.parse(localStorage.getItem('expiry_reminders_sent') || '[]');
    let newRemindersSent = [...remindersSent];
    
    for (const membership of memberships) {
      if (membership.status === 'active' && membership.endDate) {
        const expiryDate = new Date(membership.endDate);
        console.log(`Membership for ${membership.userEmail} expires on ${expiryDate.toLocaleDateString()}`);
        
        if (expiryDate <= threshold && expiryDate > now) {
          const user = users.find(u => u.email === membership.userEmail);
          if (user) {
            if (!remindersSent.includes(membership.id)) {
              console.log(`✅ Sending reminder for ${user.email}`);
              await sendExpiryReminder(
                user.email, 
                user.name || user.email, 
                membership.planName, 
                membership.endDate,
                token
              );
              newRemindersSent.push(membership.id);
            } else {
              console.log(`⏩ Reminder already sent for membership ${membership.id}`);
            }
          } else {
            console.warn(`User not found for email: ${membership.userEmail}`);
          }
        } else {
          console.log(`⏩ Not expiring soon: ${expiryDate.toLocaleDateString()} > threshold ${threshold.toLocaleDateString()}`);
        }
      }
    }
    
    // Update reminders sent in localStorage
    if (newRemindersSent.length !== remindersSent.length) {
      localStorage.setItem('expiry_reminders_sent', JSON.stringify(newRemindersSent));
    }
  } catch (error) {
    console.error('Error checking expiry reminders:', error);
  }
};

// Manual reminder for specific user
export const sendManualReminder = async (userEmail, token) => {
  try {
    const users = await getUsers(token);
    const user = users.find(u => u.email === userEmail);
    
    if (!user) {
      console.warn(`User not found: ${userEmail}`);
      return false;
    }
    
    const memberships = await getActiveMemberships(token);
    const userMembership = memberships.find(m => m.userEmail === userEmail);
    
    if (!userMembership) {
      console.warn(`No active membership found for ${userEmail}`);
      return false;
    }
    
    await sendExpiryReminder(
      userEmail,
      user.name || userEmail,
      userMembership.planName,
      userMembership.endDate,
      token
    );
    
    return true;
  } catch (error) {
    console.error('Error sending manual reminder:', error);
    return false;
  }
};