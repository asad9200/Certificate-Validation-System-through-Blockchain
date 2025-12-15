import { VerificationResult as VerificationResultType } from '@/lib/certificate-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Shield, 
  Clock,
  User,
  Building,
  Award,
  Calendar,
  Hash,
  Link as LinkIcon
} from 'lucide-react';
import { formatDate, truncateHash } from '@/lib/certificate-utils';

interface VerificationResultProps {
  result: VerificationResultType;
}

const VerificationResultDisplay = ({ result }: VerificationResultProps) => {
  const statusConfig = {
    valid: {
      icon: CheckCircle2,
      title: 'Certificate Verified',
      subtitle: 'This certificate is authentic and valid',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30'
    },
    invalid: {
      icon: XCircle,
      title: 'Verification Failed',
      subtitle: 'This certificate could not be verified',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/30'
    },
    revoked: {
      icon: XCircle,
      title: 'Certificate Revoked',
      subtitle: 'This certificate has been revoked by the issuer',
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      borderColor: 'border-destructive/30'
    },
    tampered: {
      icon: AlertTriangle,
      title: 'Certificate Tampered',
      subtitle: 'This certificate shows signs of tampering',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    },
    not_found: {
      icon: XCircle,
      title: 'Certificate Not Found',
      subtitle: 'No certificate found with this hash',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/30',
      borderColor: 'border-muted'
    }
  };

  const config = statusConfig[result.status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className={`${config.borderColor} border-2`}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className={`${config.bgColor} p-4 rounded-full mb-4`}>
              <StatusIcon className={`h-12 w-12 ${config.color}`} />
            </div>
            <h2 className={`text-2xl font-bold ${config.color}`}>
              {config.title}
            </h2>
            <p className="text-muted-foreground mt-1">
              {config.subtitle}
            </p>
            
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" />
                Blockchain Verified
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {new Date(result.verifiedAt).toLocaleString()}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Details */}
      {result.certificate && result.status === 'valid' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Certificate Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Certificate Holder</p>
                  <p className="font-medium text-foreground">{result.certificate.holderName}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Issuing Institution</p>
                  <p className="font-medium text-foreground">{result.certificate.institutionName}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Course / Program</p>
                  <p className="font-medium text-foreground">{result.certificate.courseName}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Issue Date</p>
                  <p className="font-medium text-foreground">{formatDate(result.certificate.issueDate)}</p>
                </div>
              </div>

              {result.certificate.grade && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Grade / Honor</p>
                    <p className="font-medium text-foreground">{result.certificate.grade}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <LinkIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Certificate ID</p>
                  <p className="font-medium text-foreground">{result.certificate.id}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-start gap-3">
                <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">SHA-256 Hash</p>
                  <code className="text-xs font-mono bg-muted/50 px-3 py-2 rounded-lg block break-all">
                    {result.certificate.hash}
                  </code>
                </div>
              </div>
            </div>

            {result.certificate.blockchainTxId && (
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Blockchain Transaction ID</p>
                  <code className="text-xs font-mono bg-muted/50 px-3 py-2 rounded-lg block break-all">
                    {result.certificate.blockchainTxId}
                  </code>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VerificationResultDisplay;
