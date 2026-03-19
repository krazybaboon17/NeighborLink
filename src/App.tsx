import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatWidget } from "@/components/ChatWidget";
import { GlobalWaves } from "@/components/ui/GlobalWaves";
import { VerificationPrompt } from "@/components/VerificationPrompt";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Tasks from "./pages/Tasks";
import PostTask from "./pages/PostTask";
import MyTasks from "./pages/MyTasks";
import TaskDetail from "./pages/TaskDetail";
import Messages from "./pages/Messages";
import Features from "./pages/Features";
import Conversations from "./pages/Conversations";
import Profile from "./pages/Profile";
import AdminVerifications from "./pages/AdminVerifications";
import ServiceHours from "./pages/ServiceHours";
import NotFound from "./pages/NotFound";
import Verify from "./pages/Verify";
import ResetPassword from "./pages/ResetPassword";
import Contact from "./pages/Contact";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GlobalWaves />
    <div className="grain-overlay" />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <VerificationPrompt />
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
            <Route path="/features" element={<Features />} />
            <Route path="/service-hours" element={<ProtectedRoute><ServiceHours /></ProtectedRoute>} />
            <Route path="/contact" element={<Contact />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatWidget />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
