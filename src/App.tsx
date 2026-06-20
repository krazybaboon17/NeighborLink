import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandProvider } from "@/contexts/BrandContext";
import { ChatWidget } from "@/components/ChatWidget";
import { Tour } from "@/components/Tour";
import { GlobalWaves } from "@/components/ui/GlobalWaves";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { CookieBanner } from "@/components/CookieBanner";

// Keep the landing page eager so first paint isn't gated on a chunk fetch.
import Index from "./pages/Index";

// Lazy-load everything else — cuts initial JS sent on the LCP route.
const Auth = lazy(() => import("./pages/Auth"));
const Tasks = lazy(() => import("./pages/Tasks"));
const PostTask = lazy(() => import("./pages/PostTask"));
const MyTasks = lazy(() => import("./pages/MyTasks"));
const TaskDetail = lazy(() => import("./pages/TaskDetail"));
const Messages = lazy(() => import("./pages/Messages"));
const Features = lazy(() => import("./pages/Features"));
const Conversations = lazy(() => import("./pages/Conversations"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminVerifications = lazy(() => import("./pages/AdminVerifications"));
const AdminTasks = lazy(() => import("./pages/AdminTasks"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminAppSettings = lazy(() => import("./pages/AdminAppSettings"));
const AdminTestimonials = lazy(() => import("./pages/AdminTestimonials"));
const ServiceHours = lazy(() => import("./pages/ServiceHours"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Verify = lazy(() => import("./pages/Verify"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Contact = lazy(() => import("./pages/Contact"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Settings = lazy(() => import("./pages/Settings"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-dvh flex items-center justify-center" aria-busy="true" aria-live="polite">
    <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-label="Loading" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <GlobalWaves />
        <div className="grain-overlay" />
        <OfflineBanner />
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <BrandProvider>
              <Suspense fallback={<RouteFallback />}>

              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/tasks/:id" element={<TaskDetail />} />
                <Route path="/post-task" element={<ProtectedRoute><PostTask /></ProtectedRoute>} />
                <Route path="/my-tasks" element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
                <Route path="/conversations" element={<ProtectedRoute><Conversations /></ProtectedRoute>} />
                <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/verify" element={<ProtectedRoute><Verify /></ProtectedRoute>} />
                <Route path="/admin/verifications" element={<ProtectedRoute><AdminVerifications /></ProtectedRoute>} />
                <Route path="/admin/tasks" element={<ProtectedRoute><AdminTasks /></ProtectedRoute>} />
                <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/app-settings" element={<ProtectedRoute><AdminAppSettings /></ProtectedRoute>} />
                <Route path="/admin/testimonials" element={<ProtectedRoute><AdminTestimonials /></ProtectedRoute>} />
                <Route path="/features" element={<Features />} />
                <Route path="/service-hours" element={<ProtectedRoute><ServiceHours /></ProtectedRoute>} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
              <ChatWidget />
              <Tour />
              <CookieBanner />
              </BrandProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
