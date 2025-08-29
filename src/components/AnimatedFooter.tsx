import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const AnimatedFooter = () => {
  const footerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const footer = footerRef.current;
    const logo = logoRef.current;
    const links = linksRef.current;
    const social = socialRef.current;
    const bottom = bottomRef.current;

    if (!footer || !logo || !links || !social || !bottom) return;

    // Create timeline for staggered animations
    const tl = gsap.timeline({ paused: true });

    tl.from(logo, {
      duration: 1,
      y: 30,
      opacity: 0,
      ease: "power3.out"
    })
    .from(links.children, {
      duration: 0.8,
      y: 20,
      opacity: 0,
      stagger: 0.1,
      ease: "power2.out"
    }, "-=0.5")
    .from(social.children, {
      duration: 0.6,
      scale: 0,
      opacity: 0,
      stagger: 0.1,
      ease: "back.out(1.7)"
    }, "-=0.3")
    .from(bottom, {
      duration: 0.8,
      y: 20,
      opacity: 0,
      ease: "power2.out"
    }, "-=0.2");

    // Intersection Observer for scroll trigger
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            tl.play();
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(footer);

    // Cleanup
    return () => {
      observer.disconnect();
      tl.kill();
    };
  }, []);

  const footerLinks = {
    Company: ["About Us", "Careers", "Press", "Blog"],
    Product: ["Features", "Pricing", "API", "Documentation"],
    Support: ["Help Center", "Contact", "Terms of Service", "Privacy Policy"],
    Community: ["Discord", "Twitter", "GitHub", "Newsletter"]
  };

  const socialIcons = [
    { name: "Twitter", icon: "𝕏", href: "#" },
    { name: "Discord", icon: "💬", href: "#" },
    { name: "GitHub", icon: "⚙️", href: "#" },
    { name: "LinkedIn", icon: "💼", href: "#" }
  ];

  return (    <motion.footer
      ref={footerRef}
      className="relative z-10 mt-32 border-t border-gray-800/50 bg-gradient-to-b from-transparent via-gray-900/20 to-gray-900/40 footer-backdrop footer-glow"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-500/50 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
          {/* Logo and Description */}
          <motion.div 
            ref={logoRef}
            className="lg:col-span-4"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center mb-6">
              <motion.div 
                className="w-12 h-12 bg-gradient-to-r from-gray-800 to-black rounded-2xl flex items-center justify-center shadow-xl border border-gray-600"
                whileHover={{ rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="text-white font-bold text-2xl">L</span>
              </motion.div>
              <span className="ml-3 text-2xl font-bold text-white">LendIt</span>
            </div>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              Revolutionizing peer-to-peer lending with blockchain technology. 
              Secure, transparent, and accessible financial solutions for everyone.
            </p>
            {/* Newsletter Signup */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent backdrop-blur-sm"
              />
              <motion.button
                className="px-6 py-3 bg-gradient-to-r from-black to-gray-800 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-gray-500/25 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Subscribe
              </motion.button>
            </div>
          </motion.div>

          {/* Links Grid */}
          <div ref={linksRef} className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="text-white font-semibold text-lg mb-4">{category}</h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>                      <motion.a
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors duration-300 text-base footer-link"
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {link}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gray-700/50 to-transparent mb-8" />

        {/* Bottom Section */}
        <div ref={bottomRef} className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-gray-400 text-base">
            © 2024 LendIt. All rights reserved. Built with ❤️ for the future of finance.
          </div>
          
          {/* Social Icons */}
          <div ref={socialRef} className="flex items-center space-x-4">
            {socialIcons.map((social) => (              <motion.a
                key={social.name}
                href={social.href}
                className="w-12 h-12 bg-gray-800/50 border border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 hover:border-gray-600 transition-all duration-300 footer-backdrop social-icon"
                whileHover={{ 
                  scale: 1.1,
                  rotate: 10,
                  backgroundColor: "rgba(55, 65, 81, 0.8)"
                }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300 }}
                title={social.name}
              >
                <span className="text-lg">{social.icon}</span>
              </motion.a>
            ))}
          </div>
        </div>

        {/* Floating elements for visual interest */}
        <motion.div
          className="absolute top-10 right-10 w-2 h-2 bg-gray-600 rounded-full opacity-30"
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-1 h-1 bg-gray-500 rounded-full opacity-40"
          animate={{
            y: [0, -15, 0],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>
    </motion.footer>
  );
};

export default AnimatedFooter;
