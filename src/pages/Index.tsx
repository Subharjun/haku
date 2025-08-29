import { Suspense, lazy } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Preloader from "@/components/Preloader";
import ParticleBackground from "@/components/ParticleBackground";
import AnimatedFooter from "@/components/AnimatedFooter";
import ScrollProgressIndicator from "@/components/ScrollProgressIndicator";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";

// Lazy load the Dashboard component with error handling
const Dashboard = lazy(() => {
  console.log('Loading Dashboard component...');
  return import("@/components/Dashboard").catch(error => {
    console.error('Failed to load Dashboard:', error);
    throw error;
  });
});

const Index = () => {
  console.log('Index component rendering...');
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);  const navItems = [
    { name: "Features", link: "#features" },
    { name: "How It Works", link: "#how-it-works" },
    { name: "Security", link: "#security" },
    { name: "Contact", link: "#contact" },
  ];

  // Add/remove landing-page class from body
  useEffect(() => {
    if (!user) {
      document.body.classList.add('landing-page');
    }
    return () => {
      document.body.classList.remove('landing-page');
    };
  }, [user]);

  console.log('User state:', user);
  console.log('Loading state:', loading);

  if (loading) {
    console.log('Showing loading spinner');
    return <LoadingSpinner />;
  }

  if (user) {
    console.log('User authenticated, loading Dashboard');
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Dashboard />
      </Suspense>
    );
  }  console.log('No user, showing landing page');
  return (
    <>
      <Preloader />
      <div className="min-h-screen relative overflow-hidden">
        {/* Minimalist gradient background */}
        <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        <div className="fixed inset-0 bg-gradient-to-tr from-gray-800/30 via-transparent to-gray-700/20"></div>
        
        {/* Particle Background */}
        <ParticleBackground />
        
        {/* Scroll Progress Indicator */}
        <ScrollProgressIndicator />
        
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-40 -right-80 w-96 h-96 bg-gradient-to-r from-gray-600/20 to-gray-500/20 rounded-full filter blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div 
            className="absolute -bottom-40 -left-80 w-96 h-96 bg-gradient-to-r from-gray-700/20 to-gray-600/20 rounded-full filter blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, 50, 0],
              scale: [1, 1.4, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          <motion.div 
            className="absolute top-40 right-40 w-80 h-80 bg-gradient-to-r from-gray-500/15 to-gray-800/15 rounded-full filter blur-3xl"
            animate={{
              x: [0, 60, 0],
              y: [0, -40, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 6,
            }}
          />
        </div>

      {/* Resizable Navbar */}
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />          <div className="flex items-center gap-4">
            <NavbarButton variant="secondary" onClick={() => setShowAuth(true)}>
              Login
            </NavbarButton>
            <NavbarButton variant="dark" onClick={() => setShowAuth(true)}>
              Get Started
            </NavbarButton>
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300 hover:text-purple-400 transition-colors"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4">
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowAuth(true);
                }}
                variant="secondary"
                className="w-full"
              >
                Login
              </NavbarButton>              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowAuth(true);
                }}
                variant="dark"
                className="w-full"
              >
                Get Started
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
        {/* Hero Section */}      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex justify-center mb-8"
          >
            <div className="relative">
              <motion.div 
                className="w-24 h-24 bg-gradient-to-r from-gray-800 to-black rounded-3xl flex items-center justify-center shadow-2xl border border-gray-600"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="text-white font-bold text-4xl">L</span>
              </motion.div>
              <motion.div
                className="absolute -inset-3 bg-gradient-to-r from-gray-600 to-gray-400 rounded-3xl opacity-20 blur-xl"
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Lend & Borrow with
            <motion.span 
              className="bg-gradient-to-r from-gray-300 via-white to-gray-300 bg-clip-text text-transparent block"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                backgroundSize: ["200% 200%", "200% 200%", "200% 200%"]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              Trust
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Secure peer-to-peer lending platform for India. Lend money to friends, family, or trusted individuals with built-in payment tracking and smart contracts.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.button
              onClick={() => setShowAuth(true)}
              className="px-10 py-4 bg-gradient-to-r from-gray-800 to-black text-white font-semibold rounded-xl hover:from-gray-700 hover:to-gray-900 transition-all duration-300 shadow-2xl text-lg relative overflow-hidden group border border-gray-600"
              whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10">Get Started Free</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-black to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
              />
            </motion.button>
            <motion.button 
              className="px-10 py-4 border-2 border-gray-500/50 text-gray-200 font-semibold rounded-xl hover:bg-gray-800/20 hover:border-gray-400 transition-all duration-300 text-lg backdrop-blur-sm hover:shadow-lg hover:shadow-gray-500/25"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Learn More
            </motion.button>
          </motion.div>
        </div>
      </section>
        
      {/* Features Section */}
      <section id="features" className="mt-32 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose 
              <span className="bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent"> LendIt</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the future of peer-to-peer lending with cutting-edge security and seamless transactions.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🔒",
                title: "Secure Transactions",
                description: "Bank-level security with multiple payment options including UPI, bank transfers, and crypto.",
                gradient: "from-gray-700 to-gray-900"
              },
              {
                icon: "⚡",
                title: "Smart Contracts",
                description: "Automated loan agreements with built-in payment schedules and dispute resolution.",
                gradient: "from-gray-800 to-black"
              },
              {
                icon: "👥",
                title: "Reputation System",
                description: "Build trust with a transparent reputation system based on lending history.",
                gradient: "from-gray-600 to-gray-800"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="group"
              >
                  <div className="relative p-8 rounded-2xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 hover:border-gray-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-gray-500/25">
                    <motion.div
                      className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl shadow-2xl border border-gray-600`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {feature.icon}
                    </motion.div>
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-gray-300 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-700/5 to-gray-900/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="mt-32 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">How It Works</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Get started with peer-to-peer lending in just three simple steps.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "1",
                title: "Create Account",
                description: "Sign up with your phone number and verify your identity for secure lending.",
                gradient: "from-gray-700 to-gray-900"
              },
              {
                step: "2", 
                title: "Find or Create Loans",
                description: "Browse available loan requests or create your own lending opportunities.",
                gradient: "from-gray-800 to-black"
              },
              {
                step: "3",
                title: "Secure Transfer",
                description: "Complete transactions with our secure payment system and automated contracts.",
                gradient: "from-gray-600 to-gray-800"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center group"
              >
                <motion.div
                  className={`w-20 h-20 bg-gradient-to-r ${step.gradient} rounded-full flex items-center justify-center mb-6 shadow-2xl relative border border-gray-600`}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-white font-bold text-2xl">{step.step}</span>
                  <motion.div
                    className="absolute inset-0 bg-white/20 rounded-full"
                    initial={{ scale: 0 }}
                    whileHover={{ scale: 1.2, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-gray-300 transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-300 leading-relaxed max-w-sm">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="mt-32 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}            className="relative p-12 rounded-3xl bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-2xl border border-gray-700/50 shadow-2xl"
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Security 
                <span className="bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent"> First</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Your money and data are protected with enterprise-grade security
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "End-to-End Encryption",
                  description: "All communications and transactions are encrypted using industry-standard protocols."
                },
                {
                  title: "Smart Contract Security", 
                  description: "Blockchain-based smart contracts ensure transparent and tamper-proof agreements."
                },
                {
                  title: "Identity Verification",
                  description: "Multi-layer identity verification to ensure trustworthy participants."
                },
                {
                  title: "Secure Payment Gateway",
                  description: "Integration with trusted payment processors and crypto wallets."
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start space-x-4 group"
                >                  <motion.div
                    className="w-12 h-12 bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg border border-gray-600"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gray-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800/5 to-black/5 rounded-3xl" />
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="mt-32 px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Ready to Get 
              <span className="bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent"> Started?</span>
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join thousands of users who trust LendIt for their peer-to-peer lending needs.
            </p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <motion.button
                onClick={() => setShowAuth(true)}
                className="px-12 py-4 bg-gradient-to-r from-gray-800 to-black text-white font-bold rounded-xl hover:from-gray-700 hover:to-gray-900 transition-all duration-300 shadow-2xl text-xl relative overflow-hidden group border border-gray-600"
                whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)" }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">Start Lending Today</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-black to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                />
              </motion.button>
              <motion.button 
                className="px-12 py-4 border-2 border-gray-500/50 text-gray-200 font-bold rounded-xl hover:bg-gray-800/20 hover:border-gray-400 transition-all duration-300 text-xl backdrop-blur-sm hover:shadow-lg hover:shadow-gray-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Learn More
              </motion.button>
            </motion.div>
          </motion.div>
        </div>      </section>
      
      {/* Animated Footer */}
      <AnimatedFooter />
          
      <AuthModal open={showAuth} onOpenChange={setShowAuth} />
    </div>
    </>
  );
};

export default Index;
