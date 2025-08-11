'use client';

import { useEffect, useRef } from 'react';

interface TrendData {
  date: string;
  rating: number;
  count: number;
}

interface TrendChartProps {
  data: TrendData[];
  width?: number;
  height?: number;
}

export default function TrendChart({ data, width = 600, height = 300 }: TrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas
    canvas.width = width;
    canvas.height = height;

    // Limpar canvas
    ctx.clearRect(0, 0, width, height);

    if (data.length < 2) return;

    // Configurações do gráfico
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Encontrar valores mínimos e máximos
    const ratings = data.map(d => d.rating);
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);
    const ratingRange = maxRating - minRating;

    // Função para mapear valores para coordenadas do canvas
    const mapX = (index: number) => padding + (index / (data.length - 1)) * chartWidth;
    const mapY = (rating: number) => {
      if (ratingRange === 0) return height / 2;
      return padding + ((maxRating - rating) / ratingRange) * chartHeight;
    };

    // Desenhar grade
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Linhas horizontais (níveis de rating)
    for (let i = 0; i <= 5; i++) {
      const y = padding + ((maxRating - i) / ratingRange) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      // Labels dos ratings
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(i.toString(), padding - 10, y + 4);
    }

    // Linhas verticais (semanas)
    data.forEach((_, index) => {
      const x = mapX(index);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    });

    // Desenhar linha de tendência
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((item, index) => {
      const x = mapX(index);
      const y = mapY(item.rating);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Desenhar pontos
    ctx.fillStyle = '#3b82f6';
    data.forEach((item, index) => {
      const x = mapX(index);
      const y = mapY(item.rating);
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Adicionar borda branca
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Desenhar labels das datas
    ctx.fillStyle = '#374151';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    data.forEach((item, index) => {
      const x = mapX(index);
      const y = height - padding + 10;
      
      // Formatar data para exibição
      const dateLabel = item.date.replace('-W', ' Semana ');
      ctx.fillText(dateLabel, x, y);
    });

    // Título do gráfico
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Evolução da Satisfação ao Longo do Tempo', width / 2, 20);

    // Estatísticas
    const currentRating = data[data.length - 1]?.rating || 0;
    const previousRating = data[data.length - 2]?.rating || 0;
    const change = currentRating - previousRating;
    const changePercent = previousRating > 0 ? (change / previousRating) * 100 : 0;

    ctx.fillStyle = change >= 0 ? '#059669' : '#dc2626';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Mudança: ${change >= 0 ? '+' : ''}${change.toFixed(1)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%)`,
      padding,
      height - 20
    );

  }, [data, width, height]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-500">Dados insuficientes para exibir gráfico</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
      
      {/* Legenda */}
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Linha de tendência</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
          <span>Pontos de dados</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-300"></div>
          <span>Grade de referência</span>
        </div>
      </div>
    </div>
  );
}
