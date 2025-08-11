'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import Card, { CardContent, CardAction } from '@/components/Card';

interface QRCodeGeneratorProps {
  areaId: string;
  areaName: string;
  size?: number;
  userProfile?: {
    name?: string;
    company?: string;
    segment?: string;
    logoUrl?: string;
  } | null;
}

export default function QRCodeGenerator({ areaId, areaName, size = 120, userProfile }: QRCodeGeneratorProps) {
  const [feedbackUrl, setFeedbackUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = `${window.location.origin}/feedback/${areaId}`;
    setFeedbackUrl(url);
  }, [areaId]);

  const downloadQRCode = async () => {
    if (!qrRef.current) return;
    
    setIsLoading(true);
    setError(''); // Limpar erro anterior
    try {
      const canvas = document.createElement('canvas');
      const svg = qrRef.current.querySelector('svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      
      img.onload = () => {
        canvas.width = size + 40;
        canvas.height = size + 40;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fundo branco
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Desenhar QR Code
        ctx.drawImage(img, 20, 20, size, size);

        // Download
        const link = document.createElement('a');
        link.download = `qrcode-${areaName}.png`;
        link.href = canvas.toDataURL();
        link.click();
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } catch (error) {
      console.error('Erro ao baixar QR Code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPersonalizedPDF = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Verificar se o QR code está disponível
      if (!qrRef.current || !feedbackUrl) {
        setError('QR Code não está disponível. Aguarde um momento e tente novamente.');
        return;
      }

      const svg = qrRef.current.querySelector('svg');
      if (!svg) {
        setError('QR Code não foi gerado. Tente novamente.');
        return;
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;

      // ===== CABEÇALHO SIMPLES =====
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Título principal
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Sua Opinião é Valiosa!', pageWidth / 2, 25, { align: 'center' });

      // ===== INFORMAÇÕES BÁSICAS =====
      const infoY = 60;
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Área:', margin, infoY);
      doc.setFont('helvetica', 'normal');
      doc.text(areaName, margin + 20, infoY);
      
      if (userProfile?.company) {
        doc.setFont('helvetica', 'bold');
        doc.text('Empresa:', margin, infoY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(userProfile.company, margin + 25, infoY + 10);
      }

      // ===== QR CODE CENTRAL =====
      const qrSize = 80;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = infoY + (userProfile?.company ? 30 : 20);

      // Borda simples do QR Code
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(2);
      doc.rect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);

      // Gerar QR Code como imagem
      try {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const img = new Image();
        
        // Carregar imagem
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.src = url;
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Timeout')), 2000);
          img.onload = () => {
            clearTimeout(timeout);
            URL.revokeObjectURL(url);
            resolve(null);
          };
          img.onerror = () => {
            clearTimeout(timeout);
            URL.revokeObjectURL(url);
            reject(new Error('Erro ao carregar imagem'));
          };
        });

        // Desenhar QR Code no canvas
        const scale = 4;
        canvas.width = qrSize * scale;
        canvas.height = qrSize * scale;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const qrImageData = canvas.toDataURL('image/png', 1.0);
          doc.addImage(qrImageData, 'PNG', qrX, qrY, qrSize, qrSize);
        }
      } catch (imageError) {
        console.warn('Erro ao gerar QR code:', imageError);
        // Fallback simples
        doc.setFillColor(240, 240, 240);
        doc.rect(qrX, qrY, qrSize, qrSize, 'F');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(12);
        doc.text('QR Code', qrX + qrSize/2, qrY + qrSize/2, { align: 'center' });
      }

      // ===== INSTRUÇÕES SIMPLES =====
      const instructionsY = qrY + qrSize + 20;
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Como Participar:', pageWidth / 2, instructionsY, { align: 'center' });
      
      const steps = [
        '1. Abra a câmera do seu smartphone',
        '2. Aponte para o QR Code acima',
        '3. Toque na notificação que aparecer',
        '4. Preencha o formulário de feedback'
      ];
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      
      steps.forEach((step, index) => {
        const stepY = instructionsY + 10 + (index * 6);
        doc.text(step, pageWidth / 2, stepY, { align: 'center' });
      });

      // ===== RODAPÉ SIMPLES =====
      const footerY = pageHeight - 20;
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Gerado pelo Pesquisou', pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, footerY + 5, { align: 'center' });
      
      // Download
      doc.save(`feedback-${areaName}-${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setError('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(feedbackUrl);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      alert('Erro ao copiar link. Tente novamente.');
    }
  };



  return (
    <Card variant="elevated" className="w-full">
      <CardContent>
        {/* Título clicável */}
        <div className="mb-4">
          <h3 
            className="text-lg font-semibold text-primary cursor-pointer hover:text-primary-color transition-colors inline-flex items-center"
            onClick={() => window.open(feedbackUrl, '_blank')}
            title="Clique para abrir o link em nova aba"
          >
            {areaName}
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </h3>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div ref={qrRef} className="p-4 bg-white border border-custom rounded-xl shadow-sm">
            {feedbackUrl ? (
              <QRCodeSVG
                value={feedbackUrl}
                size={size}
                level="M"
                includeMargin={true}
              />
            ) : (
              <div className="flex items-center justify-center" style={{ width: size, height: size }}>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-secondary-color"></div>
              </div>
            )}
          </div>
        </div>

        {/* Instrução */}
        <div className="text-center mb-6">
          <p className="text-secondary text-sm">
            Escaneie para deixar um feedback
          </p>
        </div>

        {/* Opções */}
        <div className="space-y-3">
          <CardAction
            onClick={downloadQRCode}
            disabled={isLoading}
            variant="secondary"
            size="md"
            className="w-full"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isLoading ? 'Baixando...' : 'Baixar QR Code (PNG)'}
          </CardAction>

          <CardAction
            onClick={downloadPersonalizedPDF}
            disabled={isLoading}
            variant="primary"
            size="md"
            className="w-full"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {isLoading ? 'Gerando...' : '📄 PDF Profissional'}
          </CardAction>



          {/* Ações de Link */}
          <div className="grid grid-cols-2 gap-3">
            <CardAction
              onClick={copyLink}
              disabled={isCopied}
              variant="ghost"
              size="md"
              className="w-full"
            >
              {isCopied ? (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              {isCopied ? 'Link Copiado!' : 'Copiar Link'}
            </CardAction>

            <CardAction
              onClick={() => window.open(feedbackUrl, '_blank')}
              disabled={!feedbackUrl}
              variant="ghost"
              size="md"
              className="w-full"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Abrir Link
            </CardAction>
          </div>
        </div>

        {/* URL */}
        <div className="mt-4 p-3 bg-tertiary rounded-lg border border-custom">
          <p className="text-xs text-secondary text-center break-all">
            {feedbackUrl || 'Carregando...'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
