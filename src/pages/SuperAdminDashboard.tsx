import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Building2,
    CheckCircle,
    XCircle,
    Clock,
    Ban,
    Search,
    Shield,
    Award,
} from 'lucide-react';
import {
    isSuperAdmin,
    getAllOrganizations,
    getSystemStats,
    approveOrganization,
    rejectOrganization,
    suspendOrganization,
    activateOrganization,
    signOutSuperAdmin,
    type Organization,
    type SystemStats,
} from '@/lib/super-admin-service';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

export default function SuperAdminDashboard() {
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'suspended' | 'deactivated'>('all');
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | 'suspend' | 'activate' | null>(null);
    const [notes, setNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        checkAuthorization();
    }, []);

    const checkAuthorization = async () => {
        try {
            const isAdmin = await isSuperAdmin();
            if (!isAdmin) {
                toast({
                    variant: 'destructive',
                    title: 'Unauthorized',
                    description: 'You do not have super admin privileges.',
                });
                navigate('/super-admin/login');
                return;
            }
            setAuthorized(true);
            await loadData();
        } catch (error: any) {
            console.error('Authorization check failed:', error);
            navigate('/super-admin/login');
        } finally {
            setLoading(false);
        }
    };

    const loadData = async () => {
        try {
            const [orgsData, statsData] = await Promise.all([
                getAllOrganizations(),
                getSystemStats(),
            ]);
            setOrganizations(orgsData);
            setStats(statsData);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to load data',
            });
        }
    };

    const handleSignOut = async () => {
        await signOutSuperAdmin();
        navigate('/');
    };

    const openActionDialog = (org: Organization, action: typeof actionDialog) => {
        setSelectedOrg(org);
        setActionDialog(action);
        setNotes('');
    };

    const closeActionDialog = () => {
        setSelectedOrg(null);
        setActionDialog(null);
        setNotes('');
    };

    const handleAction = async () => {
        if (!selectedOrg || !actionDialog) return;

        setActionLoading(true);
        try {
            switch (actionDialog) {
                case 'approve':
                    await approveOrganization(selectedOrg.id, notes);
                    toast({
                        title: 'Organization Approved',
                        description: `${selectedOrg.name} can now issue certificates.`,
                    });
                    break;
                case 'reject':
                    if (!notes) {
                        toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: 'Please provide a reason for rejection.',
                        });
                        return;
                    }
                    await rejectOrganization(selectedOrg.id, notes);
                    toast({
                        title: 'Organization Rejected',
                        description: `${selectedOrg.name} has been deactivated.`,
                    });
                    break;
                case 'suspend':
                    if (!notes) {
                        toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: 'Please provide a reason for suspension.',
                        });
                        return;
                    }
                    await suspendOrganization(selectedOrg.id, notes);
                    toast({
                        title: 'Organization Suspended',
                        description: `${selectedOrg.name} has been suspended.`,
                    });
                    break;
                case 'activate':
                    await activateOrganization(selectedOrg.id, notes);
                    toast({
                        title: 'Organization Activated',
                        description: `${selectedOrg.name} is now active.`,
                    });
                    break;
            }
            await loadData();
            closeActionDialog();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to perform action',
            });
        } finally {
            setActionLoading(false);
        }
    };

    const filteredOrganizations = organizations.filter((org) => {
        const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || org.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: Organization['status']) => {
        const variants = {
            pending: { label: 'Pending', icon: Clock, className: 'bg-yellow-100 text-yellow-800' },
            active: { label: 'Active', icon: CheckCircle, className: 'bg-green-100 text-green-800' },
            suspended: { label: 'Suspended', icon: Ban, className: 'bg-orange-100 text-orange-800' },
            deactivated: { label: 'Deactivated', icon: XCircle, className: 'bg-red-100 text-red-800' },
        };
        const variant = variants[status];
        const Icon = variant.icon;
        return (
            <Badge className={variant.className}>
                <Icon className="h-3 w-3 mr-1" />
                {variant.label}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Shield className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-pulse" />
                    <p className="text-gray-600">Loading Super Admin Dashboard...</p>
                </div>
            </div>
        );
    }

    if (!authorized) {
        return null;
    }

    return (
        <>
            <Helmet>
                <title>Super Admin Dashboard - Trust Chain Verified</title>
            </Helmet>

            <div className="min-h-screen flex flex-col bg-gray-50">
                <Header />

                <main className="flex-grow container mx-auto px-4 py-8">
                    {/* Header Section */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                <Shield className="h-8 w-8 text-indigo-600" />
                                Super Admin Dashboard
                            </h1>
                            <p className="text-gray-600 mt-1">Manage organizations and system settings</p>
                        </div>
                        <Button onClick={handleSignOut} variant="outline">
                            Sign Out
                        </Button>
                    </div>

                    {/* Statistics Cards */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
                                    <Building2 className="h-4 w-4 text-gray-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_institutions}</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Organizations</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">{stats.active_institutions}</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-yellow-600">{stats.pending_institutions}</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
                                    <Award className="h-4 w-4 text-indigo-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-indigo-600">{stats.total_certificates}</div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Organizations Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Organizations Management</CardTitle>
                            <CardDescription>View and manage all registered organizations</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search organizations..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {(['all', 'pending', 'active', 'suspended', 'deactivated'] as const).map((status) => (
                                        <Button
                                            key={status}
                                            variant={statusFilter === status ? 'default' : 'outline'}
                                            onClick={() => setStatusFilter(status)}
                                            size="sm"
                                        >
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Organizations Table */}
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Organization</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Certificates</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredOrganizations.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                                    No organizations found
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredOrganizations.map((org) => (
                                                <TableRow key={org.id}>
                                                    <TableCell className="font-medium">{org.name}</TableCell>
                                                    <TableCell>{org.email}</TableCell>
                                                    <TableCell>{getStatusBadge(org.status)}</TableCell>
                                                    <TableCell>{org.certificate_count}</TableCell>
                                                    <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {org.status === 'pending' && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="default"
                                                                        onClick={() => openActionDialog(org, 'approve')}
                                                                    >
                                                                        Approve
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => openActionDialog(org, 'reject')}
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {org.status === 'active' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => openActionDialog(org, 'suspend')}
                                                                >
                                                                    Suspend
                                                                </Button>
                                                            )}
                                                            {(org.status === 'suspended' || org.status === 'deactivated') && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="default"
                                                                    onClick={() => openActionDialog(org, 'activate')}
                                                                >
                                                                    Activate
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </main>

                <Footer />
            </div>

            {/* Action Dialog */}
            <Dialog open={actionDialog !== null} onOpenChange={() => closeActionDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {actionDialog === 'approve' && 'Approve Organization'}
                            {actionDialog === 'reject' && 'Reject Organization'}
                            {actionDialog === 'suspend' && 'Suspend Organization'}
                            {actionDialog === 'activate' && 'Activate Organization'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedOrg && (
                                <>
                                    You are about to {actionDialog} <strong>{selectedOrg.name}</strong>.
                                    {actionDialog === 'approve' && ' They will be able to issue certificates immediately.'}
                                    {actionDialog === 'reject' && ' This will prevent them from accessing the system.'}
                                    {actionDialog === 'suspend' && ' This will temporarily disable their account.'}
                                    {actionDialog === 'activate' && ' This will restore their access to the system.'}
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="notes">
                                {actionDialog === 'approve' ? 'Approval Notes (Optional)' : 'Reason (Required)'}
                            </Label>
                            <Textarea
                                id="notes"
                                placeholder={`Enter ${actionDialog === 'approve' ? 'notes' : 'reason'}...`}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                required={actionDialog !== 'approve'}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={closeActionDialog}
                            disabled={actionLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAction}
                            disabled={actionLoading}
                            variant={actionDialog === 'reject' || actionDialog === 'suspend' ? 'destructive' : 'default'}
                        >
                            {actionLoading ? 'Processing...' : `Confirm ${actionDialog}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
