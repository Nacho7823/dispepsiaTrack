import React from 'react';

const NavButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    {icon}
    <span className="hidden md:inline">{label}</span>
  </button>
);

export default NavButton;
