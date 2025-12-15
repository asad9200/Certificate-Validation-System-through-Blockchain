import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, StopCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

const QRScanner = ({ onScan, onError }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanning = async () => {
    if (!containerRef.current) return;

    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        (errorMessage) => {
          // Ignore scan errors, they happen frequently
        }
      );
      setIsScanning(true);
    } catch (err) {
      onError?.('Failed to start camera. Please ensure camera permissions are granted.');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        // Ignore stop errors
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div
        id="qr-reader"
        ref={containerRef}
        className="w-full aspect-square max-w-[300px] mx-auto bg-muted rounded-lg overflow-hidden"
      />
      
      <div className="flex justify-center">
        {!isScanning ? (
          <Button onClick={startScanning} className="gap-2">
            <Camera className="h-4 w-4" />
            Start Scanning
          </Button>
        ) : (
          <Button onClick={stopScanning} variant="destructive" className="gap-2">
            <StopCircle className="h-4 w-4" />
            Stop Scanning
          </Button>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
