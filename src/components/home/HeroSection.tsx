import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, Lock, Zap, ArrowRight } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-accent/20 to-background py-20 lg:py-32">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/30 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container relative">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8">
            <Shield className="h-4 w-4" />
            <span>Blockchain-Powered Security</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
            From Fraud to{' '}
            <span className="text-primary relative">
              Fact
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 10C50 2 150 2 198 10" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Secure, immutable, and instantly verifiable digital certificates 
            using SHA-256 cryptographic hashing and blockchain technology.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link to="/verify">
                Verify Certificate
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base" asChild>
              <Link to="/admin">
                Institution Portal
              </Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex flex-col items-center p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">SHA-256 Hashing</h3>
              <p className="text-sm text-muted-foreground text-center">
                Cryptographic security for tamper-proof certificates
              </p>
            </div>

            <div className="flex flex-col items-center p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Blockchain Storage</h3>
              <p className="text-sm text-muted-foreground text-center">
                Immutable ledger ensures permanent verification
              </p>
            </div>

            <div className="flex flex-col items-center p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Instant Verification</h3>
              <p className="text-sm text-muted-foreground text-center">
                Verify any certificate in seconds via QR code
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
