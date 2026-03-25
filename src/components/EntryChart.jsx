import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, BarChart, Bar, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart2, Circle } from 'lucide-react';

const chartComponents = {
  bar: (data, domain) => (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="fecha" fontSize={10} />
        <YAxis domain={domain} fontSize={10} />
        <Tooltip />
        <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  ),
  area: (data, domain) => (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="fecha" fontSize={10} />
        <YAxis domain={domain} fontSize={10} />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} />
      </AreaChart>
    </ResponsiveContainer>
  ),
  scatter: (data) => (
    <ResponsiveContainer width="100%" height={250}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="estres" name="Estrés" domain={[0, 10]} />
        <YAxis type="number" dataKey="intensidad" name="Dolor" domain={[0, 10]} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={data} fill="#f43f5e" />
      </ScatterChart>
    </ResponsiveContainer>
  ),
  line: (data, domain) => (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="fecha" fontSize={10} />
        <YAxis domain={domain} fontSize={10} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} dot={{ fill: '#4f46e5' }} />
      </LineChart>
    </ResponsiveContainer>
  ),
};

const chartTypeButtons = [
  { type: 'line', icon: TrendingUp },
  { type: 'bar', icon: BarChart2 },
  { type: 'area', icon: TrendingDown },
  { type: 'scatter', icon: Circle },
];

const EntryChart = ({ data, chartType, chartMetric, onChartTypeChange, onChartMetricChange, customFields }) => {
  const mappedData = data.map(d => ({
    ...d,
    value: chartMetric === 'sueno' ? d.sueno : d[chartMetric]
  }));
  const domain = chartMetric === 'sueno' || chartMetric.startsWith('customField') ? [0, 24] : [0, 10];

  return (
    <div className="bg-white p-6 rounded-2xl border shadow-sm">
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {chartTypeButtons.map(({ type, icon: Icon }) => (
            <button key={type} onClick={() => onChartTypeChange(type)} className="p-2 rounded">
              <Icon size={18} />
            </button>
          ))}
        </div>
        <select value={chartMetric} onChange={(e) => onChartMetricChange(e.target.value)} className="border p-2 rounded-lg text-sm">
          <option value="intensidad">Intensidad</option>
          <option value="estres">Estrés</option>
          <option value="sueno">Horas de Sueño</option>
          {customFields.map((cf, idx) => <option key={idx} value={`customField${idx}Value`}>{cf.name}</option>)}
        </select>
      </div>
      {(chartComponents[chartType] || chartComponents.line)(mappedData, domain)}
    </div>
  );
};

export default EntryChart;
