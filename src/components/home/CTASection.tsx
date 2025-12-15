import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-20 bg-primary">
      <div className="container">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/10 mb-6">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Secure Your Credentials?
          </h2>
          
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl">
            Join thousands of institutions and professionals who trust our blockchain-based 
            verification system for tamper-proof digital certificates.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              variant="secondary"
              className="h-12 px-8 text-base"
              asChild
            >
              <Link to="/verify">
                Verify a Certificate
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="h-12 px-8 text-base bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link to="/admin">
                Get Started as Institution
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
