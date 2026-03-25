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
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D4C4A8" strokeOpacity={0.5} />
        <XAxis dataKey="fecha" fontSize={10} tick={{ fill: '#5A4A2D' }} />
        <YAxis domain={domain} fontSize={10} tick={{ fill: '#5A4A2D' }} />
        <Tooltip contentStyle={{ backgroundColor: '#F5F0E1', border: '1px solid #D4C4A8', borderRadius: '12px', fontFamily: 'Raleway' }} />
        <Bar dataKey="value" fill="#228B22" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  ),
  area: (data, domain) => (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D4C4A8" strokeOpacity={0.5} />
        <XAxis dataKey="fecha" fontSize={10} tick={{ fill: '#5A4A2D' }} />
        <YAxis domain={domain} fontSize={10} tick={{ fill: '#5A4A2D' }} />
        <Tooltip contentStyle={{ backgroundColor: '#F5F0E1', border: '1px solid #D4C4A8', borderRadius: '12px', fontFamily: 'Raleway' }} />
        <Area type="monotone" dataKey="value" stroke="#228B22" fill="#A8D18C" fillOpacity={0.4} />
      </AreaChart>
    </ResponsiveContainer>
  ),
  scatter: (data) => (
    <ResponsiveContainer width="100%" height={250}>
      <ScatterChart>
        <CartesianGrid strokeDasharray="3 3" stroke="#D4C4A8" strokeOpacity={0.5} />
        <XAxis type="number" dataKey="estres" name="Estres" domain={[0, 10]} tick={{ fill: '#5A4A2D' }} />
        <YAxis type="number" dataKey="intensidad" name="Dolor" domain={[0, 10]} tick={{ fill: '#5A4A2D' }} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#F5F0E1', border: '1px solid #D4C4A8', borderRadius: '12px', fontFamily: 'Raleway' }} />
        <Scatter data={data} fill="#C67B5C" />
      </ScatterChart>
    </ResponsiveContainer>
  ),
  line: (data, domain) => (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#D4C4A8" strokeOpacity={0.5} />
        <XAxis dataKey="fecha" fontSize={10} tick={{ fill: '#5A4A2D' }} />
        <YAxis domain={domain} fontSize={10} tick={{ fill: '#5A4A2D' }} />
        <Tooltip contentStyle={{ backgroundColor: '#F5F0E1', border: '1px solid #D4C4A8', borderRadius: '12px', fontFamily: 'Raleway' }} />
        <Line type="monotone" dataKey="value" stroke="#228B22" strokeWidth={2.5} dot={{ fill: '#228B22', r: 4, strokeWidth: 0 }} activeDot={{ fill: '#3D7A22', r: 6 }} />
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
    <div className="organic-card p-6">
      <div className="flex flex-wrap gap-4 mb-5">
        <div className="flex gap-1 bg-organic-100 p-1 rounded-organic">
          {chartTypeButtons.map(({ type, icon: Icon }) => (
            <button
              key={type}
              onClick={() => onChartTypeChange(type)}
              className={`p-2.5 rounded-organic-sm transition-all duration-150 cursor-pointer ${
                chartType === type
                  ? 'bg-white text-leaf-700 shadow-organic-sm'
                  : 'text-organic-400 hover:text-organic-600'
              }`}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
        <select
          value={chartMetric}
          onChange={(e) => onChartMetricChange(e.target.value)}
          className="organic-input w-auto text-sm py-2 px-3"
        >
          <option value="intensidad">Intensidad</option>
          <option value="estres">Estres</option>
          <option value="sueno">Horas de Sueno</option>
          {customFields.map((cf, idx) => <option key={idx} value={`customField${idx}Value`}>{cf.name}</option>)}
        </select>
      </div>
      {(chartComponents[chartType] || chartComponents.line)(mappedData, domain)}
    </div>
  );
};

export default EntryChart;
