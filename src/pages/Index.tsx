import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import HowItWorksSection from '@/components/home/HowItWorksSection';
import CTASection from '@/components/home/CTASection';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>CertChain - Blockchain-Based Certificate Verification System</title>
        <meta 
          name="description" 
          content="From Fraud to Fact - Secure, immutable, and instantly verifiable digital certificates using SHA-256 cryptographic hashing and blockchain technology." 
        />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
