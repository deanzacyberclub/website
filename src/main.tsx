import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import ScrollToTop from "@/components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";
import App from "@/pages/App";
import "./index.css";

const Attendance = lazy(() => import("@/pages/Attendance"));
const Legal = lazy(() => import("@/pages/Legal"));
const Meetings = lazy(() => import("@/pages/Meetings"));
const MeetingDetails = lazy(() => import("@/pages/MeetingDetails"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Auth = lazy(() => import("@/pages/Auth"));
const AuthCallback = lazy(() => import("@/pages/AuthCallback"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Settings = lazy(() => import("@/pages/Settings"));
const CTF = lazy(() => import("@/pages/CTF"));
const CTFChallenges = lazy(() => import("@/pages/ctf/Challenges"));
const CTFChallengeDetail = lazy(() => import("@/pages/ctf/ChallengeDetail"));
const CTFTeam = lazy(() => import("@/pages/ctf/Team"));
const CTFJoinTeam = lazy(() => import("@/pages/ctf/JoinTeam"));
const CTFLeaderboard = lazy(() => import("@/pages/ctf/Leaderboard"));
const CTFChallengeEditor = lazy(() => import("@/pages/ctf/ChallengeEditor"));
const Study = lazy(() => import("@/pages/Study"));
const Officer = lazy(() => import("@/pages/Officer"));
const UserProfile = lazy(() => import("@/pages/UserProfile"));
const BurpSuite = lazy(() => import("@/pages/BurpSuite"));
const BurpSuiteDemo1 = lazy(() => import("@/pages/burpsuite/Demo1"));
const BurpSuiteDemo2 = lazy(() => import("@/pages/burpsuite/Demo2"));
const BurpSuiteDemo3 = lazy(() => import("@/pages/burpsuite/Demo3"));
const BurpSuiteDashboard = lazy(() => import("@/pages/burpsuite/Dashboard"));
const Weekly = lazy(() => import("@/pages/Weekly"));
const PuzzleWeek1 = lazy(() => import("@/pages/puzzle/Week1"));

const LoadingFallback = () => (
  <div className="min-h-screen bg-terminal-bg text-matrix flex items-center justify-center">
    <div className="text-center">
      <div className="font-terminal text-lg neon-pulse">Loading...</div>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById("deanzacybersecurityclub")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route element={<Layout />}>
              {/* Public routes */}
              <Route path="/" element={<App />} />
              <Route path="/meetings" element={<Meetings />} />
              <Route path="/meetings/:slug" element={<MeetingDetails />} />
              <Route path="/ctf" element={<CTF />} />
              <Route path="/ctf/challenges" element={<CTFChallenges />} />
              <Route path="/ctf/challenge/:id" element={<CTFChallengeDetail />} />
              <Route path="/ctf/leaderboard" element={<CTFLeaderboard />} />
              <Route path="/study" element={<Study />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/@/:id" element={<ProtectedRoute requireOfficer><UserProfile /></ProtectedRoute>} />

              {/* BurpSuite Demo Routes */}
              <Route path="/burpsuite" element={<BurpSuite />} />
              <Route path="/burpsuite/demo1" element={<BurpSuiteDemo1 />} />
              <Route path="/burpsuite/demo2" element={<BurpSuiteDemo2 />} />
              <Route path="/burpsuite/demo3" element={<BurpSuiteDemo3 />} />
              <Route path="/burpsuite/dashboard" element={<BurpSuiteDashboard />} />

              {/* Weekly Challenge Route */}
              <Route path="/weekly" element={<Weekly />} />

              {/* Weekly Puzzle Routes */}
              <Route path="/puzzle/week1" element={<PuzzleWeek1 />} />

              {/* Protected routes - require authentication */}
              <Route path="/live" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/officer" element={<ProtectedRoute requireOfficer><Officer /></ProtectedRoute>} />
              <Route path="/ctf/team" element={<ProtectedRoute><CTFTeam /></ProtectedRoute>} />
              <Route path="/ctf/join" element={<ProtectedRoute><CTFJoinTeam /></ProtectedRoute>} />
              <Route path="/ctf/join/:code" element={<ProtectedRoute><CTFJoinTeam /></ProtectedRoute>} />
              <Route path="/ctf/challenge/:id/edit" element={<ProtectedRoute requireOfficer><CTFChallengeEditor /></ProtectedRoute>} />
              <Route path="/ctf/challenges/new" element={<ProtectedRoute requireOfficer><CTFChallengeEditor /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
);
