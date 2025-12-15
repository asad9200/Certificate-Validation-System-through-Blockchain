import { Link } from 'react-router-dom';
import { Shield, Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">CertChain</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Secure, immutable, and instantly verifiable digital certificates 
              powered by blockchain technology.
            </p>
            
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/verify" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Verify Certificate
                </Link>
              </li>
              <li>
                <Link to="/holder" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  My Certificates
                </Link>
              </li>
            </ul>
          </div>

          {/* For Institutions */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">For Institutions</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/admin" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Admin Portal
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Integration Guide
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  API Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} CertChain. From Fraud to Fact - Blockchain-Based Certificate Verification.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
