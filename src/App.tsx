import { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Web3Provider } from "@/contexts/Web3Context";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Index from "./pages/Index";
import LoanOfferPage from "./pages/LoanOfferPage";
import NotFound from "./pages/NotFound";

console.log('LendIt App loading...');

// Create query client with optimized settings for P2P lending platform
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  console.log('LendIt P2P Lending Platform rendering...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <Web3Provider>
            <BrowserRouter>
              <Suspense fallback={<LoadingSpinner />}>                <Routes>                  {/* Main Landing Page */}
                  <Route path="/" element={<Index />} />
                  
                  {/* Loan Management Routes */}
                  <Route path="/loan-offer/:agreementId" element={<LoanOfferPage />} />
                  
                  {/* Authentication Routes - handled by AuthModal in Index */}
                  <Route path="/login" element={<Index />} />
                  <Route path="/signup" element={<Index />} />
                  
                  {/* 404 Page */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </Web3Provider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
