import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CertificateCard from '@/components/certificates/CertificateCard';
import QRCodeDisplay from '@/components/certificates/QRCodeDisplay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Award, FileText, Loader2 } from 'lucide-react';
import { getCertificatesByHolder } from '@/lib/certificate-service';
import { Certificate as DisplayCertificate } from '@/lib/certificate-utils';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

const Holder = () => {
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [certificates, setCertificates] = useState<DisplayCertificate[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<DisplayCertificate | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!email.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        variant: 'destructive'
      });
      return;
    }

    setIsSearching(true);
    setHasSearched(false);

    try {
      // Fetch from real database
      const dbCerts = await getCertificatesByHolder(email);

      // Map DB result to DisplayResult
      const userCerts: DisplayCertificate[] = dbCerts.map((dbCert: any) => ({
        id: dbCert.certificate_id,
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
      }));

      setCertificates(userCerts);
      setHasSearched(true);

      if (userCerts.length === 0) {
        toast({
          title: 'No Certificates Found',
          description: 'No certificates were found for this email address',
        });
      } else {
        toast({
          title: 'Certificates Found',
          description: `Found ${userCerts.length} certificate(s)`,
        });
      }
    } catch (error) {
      console.error('Error searching certificates:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for certificates',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleShowQR = (certificate: DisplayCertificate) => {
    setSelectedCertificate(certificate);
    setShowQRModal(true);
  };

  const handleViewDetails = (certificate: DisplayCertificate) => {
    window.open(`/verify?hash=${certificate.hash}`, '_blank');
  };

  return (
    <>
      <Helmet>
        <title>My Certificates - CertChain</title>
        <meta
          name="description"
          content="Access and manage your verified digital certificates. Share via QR code or download official copies."
        />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-12 bg-background">
          <div className="container max-w-4xl">
            {/* Page Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
                <Award className="h-4 w-4" />
                <span>Certificate Holder Portal</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                My Certificates
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Access your verified digital certificates, share them via QR code,
                or download official copies.
              </p>
            </div>

            {/* Search Form */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Find Your Certificates</CardTitle>
                <CardDescription>
                  Enter the email address associated with your certificates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email address..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="sm:w-auto"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Find Certificates
                      </>
                    )}
                  </Button>
                </div>

              </CardContent>
            </Card>

            {/* Certificates Grid */}
            {hasSearched && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">
                    Your Certificates ({certificates.length})
                  </h2>
                </div>

                {certificates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {certificates.map((cert) => (
                      <CertificateCard
                        key={cert.id}
                        certificate={cert}
                        onShowQR={() => handleShowQR(cert)}
                        onViewDetails={() => handleViewDetails(cert)}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        No Certificates Found
                      </h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        We couldn't find any certificates associated with this email address.
                        Please check the email or contact your institution.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* QR Code Modal */}
            <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Certificate</DialogTitle>
                </DialogHeader>
                {selectedCertificate && (
                  <QRCodeDisplay
                    certificateHash={selectedCertificate.hash}
                    certificateId={selectedCertificate.id}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Holder;
