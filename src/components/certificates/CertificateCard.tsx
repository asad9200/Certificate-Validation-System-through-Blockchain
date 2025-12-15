import { Certificate, formatDate, truncateHash } from '@/lib/certificate-utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Calendar, Building, User, ExternalLink, QrCode } from 'lucide-react';

interface CertificateCardProps {
  certificate: Certificate;
  onViewDetails?: () => void;
  onShowQR?: () => void;
  showActions?: boolean;
}

const CertificateCard = ({ 
  certificate, 
  onViewDetails, 
  onShowQR,
  showActions = true 
}: CertificateCardProps) => {
  const statusColors = {
    valid: 'bg-primary/10 text-primary border-primary/20',
    revoked: 'bg-destructive/10 text-destructive border-destructive/20',
    expired: 'bg-muted text-muted-foreground border-muted'
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Award className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">
                {certificate.courseName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {certificate.id}
              </p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`${statusColors[certificate.status]} capitalize shrink-0`}
          >
            {certificate.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{certificate.holderName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Building className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground truncate">{certificate.institutionName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{formatDate(certificate.issueDate)}</span>
          </div>
          {certificate.grade && (
            <div className="flex items-center gap-2 text-sm">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">{certificate.grade}</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">Certificate Hash (SHA-256)</p>
          <code className="text-xs font-mono text-foreground bg-muted/30 px-2 py-1 rounded block overflow-hidden">
            {truncateHash(certificate.hash, 20)}
          </code>
        </div>

        {showActions && (
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={onShowQR}
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>
            <Button 
              size="sm" 
              className="flex-1"
              onClick={onViewDetails}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificateCard;
