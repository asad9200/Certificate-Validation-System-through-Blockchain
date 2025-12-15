import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Verify from "./pages/Verify";
import Holder from "./pages/Holder";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import InstitutionSignup from "./pages/InstitutionSignup";
import SuperAdminLogin from "./pages/SuperAdminLogin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/holder" element={<Holder />} />

            {/* Institution Routes */}
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/signup" element={<InstitutionSignup />} />
            <Route path="/institution/login" element={<AdminLogin />} />
            <Route path="/institution/signup" element={<InstitutionSignup />} />
            <Route path="/institution/dashboard" element={<Admin />} />

            {/* Super Admin Routes */}
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />
            <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
            
            {/* Password Reset Route */}
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
