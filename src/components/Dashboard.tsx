import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useWeb3 } from "@/contexts/Web3Context";
import { TrustScoreDisplay } from "@/components/TrustScoreDisplay";
import { useTrustScore } from "@/hooks/useTrustScore";
import CreateLoanModal from "@/components/CreateLoanModal";
import { LoanRequestModal } from "@/components/LoanRequestModal";
import { RequestLoanModal } from "@/components/RequestLoanModal";
import { BrowseLoanRequests } from "@/components/BrowseLoanRequests";
import { MyLoanRequests } from "@/components/MyLoanRequests";
import { LoanManagementDashboard } from "@/components/LoanManagementDashboard";
import { EnhancedNotificationSystem } from "@/components/EnhancedNotificationSystem";
import AgreementList from "@/components/AgreementList";
import TransactionHistory from "@/components/TransactionHistory";
import NotificationSystem from "@/components/NotificationSystem";
import Preloader from "@/components/Preloader";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from "@/utils/currency";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  FileText, 
  Plus, 
  Bell,
  Settings,
  LogOut,
  Star,
  CreditCard,
  Activity,
  Wallet
} from "lucide-react";
import { TrustScoreDisplay } from "@/components/TrustScoreDisplay";
import { useTrustScore } from "@/hooks/useTrustScore";

interface LoanRequest {
  id: string;
  borrowerName: string;
  amount: number;
  purpose: string;
  requestDate: string;
}

interface DashboardStats {
  totalLent: number;
  totalBorrowed: number;
  activeLoans: number;
  completedLoans: number;
}

