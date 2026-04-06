import { QRCodeSVG } from "qrcode.react";
import { useLanguage } from "../../context/LanguageContext";

/**
 * Ramsha — QRDisplay
 *
 * Renders a scannable QR code for the Provider to display to Participants
 * during an active QR Code session. Designed for high visibility — suitable
 * for projecting on a screen.
 *
 * @param {{ qrCode: string }} props — The unique QR code string for this session.
 */
const QRDisplay = ({ qrCode }) => {
  const { t } = useLanguage();

  if (!qrCode) return null;

  return (
    <div className="border-2 border-border bg-secondary-background p-6 sm:p-8">
      <p className="font-mono font-bold text-xs uppercase tracking-[0.12em] text-muted-foreground mb-4 text-center">
        {t('qrCode')}
      </p>
      <div className="flex justify-center">
        <div className="bg-white p-6 border-2 border-border inline-block">
          <QRCodeSVG
            value={qrCode}
            size={256}
            level="H"
            bgColor="#FFFFFF"
            fgColor="#0A0A0A"
          />
        </div>
      </div>
      <p className="font-mono text-sm text-muted-foreground text-center mt-4">
        {t('showQrToScan')}
      </p>
    </div>
  );
};

export default QRDisplay;
