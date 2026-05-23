'use client';

import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Spending Chart Component
export function SpendingChart({ data, currency = '$' }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-slate-500 text-xs">
        Preparing financial graphs...
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="day" 
            stroke="#64748b" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(val) => `${currency}${val}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              borderColor: 'rgba(255,255,255,0.08)', 
              borderRadius: '0.75rem', 
              color: '#f8fafc' 
            }}
            cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
          />
          <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.amount > 0 ? '#6366f1' : '#1e293b'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Task Chart Component
export function TaskPieChart({ completedCount, pendingCount, missedCount }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-slate-500 text-xs">
        Preparing completion ratios...
      </div>
    );
  }

  const data = [
    { name: 'Completed', value: completedCount, color: '#10b981' },
    { name: 'Pending', value: pendingCount, color: '#6366f1' },
    { name: 'Missed', value: missedCount, color: '#f43f5e' }
  ].filter(item => item.value > 0);

  // If no tasks exist
  if (data.length === 0) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
        <span>No scheduled tasks found.</span>
      </div>
    );
  }

  return (
    <div className="h-64 w-full relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              borderColor: 'rgba(255,255,255,0.08)', 
              borderRadius: '0.75rem', 
              color: '#f8fafc' 
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value, entry) => {
              const item = data.find(d => d.name === value);
              return <span className="text-xs text-slate-400 font-semibold">{value} ({item ? item.value : 0})</span>;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
