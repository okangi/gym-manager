import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import MemberLayout from './components/layout/MemberLayout';
import AdminLayout from './components/layout/AdminLayout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ResetPassword from './components/auth/ResetPassword';
import AdminDashboard from './components/admin/AdminDashboard';
import UserList from './components/admin/UserList';
import DashboardHome from './components/member/DashboardHome';
import MembershipPlans from './components/member/MembershipPlans';
import CheckIn from './components/member/CheckIn';
import PaymentsHistory from './components/member/PaymentsHistory';
import ProfileSettings from './components/member/ProfileSettings';
import ExportData from './components/member/ExportData';
import { initDefaultPlans } from './services/planService';
import { initDefaultTrainers } from './services/trainerService';
import { initDefaultClasses } from './services/classService';
import { initDefaultVideos } from './services/videoService';
import { initDefaultSettings } from './services/gymSettingsService';
import { initDefaultBranches } from './services/branchService';
import { initDefaultLanding } from './services/landingService';
import ManagePlans from './components/admin/ManagePlans';
import ManagePayments from './components/admin/ManagePayments';
import RevenueChart from './components/admin/RevenueChart';
import ManageTrainers from './components/admin/ManageTrainers';
import TrainersList from './components/member/TrainersList';
import ManageClasses from './components/admin/ManageClasses';
import ClassesList from './components/member/ClassesList';
import TrainerLayout from './components/layout/TrainerLayout';
import TrainerDashboard from './components/trainer/TrainerDashboard';
import TrainerClasses from './components/trainer/TrainerClasses';
import TrainerBookings from './components/trainer/TrainerBookings';
import TrainerAvailability from './components/trainer/TrainerAvailability';
import PrivateSessions from './components/member/PrivateSessions';
import TrainerPlans from './components/trainer/TrainerPlans';
import MyPlans from './components/member/MyPlans';
import MemberChat from './components/member/MemberChat';
import TrainerChat from './components/trainer/TrainerChat';
import ProgressTracker from './components/member/ProgressTracker';
import TrainerProgress from './components/trainer/TrainerProgress';
import MembershipCard from './components/member/MembershipCard';
import MemberScanner from './components/common/MemberScanner';
import ReferralStats from './components/admin/ReferralStats';
import TrainerVideos from './components/trainer/TrainerVideos';
import VideoLibrary from './components/member/VideoLibrary';
import AdvancedAnalytics from './components/admin/AdvancedAnalytics';
import ExportAllData from './components/admin/ExportAllData';
import GymSettings from './components/admin/GymSettings';
import ContactUs from './components/member/ContactUs';
import ManageBranches from './components/admin/ManageBranches';
import LandingPage from './components/LandingPage';
import ContactMessages from './components/admin/ContactMessages';
import ManageLandingPage from './components/admin/ManageLandingPage';
import TrainerProfile from './components/trainer/TrainerProfile';
import MyBookings from "./components/member/MyBookings";
import BranchAssignment from './components/admin/BranchAssignment';

// Loading component for better UX
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#666'
  }}>
    Loading application...
  </div>
);

function App() {
  const { loading, token, user } = useAuth();

  useEffect(() => {
    const initializeData = async () => {
      if (!token) return;
      
      try {
        // These are safe for all users (public data)
        await initDefaultSettings();
        await initDefaultLanding();
        
        // Only initialize admin data if user is admin
        if (user?.role === 'admin') {
          await initDefaultPlans(token);
          await initDefaultTrainers(token);
          await initDefaultClasses(token);
          await initDefaultVideos(token);
          await initDefaultBranches(token);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        // Don't crash the app, just log the error
      }
    };
    
    initializeData();
  }, [token, user?.role]);

  if (loading) return <LoadingFallback />;

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Member routes */}
        <Route element={<ProtectedRoute allowedRoles={['member']} />}>
          <Route path="/member" element={<MemberLayout />}>
            <Route path="trainers" element={<TrainersList />} />
            <Route path="classes" element={<ClassesList />} />
            <Route path="private-sessions" element={<PrivateSessions />} />
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="membership" element={<MembershipPlans />} />
            <Route path="checkin" element={<CheckIn />} />
            <Route path="payments" element={<PaymentsHistory />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="export" element={<ExportData />} />
            <Route path="my-plans" element={<MyPlans />} /> 
            <Route path="chat" element={<MemberChat />} />
            <Route path="progress" element={<ProgressTracker />} />
            <Route path="card" element={<MembershipCard />} />
            <Route path="videos" element={<VideoLibrary />} />
            <Route path="contact" element={<ContactUs />} />
            <Route path="my-bookings" element={<MyBookings />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/branch-assignment" element={<BranchAssignment />} />
            <Route path="/admin/landing" element={<ManageLandingPage />} />
            <Route path="/admin/contact-messages" element={<ContactMessages />} />
            <Route path="/admin/trainers" element={<ManageTrainers />} />
            <Route path="/admin/classes" element={<ManageClasses />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserList />} />
            <Route path="/admin/plans" element={<ManagePlans />} /> 
            <Route path="/admin/payments" element={<ManagePayments />} />
            <Route path="/admin/revenue" element={<RevenueChart />} />
            <Route path="/admin/profile" element={<ProfileSettings />} />
            <Route path="/admin/export" element={<ExportData />} />  
            <Route path="/admin/scan" element={<MemberScanner />} /> 
            <Route path="/admin/referrals" element={<ReferralStats />} />
            <Route path="/admin/analytics" element={<AdvancedAnalytics />} />
            <Route path="/admin/export-all" element={<ExportAllData />} />
            <Route path="/admin/settings" element={<GymSettings />} />
            <Route path="/admin/branches" element={<ManageBranches />} />
            <Route path="/admin/scan" element={<MemberScanner />} />
          </Route>
        </Route>
        
        {/* Trainer routes */}
        <Route element={<ProtectedRoute allowedRoles={['trainer']} />}>
          <Route element={<TrainerLayout />}>
            <Route path="/trainer/dashboard" element={<TrainerDashboard />} />
            <Route path="/trainer/classes" element={<TrainerClasses />} />
            <Route path="/trainer/bookings" element={<TrainerBookings />} />
            <Route path="/trainer/availability" element={<TrainerAvailability />} />
            <Route path="/trainer/profile" element={<TrainerProfile />} />
            <Route path="/trainer/plans" element={<TrainerPlans />} /> 
            <Route path="/trainer/chat" element={<TrainerChat />} />
            <Route path="/trainer/progress" element={<TrainerProgress />} />
            <Route path="/trainer/scan" element={<MemberScanner />} />
            <Route path="/trainer/videos" element={<TrainerVideos />} />
            <Route path="/trainer/scan" element={<MemberScanner />} />
          </Route>
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;