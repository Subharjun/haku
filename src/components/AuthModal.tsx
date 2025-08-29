
import { useState } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Phone, Mail } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  const { login, signUp, loginWithPhone, loginWithGoogle, loading } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginEmail, loginPassword);
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
    } catch (error: any) {
      console.error('Login failed:', error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signUp(signUpName, signUpEmail, signUpPassword);
      toast({
        title: "Success",
        description: "Account created successfully! Please check your email to verify your account.",
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Sign up failed:', error);
      toast({
        title: "Sign Up Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithPhone(phoneNumber);
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code.",
      });
    } catch (error: any) {
      console.error('Phone login failed:', error);
      toast({
        title: "Phone Login Failed",
        description: error.message || "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error('Google login failed:', error);
      toast({
        title: "Google Login Failed",
        description: error.message || "Failed to login with Google. Please try again.",
        variant: "destructive",
      });
    }
  };  if (showPhoneLogin) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-gray-900 to-black rounded-[30px] border border-gray-700 shadow-[0_5px_30px_rgba(0,0,0,0.6)]">
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-6 text-white">
              Login with <span className="text-gray-400">Phone</span>
            </h2>
            <p className="text-sm text-gray-400 mb-6">Enter your phone number to receive an OTP</p>
              <form onSubmit={handlePhoneLogin} className="space-y-4">
              <Input
                type="tel"
                placeholder="+91 12345 67890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-lg p-3 text-sm w-full outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              />
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 text-white text-xs font-semibold py-3 px-11 border-0 rounded-lg uppercase tracking-wider mt-3 cursor-pointer transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>              <button 
                type="button" 
                className="w-full bg-transparent border border-gray-600 text-gray-300 text-xs font-semibold py-3 px-11 rounded-lg uppercase tracking-wider mt-3 cursor-pointer hover:bg-gray-800 transition-all duration-300"
                onClick={() => setShowPhoneLogin(false)}
              >
                Back to Email Login
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  return (    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="auth-modal sm:max-w-[768px] max-w-full min-h-[480px] bg-gradient-to-br from-gray-900 to-black rounded-[30px] border border-gray-700 shadow-[0_5px_30px_rgba(0,0,0,0.6)] p-0 overflow-hidden">
        <div className={`relative w-full h-full transition-all duration-[600ms] ease-in-out ${isActive ? 'container active' : 'container'}`}>
            {/* Sign In Form */}
          <div className={`form-container sign-in absolute top-0 h-full transition-all duration-[600ms] ease-in-out left-0 w-1/2 z-[2] ${isActive ? 'translate-x-full' : ''}`}>
            <form onSubmit={handleLogin} className="bg-gradient-to-br from-gray-900 to-black flex items-center justify-center flex-col px-10 h-full">
              <h1 className="text-2xl font-bold mb-6 text-white">Sign In</h1>
                <div className="flex gap-3 mb-5">
                <button 
                  type="button"
                  onClick={() => setShowPhoneLogin(true)}
                  className="border border-gray-600 rounded-[20%] inline-flex justify-center items-center mx-1 w-10 h-10 hover:bg-gray-800 transition-colors text-gray-300"
                  disabled={loading}
                >
                  <Phone className="h-4 w-4" />
                </button>
                <button 
                  type="button"
                  onClick={handleGoogleLogin}
                  className="border border-gray-600 rounded-[20%] inline-flex justify-center items-center mx-1 w-10 h-10 hover:bg-gray-800 transition-colors text-gray-300"
                  disabled={loading}
                >
                  <Mail className="h-4 w-4" />
                </button>
              </div>
              
              <span className="text-xs text-gray-400 mb-4">or use your email password</span>
                <Input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 my-2 p-3 text-sm rounded-lg w-full outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              />
              <Input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 my-2 p-3 text-sm rounded-lg w-full outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              />
                <a href="#" className="text-gray-400 text-xs no-underline my-4 hover:text-gray-300 transition-colors">Forget Your Password?</a>
              
              <button 
                type="submit" 
                className="bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 text-white text-xs font-semibold py-3 px-11 border-0 rounded-lg uppercase tracking-wider mt-3 cursor-pointer transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                    Logging in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>          {/* Sign Up Form */}
          <div className={`form-container sign-up absolute top-0 h-full transition-all duration-[600ms] ease-in-out left-0 w-1/2 z-[1] ${isActive ? 'translate-x-full opacity-100 z-[5]' : 'opacity-0'} ${isActive ? 'animate-[move_0.6s]' : ''}`}>
            <form onSubmit={handleSignUp} className="bg-gradient-to-br from-gray-900 to-black flex items-center justify-center flex-col px-10 h-full">
              <h1 className="text-2xl font-bold mb-6 text-white">Create Account</h1>
                <div className="flex gap-3 mb-5">
                <button 
                  type="button"
                  onClick={() => setShowPhoneLogin(true)}
                  className="border border-gray-600 rounded-[20%] inline-flex justify-center items-center mx-1 w-10 h-10 hover:bg-gray-800 transition-colors text-gray-300"
                  disabled={loading}
                >
                  <Phone className="h-4 w-4" />
                </button>
                <button 
                  type="button"
                  onClick={handleGoogleLogin}
                  className="border border-gray-600 rounded-[20%] inline-flex justify-center items-center mx-1 w-10 h-10 hover:bg-gray-800 transition-colors text-gray-300"
                  disabled={loading}
                >
                  <Mail className="h-4 w-4" />
                </button>
              </div>
              
              <span className="text-xs text-gray-400 mb-4">or use your email for registration</span>
                <Input
                type="text"
                placeholder="Full Name"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                required
                className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 my-2 p-3 text-sm rounded-lg w-full outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              />
              <Input
                type="email"
                placeholder="Email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                required
                className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 my-2 p-3 text-sm rounded-lg w-full outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              />
              <Input
                type="password"
                placeholder="Password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                required
                className="bg-gray-800 border border-gray-700 text-white placeholder-gray-400 my-2 p-3 text-sm rounded-lg w-full outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              />
                <button 
                type="submit" 
                className="bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 text-white text-xs font-semibold py-3 px-11 border-0 rounded-lg uppercase tracking-wider mt-3 cursor-pointer transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                    Creating account...
                  </>
                ) : (
                  'Sign Up'
                )}
              </button>
            </form>
          </div>          {/* Toggle Container */}
          <div className={`toggle-container absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-all duration-[600ms] ease-in-out z-[1000] ${isActive ? '-translate-x-full rounded-r-[150px] rounded-bl-[100px] rounded-tl-0' : 'rounded-l-[150px] rounded-br-[100px] rounded-tr-0'}`}>
            <div className={`toggle h-full bg-gradient-to-r from-gray-700 via-gray-800 to-black text-white relative -left-full w-[200%] transition-all duration-[600ms] ease-in-out ${isActive ? 'translate-x-1/2' : 'translate-x-0'}`}>
              
              {/* Toggle Left Panel */}
              <div className={`toggle-panel toggle-left absolute w-1/2 h-full flex items-center justify-center flex-col px-8 text-center top-0 transition-all duration-[600ms] ease-in-out ${isActive ? 'translate-x-0' : '-translate-x-[200%]'}`}>
                <h1 className="text-2xl font-bold mb-4">Welcome Back!</h1>
                <p className="text-sm leading-5 tracking-wide mb-5">Enter your personal details to use all of site features</p>                <button 
                  type="button"
                  onClick={() => setIsActive(false)}
                  className="bg-transparent border border-gray-400 text-white text-xs font-semibold py-3 px-11 rounded-lg uppercase tracking-wider mt-3 cursor-pointer hover:bg-white/10 transition-all duration-300"
                >
                  Sign In
                </button>
              </div>

              {/* Toggle Right Panel */}
              <div className={`toggle-panel toggle-right absolute w-1/2 h-full flex items-center justify-center flex-col px-8 text-center top-0 right-0 transition-all duration-[600ms] ease-in-out ${isActive ? 'translate-x-[200%]' : 'translate-x-0'}`}>
                <h1 className="text-2xl font-bold mb-4">Hello, Friend!</h1>
                <p className="text-sm leading-5 tracking-wide mb-5">Register with your personal details to use all of site features</p>                <button 
                  type="button"
                  onClick={() => setIsActive(true)}
                  className="bg-transparent border border-gray-400 text-white text-xs font-semibold py-3 px-11 rounded-lg uppercase tracking-wider mt-3 cursor-pointer hover:bg-white/10 transition-all duration-300"
                >
                  Sign Up
                </button>
              </div>
            </div>          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
