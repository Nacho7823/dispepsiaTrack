import React from 'react';

const NavButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 rounded-organic transition-all duration-200 cursor-pointer ${
      active
        ? 'bg-leaf-50 text-leaf-800 font-semibold shadow-leaf'
        : 'text-organic-500 hover:bg-organic-100 hover:text-organic-700'
    }`}
  >
    {icon}
    <span className="hidden md:inline font-body">{label}</span>
  </button>
);

export default NavButton;
