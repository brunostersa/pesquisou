'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FeedbackChartProps {
  feedbacks: any[];
}

export default function FeedbackChart({ feedbacks }: FeedbackChartProps) {
  const [selectedDays, setSelectedDays] = useState(7);

  const chartData = useMemo(() => {
    const today = new Date();
    const data = [];
    
    for (let i = selectedDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const feedbacksForDay = feedbacks.filter(feedback => {
        // Handle both Firestore Timestamp and regular Date objects
        const feedbackDate = feedback.createdAt?.toDate ? feedback.createdAt.toDate() : new Date(feedback.createdAt);
        return feedbackDate >= dayStart && feedbackDate <= dayEnd;
      });
      
      const averageRating = feedbacksForDay.length > 0 
        ? feedbacksForDay.reduce((sum, f) => sum + f.rating, 0) / feedbacksForDay.length 
        : 0;
      
      data.push({
        date: date.toLocaleDateString('pt-BR', { 
          day: '2-digit', 
          month: '2-digit' 
        }),
        feedbacks: feedbacksForDay.length,
        rating: Math.round(averageRating * 10) / 10,
        fullDate: date
      });
    }
    
    return data;
  }, [feedbacks, selectedDays]);

  const totalFeedbacks = chartData.reduce((sum, day) => sum + day.feedbacks, 0);
  const averageRating = chartData.reduce((sum, day) => sum + day.rating, 0) / chartData.length;

  return (
    <div className="bg-card border border-custom rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-primary">Evolução das Opiniões</h3>
          <p className="text-sm text-secondary">Últimos {selectedDays} dias</p>
        </div>
        
        {/* Seletor de período */}
        <div className="flex space-x-2">
          {[7, 15, 30].map((days) => (
            <button
              key={days}
              onClick={() => setSelectedDays(days)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedDays === days
                  ? 'bg-secondary-color text-white'
                  : 'bg-tertiary text-primary hover:bg-gray-200'
              }`}
            >
              {days} dias
            </button>
          ))}
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-tertiary rounded-lg p-4">
          <div className="text-2xl font-bold text-primary">{totalFeedbacks}</div>
          <div className="text-sm text-secondary">Total de opiniões</div>
        </div>
        <div className="bg-tertiary rounded-lg p-4">
          <div className="text-2xl font-bold text-primary">
            {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
          </div>
          <div className="text-sm text-secondary">Avaliação média</div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => value.toString()}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ color: '#374151', fontWeight: '600' }}
              formatter={(value: any, name: string) => [
                value, 
                name === 'feedbacks' ? 'Opiniões' : 'Avaliação'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="feedbacks" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="rating" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda */}
      <div className="flex justify-center space-x-6 mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-sm text-secondary">Quantidade de opiniões</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-secondary">Avaliação média</span>
        </div>
      </div>
    </div>
  );
} 