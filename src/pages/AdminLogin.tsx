import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import { signIn, resetPassword } from '@/lib/auth-service';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
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
      const { user, error } = await signIn(email, password);

      if (error) {
        toast({
          title: 'Login Failed',
          description: error.message || 'Invalid email or password',
          variant: 'destructive'
        });
        return;
      }

      if (user) {
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in',
        });
        navigate('/admin');
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to send reset email',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Check your email',
        description: 'Password reset link has been sent to your email',
      });
      setShowResetPassword(false);
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
        <title>Admin Login - CertChain</title>
        <meta
          name="description"
          content="Secure login for institutional administrators to issue and manage digital certificates."
        />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/10 to-background p-4">
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
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                  <Shield className="h-7 w-7 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl">Admin Portal</CardTitle>
              <CardDescription>
                {showResetPassword
                  ? 'Reset your password'
                  : 'Sign in to manage certificates and issuance'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showResetPassword ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your admin email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowResetPassword(false)}
                    disabled={isLoading}
                  >
                    Back to Login
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your admin email"
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
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-sm"
                    onClick={() => setShowResetPassword(true)}
                    disabled={isLoading}
                  >
                    Forgot password?
                  </Button>
                  <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                    Don't have an account?{' '}
                    <Link to="/admin/signup" className="text-primary hover:underline font-medium">
                      Register your institution
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
