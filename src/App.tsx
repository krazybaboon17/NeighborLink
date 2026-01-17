import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatWidget } from "@/components/ChatWidget";
import { GlobalWaves } from "@/components/ui/GlobalWaves";
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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/post-task" element={<PostTask />} />
            <Route path="/my-tasks" element={<MyTasks />} />
            <Route path="/conversations" element={<Conversations />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/verifications" element={<AdminVerifications />} />
            <Route path="/features" element={<Features />} />
            <Route path="/service-hours" element={<ServiceHours />} />
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
