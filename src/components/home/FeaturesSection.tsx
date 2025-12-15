import { 
  Shield, 
  Hash, 
  QrCode, 
  UserCheck, 
  Building2, 
  FileCheck,
  Lock,
  Globe,
  Fingerprint,
  Database
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Hash,
    title: 'SHA-256 Cryptographic Hashing',
    description: 'Each certificate is hashed using SHA-256 algorithm, creating a unique digital fingerprint that cannot be reversed or duplicated.'
  },
  {
    icon: Database,
    title: 'Blockchain Immutability',
    description: 'Certificate hashes are stored on a blockchain ledger, ensuring they can never be altered, deleted, or tampered with.'
  },
  {
    icon: QrCode,
    title: 'QR Code Verification',
    description: 'Every certificate comes with a unique QR code that enables instant verification by scanning with any smartphone.'
  },
  {
    icon: Lock,
    title: 'Tamper-Proof Security',
    description: 'Any modification to the certificate data results in a different hash, making forgery immediately detectable.'
  },
  {
    icon: Globe,
    title: 'Public Verification',
    description: 'Third parties can verify certificates without needing an account, ensuring transparency and accessibility.'
  },
  {
    icon: Fingerprint,
    title: 'Unique Identity',
    description: 'Each certificate receives a unique identifier and hash, eliminating the possibility of duplicate credentials.'
  }
];

const roles = [
  {
    icon: Building2,
    title: 'For Institutions',
    features: [
      'Issue secure digital certificates',
      'Manage certificate templates',
      'Revoke certificates when needed',
      'View issuance analytics',
      'Generate bulk certificates'
    ]
  },
  {
    icon: UserCheck,
    title: 'For Certificate Holders',
    features: [
      'Access your certificates anytime',
      'Share via QR code or link',
      'Download official copies',
      'Track verification history',
      'Portable digital wallet'
    ]
  },
  {
    icon: FileCheck,
    title: 'For Verifiers',
    features: [
      'No account required',
      'Instant verification results',
      'View certificate details',
      'Scan QR or enter hash',
      'Audit trail available'
    ]
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-card/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Powered by Blockchain Technology
          </h2>
          <p className="text-lg text-muted-foreground">
            Our system combines cryptographic hashing with blockchain immutability 
            to create certificates that cannot be forged or tampered with.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Roles Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Designed for Everyone
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're issuing, holding, or verifying certificates, our platform 
            provides a seamless experience for all users.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((role) => (
            <Card key={role.title} className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <role.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{role.title}</h3>
                </div>
                <ul className="space-y-3">
                  {role.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
