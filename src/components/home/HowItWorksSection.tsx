import { FileText, Hash, Database, QrCode, CheckCircle } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Create Certificate',
    description: 'Institution enters certificate details including holder name, course, and credentials.'
  },
  {
    number: '02',
    icon: Hash,
    title: 'Generate Hash',
    description: 'SHA-256 algorithm generates a unique cryptographic hash from the certificate data.'
  },
  {
    number: '03',
    icon: Database,
    title: 'Store on Blockchain',
    description: 'The hash is recorded on the blockchain, creating an immutable proof of issuance.'
  },
  {
    number: '04',
    icon: QrCode,
    title: 'Generate QR Code',
    description: 'A unique QR code is created linking directly to the verification page.'
  },
  {
    number: '05',
    icon: CheckCircle,
    title: 'Instant Verification',
    description: 'Anyone can scan the QR code to instantly verify the certificate authenticity.'
  }
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            From issuance to verification, our system ensures every step is secure, 
            transparent, and tamper-proof.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Connection Line */}
          <div className="absolute left-8 lg:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary to-primary/30 hidden sm:block" />

          {/* Steps */}
          <div className="space-y-12">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className={`relative flex flex-col lg:flex-row items-center gap-6 ${
                  index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                }`}
              >
                {/* Step Content */}
                <div className={`flex-1 ${index % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                  <div className={`inline-flex flex-col ${index % 2 === 0 ? 'lg:items-end' : 'lg:items-start'}`}>
                    <span className="text-sm font-bold text-primary mb-2">{step.number}</span>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-muted-foreground max-w-sm">{step.description}</p>
                  </div>
                </div>

                {/* Icon */}
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                  <step.icon className="h-8 w-8" />
                </div>

                {/* Spacer for alignment */}
                <div className="flex-1 hidden lg:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
