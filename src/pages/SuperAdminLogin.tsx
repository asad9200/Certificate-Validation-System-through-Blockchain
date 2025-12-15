import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import { signInSuperAdmin } from '@/lib/super-admin-service';

const SuperAdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            toast({
                title: 'Error',
                description: 'Please fill in all fields',
                variant: 'destructive'
            });
            return;
        }

        setIsLoading(true);

        try {
            const { user, error } = await signInSuperAdmin(email, password);

            if (error) {
                toast({
                    title: 'Login Failed',
                    description: error.message || 'Invalid credentials or unauthorized access',
                    variant: 'destructive'
                });
                return;
            }

            if (user) {
                toast({
                    title: 'Welcome Super Admin!',
                    description: 'You have successfully logged in',
                });
                navigate('/super-admin/dashboard');
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'An unexpected error occurred',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Super Admin Login - CertChain</title>
                <meta
                    name="description"
                    content="Secure super admin login to manage institutions and system-wide settings."
                />
            </Helmet>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-purple-500/10 to-background p-4">
                <div className="w-full max-w-md">
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
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800">
                                    <ShieldCheck className="h-7 w-7 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl">Super Admin Portal</CardTitle>
                            <CardDescription>
                                Sign in to manage institutions and system settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter super admin email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
};

export default SuperAdminLogin;