const Dashboard = () => {  const { user, logout } = useAuth();
  const web3Context = useWeb3();
  const { 
    account, 
    isConnected, 
    connectWallet, 
    disconnectWallet, 
    balance, 
    networkName, 
    loading: web3Loading 
  } = web3Context;
  
  // Trust score hook
  const { trustScore, tier, loading: trustScoreLoading } = useTrustScore();
  
  // Memoize wallet display values to prevent unnecessary re-renders
  const walletDisplayValues = useMemo(() => ({
    isConnected,
    account: account ? `${account.slice(0, 6)}...${account.slice(-4)}` : null,
    balance: balance ? `${parseFloat(balance).toFixed(4)} ETH` : '0.0000 ETH',
    networkName: networkName || 'Unknown Network'
  }), [isConnected, account, balance, networkName]);  const { toast } = useToast();const [showCreateLoan, setShowCreateLoan] = useState(false);
  const [showRequestLoan, setShowRequestLoan] = useState(false);
  const [showLoanRequest, setShowLoanRequest] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LoanRequest | null>(null);const [stats, setStats] = useState<DashboardStats>({
    totalLent: 0,
    totalBorrowed: 0,
    activeLoans: 0,
    completedLoans: 0
  });
  const [pendingRequests, setPendingRequests] = useState<LoanRequest[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {      // Fetch loan agreements where user is lender or borrower
      const { data: agreements, error } = await supabase
        .from('loan_agreements')
        .select('*')
        .or(`lender_id.eq.${user.id},borrower_id.eq.${user.id}`);

      if (error) throw error;

      // Calculate stats
      let totalLent = 0;
      let totalBorrowed = 0;
      let activeLoans = 0;
      let completedLoans = 0;
      const requests: LoanRequest[] = [];      agreements?.forEach(agreement => {
        // Convert string amount to number for calculations
        const amount = parseFloat(agreement.amount.toString());
        
        if (agreement.lender_id === user.id) {
          // User is the lender
          totalLent += amount;
          if (agreement.status === 'active' || agreement.status === 'funded') activeLoans++;
          if (agreement.status === 'completed' || agreement.status === 'repaid') completedLoans++;
        } else if (agreement.borrower_id === user.id) {
          // User is the borrower
          totalBorrowed += amount;
          if (agreement.status === 'active' || agreement.status === 'funded') activeLoans++;
          if (agreement.status === 'completed' || agreement.status === 'repaid') completedLoans++;
        }

        // Add pending requests where user is lender
        if (agreement.lender_id === user.id && agreement.status === 'pending') {
          requests.push({
            id: agreement.id,
            borrowerName: agreement.borrower_name || 'Unknown',
            amount: amount,
            purpose: agreement.purpose || 'No purpose specified',
            requestDate: agreement.created_at
          });
        }
      });setStats({ totalLent, totalBorrowed, activeLoans, completedLoans });
      setPendingRequests(requests);
      setAgreements(agreements || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request: LoanRequest) => {
    setSelectedRequest(request);
    setShowLoanRequest(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <>
      <Preloader />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Lendit</span>
              </div>
            </div>
              <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Notifications",
                    description: "Check the 'Notifications' tab below for all your alerts and updates.",
                  });
                }}
              >
                <Bell className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  toast({
                    title: "Settings",
                    description: "Settings panel will be available in a future update. Contact support for account changes.",
                  });
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">Score: {user?.reputationScore}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>          <p className="text-gray-600 mt-2">
            Manage your lending and borrowing activities and track your reputation
          </p>
        </div>        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => setShowCreateLoan(true)}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Lend Money
            </Button>            <Button 
              onClick={() => setShowRequestLoan(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Request Loan            </Button>
              {/* Wallet Connection Button */}
            {!isConnected ? (
              <Button 
                onClick={connectWallet}
                variant="outline"
                disabled={web3Loading}
                className="border-orange-300 text-orange-600 hover:bg-orange-50"
              >
                <Wallet className="mr-2 h-4 w-4" />
                {web3Loading ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            ) : (
              <Button 
                onClick={disconnectWallet}
                variant="outline"
                size="sm"
                className="border-green-300 text-green-600 hover:bg-green-50"
              >
                <Wallet className="mr-2 h-4 w-4" />
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </Button>
            )}
              <Button 
              variant="outline"
              onClick={() => {
                toast({
                  title: "Contact Management",
                  description: "Contact management feature coming soon! For now, you can send loan invitations by email when creating loans.",
                });
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              View Contacts
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                toast({
                  title: "My Agreements",
                  description: "Check the 'Manage' tab below to view and manage all your loan agreements.",
                });
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              My Agreements
            </Button>
          </div>
        </div>        {/* Wallet Status Card - Add this before Stats Cards */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="mr-2 h-5 w-5" />
              Wallet & Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Wallet Connection */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Wallet Connection</p>
                  <p className="text-xs text-gray-500">
                    {walletDisplayValues.isConnected ? `Connected: ${walletDisplayValues.account}` : 'Not Connected'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={walletDisplayValues.isConnected ? "default" : "outline"}>
                    {walletDisplayValues.isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                  {!walletDisplayValues.isConnected && (
                    <Button size="sm" onClick={connectWallet} disabled={web3Loading}>
                      {web3Loading ? 'Connecting...' : 'Connect'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Network Status */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">Network</p>
                  <p className="text-xs text-gray-500">
                    {walletDisplayValues.networkName}
                  </p>
                </div>
                <Badge variant={walletDisplayValues.networkName === 'localhost' ? "default" : "outline"}>
                  {walletDisplayValues.networkName}
                </Badge>
              </div>

              {/* Balance */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">ETH Balance</p>
                  <p className="text-xs text-gray-500">
                    {walletDisplayValues.balance}
                  </p>
                </div>
                <Badge variant={balance && parseFloat(balance) > 0 ? "default" : "outline"}>
                  {balance && parseFloat(balance) > 0 ? 'Funded' : 'No Balance'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lent</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalLent)}</div>
              <p className="text-xs text-muted-foreground">
                Active lending portfolio
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalBorrowed)}</div>
              <p className="text-xs text-muted-foreground">
                Active borrowing
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeLoans}</div>
              <p className="text-xs text-muted-foreground">
                Currently ongoing
              </p>
            </CardContent>
          </Card>          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trust Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />            </CardHeader>
            <CardContent>
              {trustScoreLoading ? (
                <div className="text-2xl font-bold text-gray-400">Loading...</div>
              ) : trustScore ? (
                <TrustScoreDisplay 
                  score={trustScore.overall_score}
                  tier={trustScore.score_tier}
                  size="small"
                  showDetails={true}
                />
              ) : (
                <div className="text-2xl font-bold text-gray-400">--</div>
              )}
              <p className="text-xs text-muted-foreground">
                {tier ? `${tier.name} tier benefits` : 'Build your reputation'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Tabs */}
        <Tabs defaultValue="overview" className="space-y-6"><TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="management">Manage</TabsTrigger>
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
            <TabsTrigger value="agreements">Agreements</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Quick Stats */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">                    <Button 
                      onClick={() => setShowCreateLoan(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Lend Money
                    </Button>
                    
                    <Button 
                      onClick={() => setShowRequestLoan(true)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Request Loan
                    </Button>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Active Loans</span>
                        <span className="font-medium">{stats.activeLoans}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completed</span>
                        <span className="font-medium">{stats.completedLoans}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pending Requests</span>
                        <span className="font-medium">{pendingRequests.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>              {/* Right Column - Recent Activity */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest lending and borrowing activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {agreements.length > 0 ? (
                      <div className="space-y-3">
                        {agreements
                          .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
                          .slice(0, 5)
                          .map((agreement) => (
                            <div key={agreement.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {agreement.lender_id === user?.id 
                                      ? `Loan to ${agreement.borrower_name}`
                                      : `Loan from ${agreement.lender_name}`}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatCurrency(agreement.amount)} • {agreement.status}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={
                                agreement.status === 'pending' ? 'outline' :
                                agreement.status === 'accepted' ? 'default' :
                                agreement.status === 'funded' ? 'default' :
                                agreement.status === 'completed' ? 'default' : 'outline'
                              }>
                                {agreement.status}
                              </Badge>
                            </div>
                          ))}
                        {agreements.length > 5 && (
                          <p className="text-xs text-gray-500 text-center pt-2">
                            View all agreements in the "Agreements" tab
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No loan activity yet</p>
                        <p className="text-xs text-gray-400">Create your first loan to get started</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div></div>
          </TabsContent>          <TabsContent value="management">
            <LoanManagementDashboard />
          </TabsContent>

          <TabsContent value="my-requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  My Loan Requests
                  <Button 
                    onClick={() => setShowRequestLoan(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Request
                  </Button>
                </CardTitle>
                <CardDescription>
                  Track the status of your loan requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MyLoanRequests onCreateNew={() => setShowRequestLoan(true)} />
              </CardContent>
            </Card>
          </TabsContent>          <TabsContent value="browse">
            <BrowseLoanRequests onOfferLoan={(request) => {
              // Handle making an offer on a loan request
              toast({
                title: "Feature Coming Soon",
                description: `Loan offer system for ${request.borrower_name}'s request is being developed.`,
              });
            }} />
          </TabsContent>

          <TabsContent value="agreements">
            <AgreementList 
              agreements={agreements} 
              currentUserId={user?.id || ''} 
              onUpdate={fetchDashboardData}
            />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionHistory userId={user?.id || ''} />
          </TabsContent>          <TabsContent value="notifications">
            <EnhancedNotificationSystem />
          </TabsContent><TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Loan Requests to Me
                  <Badge variant="secondary">{pendingRequests.length}</Badge>
                </CardTitle>
                <CardDescription>
                  People who want to borrow from you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((request) => (
                    <div 
                      key={request.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleViewRequest(request)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{request.borrowerName}</h4>
                        <Badge variant="outline">{formatCurrency(request.amount)}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{request.purpose}</p>
                      <p className="text-xs text-gray-500">
                        Requested on {new Date(request.requestDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No pending requests</h3>
                    <p className="text-gray-500">
                      When people request loans from you, they will appear here.
                    </p>
                  </div>
                )}              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>      <CreateLoanModal open={showCreateLoan} onOpenChange={setShowCreateLoan} />
      <RequestLoanModal open={showRequestLoan} onOpenChange={setShowRequestLoan} />
      {selectedRequest && (
        <LoanRequestModal 
          open={showLoanRequest}          onOpenChange={setShowLoanRequest}
          request={selectedRequest}
        />
      )}
    </div>
    </>
  );
};

export default Dashboard;
