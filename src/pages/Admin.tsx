import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield,
  Plus,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  ScanLine,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatDate, truncateHash } from '@/lib/certificate-utils';
import {
  getCertificates,
  createCertificate,
  revokeCertificate,
  verifyCertificate,
  subscribeToCertificates,
  type Certificate
} from '@/lib/certificate-service';
import { signOut, getCurrentUser, getCurrentUserProfile } from '@/lib/auth-service';
// getDefaultInstitution removed
import { supabase } from '@/integrations/supabase/client';
import QRCodeDisplay from '@/components/certificates/QRCodeDisplay';
import QRScanner from '@/components/certificates/QRScanner';
import VerificationResult from '@/components/certificates/VerificationResult';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

type TabType = 'dashboard' | 'certificates' | 'recipients' | 'settings' | 'scanner';

const Admin = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    autoVerify: false,
    requireApproval: true,
    darkMode: false
  });
  const [formData, setFormData] = useState({
    holderName: '',
    holderEmail: '',
    courseName: '',
    institutionName: '',
    issueDate: '',
    grade: ''
  });
  const [institutionStatus, setInstitutionStatus] = useState<string | null>(null);
  const [institutionName, setInstitutionName] = useState<string>('');
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadCertificates();

    // Subscribe to real-time certificate changes
    const subscription = subscribeToCertificates((payload) => {
      console.log('Certificate change:', payload);
      loadCertificates();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const checkAuth = async () => {


    const user = await getCurrentUser();


    if (!user) {

      navigate('/admin/login');
      return;
    }

    try {
      const profile = await getCurrentUserProfile();


      if (!profile) {
        toast({
          title: 'Profile Error',
          description: 'Unable to load your profile. Please try logging in again.',
          variant: 'destructive'
        });
        navigate('/admin/login');
        return;
      }

      if (profile.role !== 'admin' && profile.role !== 'issuer') {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access this page',
          variant: 'destructive'
        });
        navigate('/');
        return;
      }

      // Get institution status
      if (profile.institution_id) {

        try {
          const { data: institution, error } = await supabase
            .from('institutions')
            .select('status, name')
            .eq('id', profile.institution_id)
            .single();

          if (error) {
            console.error('Error fetching institution:', error);
          } else if (institution) {
            setInstitutionStatus(institution.status);
            setInstitutionName(institution.name);
            setInstitutionId(profile.institution_id);
            setFormData(prev => ({ ...prev, institutionName: institution.name }));
          }
        } catch (error) {
          console.error('Exception fetching institution:', error);
        }
      } else {
        // No institution_id warning needed in prod
      }
    } catch (error) {
      console.error('Error in checkAuth:', error);
      toast({
        title: 'Authentication Error',
        description: 'Failed to verify your credentials. Please try logging in again.',
        variant: 'destructive'
      });
      navigate('/admin/login');
    }
  };

  const loadCertificates = async () => {
    try {
      const certs = await getCertificates();
      setCertificates(certs);
    } catch (error: any) {
      console.error('Error loading certificates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load certificates',
        variant: 'destructive'
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out',
    });
  };

  const handleIssueCertificate = async () => {
    if (!formData.holderName || !formData.holderEmail || !formData.courseName || !formData.institutionName || !formData.issueDate) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setIsIssuing(true);

    try {
      if (!institutionId) {
        throw new Error('Institution not identified for current user');
      }

      const newCertificate = await createCertificate({
        holderName: formData.holderName,
        holderEmail: formData.holderEmail,
        courseName: formData.courseName,
        institutionId: institutionId,
        institutionName: formData.institutionName || institutionName,
        issueDate: formData.issueDate,
        grade: formData.grade || undefined,
      });

      toast({
        title: 'Certificate Issued!',
        description: `Certificate ${newCertificate.certificate_id} has been recorded on the blockchain`,
      });

      setFormData({
        holderName: '',
        holderEmail: '',
        courseName: '',
        institutionName: institutionName,
        issueDate: '',
        grade: ''
      });
      setIsIssueModalOpen(false);
      loadCertificates();
    } catch (error: any) {
      console.error('Error issuing certificate:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to issue certificate',
        variant: 'destructive'
      });
    } finally {
      setIsIssuing(false);
    }
  };

  const handleRevoke = async (cert: Certificate) => {
    if (cert.status === 'revoked') return;

    try {
      await revokeCertificate(cert.id, 'Revoked by administrator');
      toast({
        title: 'Certificate Revoked',
        description: `Certificate ${cert.certificate_id} has been revoked`,
      });
      loadCertificates();
    } catch (error: any) {
      console.error('Error revoking certificate:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to revoke certificate',
        variant: 'destructive'
      });
    }
  };

  const handleQRScan = async (result: string) => {
    try {
      // Try to parse as URL first
      let hash = result;
      if (result.includes('hash=')) {
        const url = new URL(result);
        hash = url.searchParams.get('hash') || result;
      }

      // Verify the certificate using Supabase
      const verificationData = await verifyCertificate(hash);

      setVerificationResult({
        isValid: verificationData.isValid,
        certificate: verificationData.certificate,
        message: verificationData.message
      });

      toast({
        title: 'QR Code Scanned',
        description: 'Verification complete',
      });
    } catch (error: any) {
      console.error('Error scanning QR code:', error);
      toast({
        title: 'Error',
        description: error.message || 'Invalid QR code format',
        variant: 'destructive'
      });
    }
  };

  const stats = {
    total: certificates.length,
    valid: certificates.filter(c => c.status === 'valid').length,
    revoked: certificates.filter(c => c.status === 'revoked').length,
  };

  // Get unique recipients
  const recipients = certificates.reduce((acc, cert) => {
    const existing = acc.find(r => r.email === cert.holder_email);
    if (existing) {
      existing.certificateCount++;
    } else {
      acc.push({
        name: cert.holder_name,
        email: cert.holder_email,
        certificateCount: 1,
        lastIssued: cert.issue_date
      });
    }
    return acc;
  }, [] as { name: string; email: string; certificateCount: number; lastIssued: string }[]);

  const filteredRecipients = recipients.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'scanner':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5" />
                  QR Code Scanner
                </CardTitle>
                <CardDescription>Scan a certificate QR code to verify its authenticity</CardDescription>
              </CardHeader>
              <CardContent>
                <QRScanner
                  onScan={handleQRScan}
                  onError={(error) => toast({ title: 'Scanner Error', description: error, variant: 'destructive' })}
                />
              </CardContent>
            </Card>

            {verificationResult && (
              <VerificationResult result={verificationResult} />
            )}
          </div>
        );

      case 'recipients':
        return (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Certificate Recipients</CardTitle>
                  <CardDescription>All individuals who have received certificates</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search recipients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Certificates</TableHead>
                      <TableHead>Last Issued</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecipients.length > 0 ? (
                      filteredRecipients.map((recipient) => (
                        <TableRow key={recipient.email}>
                          <TableCell className="font-medium">{recipient.name}</TableCell>
                          <TableCell>{recipient.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{recipient.certificateCount}</Badge>
                          </TableCell>
                          <TableCell>{formatDate(recipient.lastIssued)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveTab('certificates');
                                setSearchQuery(recipient.email);
                              }}
                            >
                              View Certificates
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No recipients found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );

      case 'settings':
        return (
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email when certificates are issued or verified</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Certificate Settings</CardTitle>
                <CardDescription>Configure certificate issuance behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Verify on Issue</Label>
                    <p className="text-sm text-muted-foreground">Automatically verify certificates when issued</p>
                  </div>
                  <Switch
                    checked={settings.autoVerify}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoVerify: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Approval</Label>
                    <p className="text-sm text-muted-foreground">Require admin approval before issuing certificates</p>
                  </div>
                  <Switch
                    checked={settings.requireApproval}
                    onCheckedChange={(checked) => setSettings({ ...settings, requireApproval: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Admin Account</CardTitle>
                <CardDescription>Manage your admin account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Admin Email</Label>
                  <Input value="admin@certchain.edu" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Institution</Label>
                  <Input value="CertChain University" disabled />
                </div>
                <Button variant="outline" className="mt-4">Change Password</Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'certificates':
        const filteredCerts = searchQuery
          ? certificates.filter(c =>
            c.holder_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.holder_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.course_name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          : certificates;

        return (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>All Certificates</CardTitle>
                  <CardDescription>View and manage all issued certificates</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search certificates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Certificate ID</TableHead>
                      <TableHead>Holder</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCerts.map((cert) => (
                      <TableRow key={cert.certificate_id}>
                        <TableCell className="font-mono text-xs">{cert.certificate_id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{cert.holder_name}</p>
                            <p className="text-xs text-muted-foreground">{cert.holder_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{cert.course_name}</TableCell>
                        <TableCell>{formatDate(cert.issue_date)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={cert.status === 'valid' ? 'default' : 'destructive'}
                            className="capitalize"
                          >
                            {cert.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCert(cert);
                                setIsQRModalOpen(true);
                              }}
                            >
                              QR
                            </Button>
                            {cert.status === 'valid' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRevoke(cert)}
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Certificates</p>
                      <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valid</p>
                      <p className="text-3xl font-bold text-foreground">{stats.valid}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                      <XCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Revoked</p>
                      <p className="text-3xl font-bold text-foreground">{stats.revoked}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Certificates Table */}
            <Card>
              <CardHeader>
                <CardTitle>Issued Certificates</CardTitle>
                <CardDescription>Manage all certificates issued by your institution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Certificate ID</TableHead>
                        <TableHead>Holder</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificates.map((cert) => (
                        <TableRow key={cert.certificate_id}>
                          <TableCell className="font-mono text-xs">{cert.certificate_id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{cert.holder_name}</p>
                              <p className="text-xs text-muted-foreground">{cert.holder_email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{cert.course_name}</TableCell>
                          <TableCell>{formatDate(cert.issue_date)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={cert.status === 'valid' ? 'default' : 'destructive'}
                              className="capitalize"
                            >
                              {cert.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCert(cert);
                                  setIsQRModalOpen(true);
                                }}
                              >
                                QR
                              </Button>
                              {cert.status === 'valid' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleRevoke(cert)}
                                >
                                  Revoke
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        );
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'scanner': return 'QR Scanner';
      case 'recipients': return 'Recipients';
      case 'settings': return 'Settings';
      case 'certificates': return 'Certificates';
      default: return 'Dashboard';
    }
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - CertChain</title>
        <meta name="description" content="Manage and issue digital certificates through the CertChain admin portal." />
      </Helmet>
      <div className="min-h-screen flex bg-background">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 lg:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">CertChain</span>
              </Link>
              <button
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-foreground" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              <Button
                variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3"
                onClick={() => { setActiveTab('dashboard'); setSearchQuery(''); }}
              >
                <BarChart3 className="h-5 w-5" />
                Dashboard
              </Button>
              <Button
                variant={activeTab === 'certificates' ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3"
                onClick={() => { setActiveTab('certificates'); setSearchQuery(''); }}
              >
                <FileText className="h-5 w-5" />
                Certificates
              </Button>
              <Button
                variant={activeTab === 'scanner' ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3"
                onClick={() => { setActiveTab('scanner'); setVerificationResult(null); }}
              >
                <ScanLine className="h-5 w-5" />
                QR Scanner
              </Button>
              <Button
                variant={activeTab === 'recipients' ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3"
                onClick={() => { setActiveTab('recipients'); setSearchQuery(''); }}
              >
                <Users className="h-5 w-5" />
                Recipients
              </Button>
              <Button
                variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-3"
                onClick={() => setActiveTab('settings')}
              >
                <Settings className="h-5 w-5" />
                Settings
              </Button>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Pending Approval Banner */}
          {institutionStatus === 'pending' && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-900">Organization Pending Approval</p>
                  <p className="text-sm text-yellow-700">
                    Your organization "{institutionName}" is pending approval by the super admin.
                    You can access the dashboard but cannot issue certificates until approved.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Suspended Banner */}
          {institutionStatus === 'suspended' && (
            <div className="bg-orange-50 border-b border-orange-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-900">Organization Suspended</p>
                  <p className="text-sm text-orange-700">
                    Your organization has been suspended. Please contact the super admin for more information.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  className="lg:hidden p-2"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6 text-foreground" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-foreground">{getTabTitle()}</h1>
                  <p className="text-sm text-muted-foreground">Manage your certificates</p>
                </div>
              </div>
              <Dialog open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="gap-2"
                    disabled={institutionStatus !== 'active'}
                    title={institutionStatus !== 'active' ? 'Organization must be approved to issue certificates' : ''}
                  >
                    <Plus className="h-4 w-4" />
                    Issue Certificate
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Issue New Certificate</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Holder Name *</Label>
                        <Input
                          placeholder="John Doe"
                          value={formData.holderName}
                          onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          value={formData.holderEmail}
                          onChange={(e) => setFormData({ ...formData, holderEmail: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Course / Program *</Label>
                      <Input
                        placeholder="Bachelor of Science in Computer Science"
                        value={formData.courseName}
                        onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Institution Name *</Label>
                      <Input
                        placeholder="University of Technology"
                        value={formData.institutionName}
                        onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Issue Date *</Label>
                        <Input
                          type="date"
                          value={formData.issueDate}
                          onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Grade / Honor</Label>
                        <Input
                          placeholder="Magna Cum Laude"
                          value={formData.grade}
                          onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={handleIssueCertificate}
                      disabled={isIssuing}
                    >
                      {isIssuing ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Issuing to Blockchain...
                        </>
                      ) : (
                        <>
                          <Award className="h-4 w-4 mr-2" />
                          Issue Certificate
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </div>

        {/* QR Modal */}
        <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Certificate QR Code</DialogTitle>
            </DialogHeader>
            {selectedCert && (
              <QRCodeDisplay certificateHash={selectedCert.hash} certificateId={selectedCert.id} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Admin;
