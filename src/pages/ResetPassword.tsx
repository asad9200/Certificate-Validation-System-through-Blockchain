import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';
import { updatePassword } from '@/lib/auth-service';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleSessionCheck = async () => {
      // First check if there is a hash in the URL, which implies we are in a recovery flow
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        // We are likely fine, wait for Supabase to process the hash
        return;
      }

      // Check current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // If no session and no hash, check one more time after a short delay
        // as the auth state change might be pending
        setTimeout(async () => {
          const { data: { session: delayedSession } } = await supabase.auth.getSession();
          if (!delayedSession) {
            toast({
              title: 'Invalid Link',
              description: 'This password reset link is invalid or has expired.',
              variant: 'destructive',
            });
            navigate('/admin/login');
          }
        }, 1000);
      }
    };

    handleSessionCheck();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // This event is fired when the user clicks the recovery link, handled automatically by Supabase client
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await updatePassword(password);

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update password',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Your password has been updated successfully. Please login with your new password.',
      });

      // Sign out to force re-login with new password just to be clean, or redirect to dashboard.
      // Usually better to redirect to login to confirm they know the new password.
      await supabase.auth.signOut();
      navigate('/admin/login');
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
        <title>Reset Password - CertChain</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/10 to-background p-4">
        <div className="w-full max-w-md">
          <Card className="border-border shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                  <Shield className="h-7 w-7 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl">Reset Password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter new password"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      className="pl-9"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
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
                      Updating...
                    </>
                  ) : (
                    'Update Password'
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

export default ResetPassword;
