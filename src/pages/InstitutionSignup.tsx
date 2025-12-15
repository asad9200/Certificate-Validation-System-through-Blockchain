import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, ArrowLeft, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import { signUp } from '@/lib/auth-service';
import { createInstitution } from '@/lib/institution-service';

const InstitutionSignup = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        // Institution details
        institutionName: '',
        institutionEmail: '',
        institutionWebsite: '',
        institutionAddress: '',
        institutionPhone: '',
        // Admin user details
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        confirmPassword: '',
    });
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        // Check required fields
        if (!formData.institutionName || !formData.institutionEmail ||
            !formData.adminName || !formData.adminEmail ||
            !formData.adminPassword || !formData.confirmPassword) {
            toast({
                title: 'Missing Information',
                description: 'Please fill in all required fields',
                variant: 'destructive'
            });
            return false;
        }

        // Validate email formats
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.institutionEmail)) {
            toast({
                title: 'Invalid Email',
                description: 'Please enter a valid institution email',
                variant: 'destructive'
            });
            return false;
        }
        if (!emailRegex.test(formData.adminEmail)) {
            toast({
                title: 'Invalid Email',
                description: 'Please enter a valid admin email',
                variant: 'destructive'
            });
            return false;
        }

        // Validate password
        if (formData.adminPassword.length < 6) {
            toast({
                title: 'Weak Password',
                description: 'Password must be at least 6 characters long',
                variant: 'destructive'
            });
            return false;
        }

        // Check password match
        if (formData.adminPassword !== formData.confirmPassword) {
            toast({
                title: 'Password Mismatch',
                description: 'Passwords do not match',
                variant: 'destructive'
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Step 1: Create the institution with pending status
            const { data: institution, error: instError } = await createInstitution({
                name: formData.institutionName,
                email: formData.institutionEmail,
                website: formData.institutionWebsite || null,
                address: formData.institutionAddress || null,
                phone: formData.institutionPhone || null,
                status: 'pending', // Set to pending for super admin approval
            });

            if (instError || !institution) {
                throw new Error(instError?.message || 'Failed to create institution');
            }

            // Step 2: Sign up the admin user
            const { user, error: signUpError } = await signUp(
                formData.adminEmail,
                formData.adminPassword,
                formData.adminName,
                institution.id,
                'admin'
            );

            if (signUpError) {
                throw new Error(signUpError.message || 'Failed to create admin account');
            }

            toast({
                title: 'Registration Successful!',
                description: 'Your institution has been registered and is pending approval by the super admin. You will be notified once approved.',
            });

            setTimeout(() => navigate('/admin/login'), 2000);
        } catch (error: any) {
            console.error('Registration error:', error);
            toast({
                title: 'Registration Failed',
                description: error.message || 'Failed to register institution',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Institution Registration - CertChain</title>
                <meta
                    name="description"
                    content="Register your institution to start issuing verified digital certificates on the blockchain."
                />
            </Helmet>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/10 to-background p-4">
                <div className="w-full max-w-2xl">
                    {/* Back Link */}
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>

                    <Card className="border-border shadow-lg">
                        <CardHeader className="text-center pb-4">
                            <div className="flex justify-center mb-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                                    <Building2 className="h-7 w-7 text-primary-foreground" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl">Register Your Institution</CardTitle>
                            <CardDescription>
                                Join CertChain to issue verified digital certificates
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Institution Information */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <Building2 className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold">Institution Information</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="institutionName">Institution Name *</Label>
                                            <Input
                                                id="institutionName"
                                                placeholder="e.g., University of Technology"
                                                value={formData.institutionName}
                                                onChange={(e) => handleChange('institutionName', e.target.value)}
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="institutionEmail">Institution Email *</Label>
                                            <Input
                                                id="institutionEmail"
                                                type="email"
                                                placeholder="contact@institution.edu"
                                                value={formData.institutionEmail}
                                                onChange={(e) => handleChange('institutionEmail', e.target.value)}
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="institutionWebsite">Website</Label>
                                            <Input
                                                id="institutionWebsite"
                                                type="url"
                                                placeholder="https://institution.edu"
                                                value={formData.institutionWebsite}
                                                onChange={(e) => handleChange('institutionWebsite', e.target.value)}
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="institutionAddress">Address</Label>
                                            <Input
                                                id="institutionAddress"
                                                placeholder="123 Education Street, City"
                                                value={formData.institutionAddress}
                                                onChange={(e) => handleChange('institutionAddress', e.target.value)}
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="institutionPhone">Phone</Label>
                                            <Input
                                                id="institutionPhone"
                                                type="tel"
                                                placeholder="+1-234-567-8900"
                                                value={formData.institutionPhone}
                                                onChange={(e) => handleChange('institutionPhone', e.target.value)}
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Admin User Information */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b">
                                        <Shield className="h-5 w-5 text-primary" />
                                        <h3 className="font-semibold">Administrator Account</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="adminName">Full Name *</Label>
                                            <Input
                                                id="adminName"
                                                placeholder="John Doe"
                                                value={formData.adminName}
                                                onChange={(e) => handleChange('adminName', e.target.value)}
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="adminEmail">Email *</Label>
                                            <Input
                                                id="adminEmail"
                                                type="email"
                                                placeholder="admin@institution.edu"
                                                value={formData.adminEmail}
                                                onChange={(e) => handleChange('adminEmail', e.target.value)}
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="adminPassword">Password *</Label>
                                            <Input
                                                id="adminPassword"
                                                type="password"
                                                placeholder="Minimum 6 characters"
                                                value={formData.adminPassword}
                                                onChange={(e) => handleChange('adminPassword', e.target.value)}
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                placeholder="Re-enter password"
                                                value={formData.confirmPassword}
                                                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                                                disabled={isLoading}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating Account...
                                        </>
                                    ) : (
                                        'Register Institution'
                                    )}
                                </Button>

                                <div className="text-center text-sm text-muted-foreground">
                                    Already have an account?{' '}
                                    <Link to="/admin/login" className="text-primary hover:underline">
                                        Sign in here
                                    </Link>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default InstitutionSignup;
