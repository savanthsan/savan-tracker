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
      <div className="h-64 w-full flex items-center justify-center text-slate-600 text-xs font-mono">
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
            stroke="var(--secondary)" 
            fontSize={11} 
            tickLine={true} 
            axisLine={true} 
            style={{ fontFamily: 'var(--font-mono)' }}
          />
          <YAxis 
            stroke="var(--secondary)" 
            fontSize={11} 
            tickLine={true} 
            axisLine={true} 
            tickFormatter={(val) => `${currency}${val}`}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '2px solid var(--secondary)', 
              borderRadius: '8px', 
              color: 'var(--foreground)',
              fontFamily: 'var(--font-mono)',
              boxShadow: '3px 3px 0px var(--secondary)'
            }}
            cursor={{ fill: 'rgba(73, 182, 229, 0.15)' }}
          />
          <Bar dataKey="amount" fill="var(--primary)" stroke="var(--secondary)" strokeWidth={1.5} radius={[0, 0, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.amount > 0 ? 'var(--primary)' : '#e2e8f0'} />
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
      <div className="h-64 w-full flex items-center justify-center text-slate-600 text-xs font-mono">
        Preparing completion ratios...
      </div>
    );
  }

  const data = [
    { name: 'Completed', value: completedCount, color: 'var(--success)' },
    { name: 'Pending', value: pendingCount, color: 'var(--primary)' },
    { name: 'Missed', value: missedCount, color: 'var(--danger)' }
  ].filter(item => item.value > 0);

  // If no tasks exist
  if (data.length === 0) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center text-slate-500 text-sm gap-2 font-mono border-2 border-secondary rounded-[15px_4px_12px_4px/4px_12px_4px_15px] bg-slate-50/50 shadow-[2px_2px_0px_var(--secondary)]">
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
            paddingAngle={3}
            dataKey="value"
            stroke="var(--secondary)"
            strokeWidth={1.5}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '2px solid var(--secondary)', 
              borderRadius: '8px', 
              color: 'var(--foreground)',
              fontFamily: 'var(--font-mono)',
              boxShadow: '3px 3px 0px var(--secondary)'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="square"
            formatter={(value, entry) => {
              const item = data.find(d => d.name === value);
              return <span className="text-xs text-secondary font-bold font-mono">{value} ({item ? item.value : 0})</span>;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Expense Pie Chart Component
export function ExpensePieChart({ data, currency = '$' }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-slate-600 text-xs font-mono">
        Preparing expense chart...
      </div>
    );
  }

  // Filter out zero totals
  const chartData = data.filter(item => item.total > 0).map(item => ({
    name: item.name,
    value: item.total,
    color: item.fill
  }));

  if (chartData.length === 0) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center text-slate-500 text-sm gap-2 font-mono border-2 border-secondary rounded-[15px_4px_12px_4px/4px_12px_4px_15px] bg-slate-50/50 shadow-[2px_2px_0px_var(--secondary)]">
        <span>No expenses recorded yet.</span>
      </div>
    );
  }

  return (
    <div className="h-64 w-full relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            stroke="var(--secondary)"
            strokeWidth={1.5}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `${currency}${Number(value).toFixed(2)}`}
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '2px solid var(--secondary)', 
              borderRadius: '8px', 
              color: 'var(--foreground)',
              fontFamily: 'var(--font-mono)',
              boxShadow: '3px 3px 0px var(--secondary)'
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value, entry) => {
              return <span className="text-[10px] text-secondary font-bold font-mono truncate">{value}</span>;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
