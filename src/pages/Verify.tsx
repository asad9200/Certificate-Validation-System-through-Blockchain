import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import VerificationResultDisplay from '@/components/certificates/VerificationResult';
import QRScanner from '@/components/certificates/QRScanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, QrCode, Hash, Shield, Loader2 } from 'lucide-react';
import { verifyCertificate } from '@/lib/certificate-service';
import { VerificationResult, Certificate as DisplayCertificate } from '@/lib/certificate-utils';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

// Helper to map DB certificate to Display certificate
const mapCertToDisplay = (dbCert: any): DisplayCertificate => ({
  id: dbCert.certificate_id, // Use the human-readable ID
  hash: dbCert.hash,
  holderName: dbCert.holder_name,
  holderEmail: dbCert.holder_email,
  courseName: dbCert.course_name,
  institutionName: dbCert.institution_name,
  issueDate: dbCert.issue_date,
  grade: dbCert.grade,
  issuerId: dbCert.issuer_id,
  status: dbCert.status,
  blockchainTxId: dbCert.blockchain_tx_id,
  createdAt: dbCert.created_at
});

const Verify = () => {
  const [searchParams] = useSearchParams();
  const initialHash = searchParams.get('hash') || '';

  const [hashInput, setHashInput] = useState(initialHash);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const { toast } = useToast();

  const handleVerify = async () => {
    await verifyHash(hashInput);
  };

  const verifyHash = async (hash: string | null | undefined) => {
    const value = (hash || '').trim();
    if (!value) {
      toast({
        title: 'Error',
        description: 'Please enter or scan a certificate hash',
        variant: 'destructive'
      });
      return;
    }

    setIsVerifying(true);
    setResult(null);

    try {

      // Use real Supabase verification
      const dbResult = await verifyCertificate(value);

      // Map to UI result format
      const uiResult: VerificationResult = {
        isValid: dbResult.isValid,
        status: dbResult.certificate ? (dbResult.certificate.status as any) : 'not_found',
        certificate: dbResult.certificate ? mapCertToDisplay(dbResult.certificate) : undefined,
        verifiedAt: new Date().toISOString(),
        blockchainVerified: true
      };

      // Override status if logic in service determined it invalid despite finding cert
      if (!dbResult.isValid && uiResult.status === 'valid') {
        uiResult.status = 'tampered';
      }

      setResult(uiResult);

      if (uiResult.isValid) {
        toast({
          title: 'Certificate Verified!',
          description: 'This certificate is authentic and valid.',
        });
      } else {
        toast({
          title: 'Verification Failed',
          description: `Status: ${uiResult.status}`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during verification',
        variant: 'destructive'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleScan = async (decodedText: string) => {
    setHashInput(decodedText);
    // verify immediately from scanned value to avoid state timing issues
    await verifyHash(decodedText);
  };

  const handleScanError = (errorMessage?: string) => {
    if (errorMessage) {
      toast({ title: 'Camera Error', description: errorMessage, variant: 'destructive' });
    }
  };

  return (
    <>
      <Helmet>
        <title>Verify Certificate - CertChain</title>
        <meta
          name="description"
          content="Instantly verify any certificate using its unique hash or QR code. Blockchain-powered verification ensures authenticity."
        />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12 bg-background">
          <div className="container max-w-3xl">
            {/* Page Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
                <Shield className="h-4 w-4" />
                <span>Blockchain Verification</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Verify a Certificate
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Enter the certificate hash or scan the QR code to instantly verify
                the authenticity of any certificate issued through our system.
              </p>
            </div>

            {/* Verification Form */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Certificate Verification</CardTitle>
                <CardDescription>
                  Choose your preferred verification method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="hash" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="hash" className="gap-2">
                      <Hash className="h-4 w-4" />
                      Enter Hash
                    </TabsTrigger>
                    <TabsTrigger value="qr" className="gap-2">
                      <QrCode className="h-4 w-4" />
                      Scan QR
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="hash" className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Certificate Hash (SHA-256)
                      </label>
                      <Input
                        placeholder="Enter the certificate hash..."
                        value={hashInput}
                        onChange={(e) => setHashInput(e.target.value)}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        The hash is a 64-character string found on the certificate
                      </p>
                    </div>
                    <Button
                      onClick={handleVerify}
                      className="w-full"
                      disabled={isVerifying}
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying on Blockchain...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Verify Certificate
                        </>
                      )}
                    </Button>
                  </TabsContent>

                  <TabsContent value="qr" className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-4 text-center">
                        Use your device camera to scan a certificate QR code.
                      </p>
                      <div className="flex justify-center">
                        <QRScanner onScan={handleScan} onError={handleScanError} />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            {/* Verification Result */}
            {result && <VerificationResultDisplay result={result} />}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Verify;
