import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeDisplayProps {
  certificateHash: string;
  certificateId: string;
  size?: number;
}

const QRCodeDisplay = ({ certificateHash, certificateId, size = 200 }: QRCodeDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const verificationUrl = `${window.location.origin}/verify?hash=${certificateHash}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Verification link copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = size;
        canvas.height = size;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `certificate-${certificateId}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Certificate QR Code</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="p-4 bg-card rounded-xl border border-border">
          <QRCodeSVG
            id="qr-code-svg"
            value={verificationUrl}
            size={size}
            level="H"
            includeMargin
            fgColor="hsl(161, 93%, 30%)"
            bgColor="transparent"
          />
        </div>
        
        <p className="text-sm text-center text-muted-foreground max-w-xs">
          Scan this QR code to instantly verify this certificate's authenticity
        </p>

        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleCopy}
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeDisplay;
