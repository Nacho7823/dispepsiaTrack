import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { formatShortDate } from '../utils/date';

const ConversationSidebar = ({ conversations, activeConversation, onLoad, onNew, onDelete }) => (
  <div className="w-72 bg-white/80 backdrop-blur-sm border-r border-organic-200 flex flex-col">
    <div className="p-4 border-b border-organic-100">
      <button
        onClick={onNew}
        className="w-full organic-btn-primary py-2.5 text-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        <Plus size={18} /> Nueva conversacion
      </button>
    </div>
    <div className="flex-1 overflow-y-auto">
      {conversations.map(conv => (
        <div
          key={conv.id}
          onClick={() => onLoad(conv)}
          className={`p-4 border-b border-organic-100 cursor-pointer transition-colors duration-150 ${
            activeConversation?.id === conv.id
              ? 'bg-leaf-50 border-l-2 border-l-leaf-500'
              : 'hover:bg-organic-50'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm truncate ${
                activeConversation?.id === conv.id ? 'text-leaf-800' : 'text-organic-700'
              }`}>{conv.title}</p>
              <p className="text-xs text-organic-400 mt-0.5">{formatShortDate(conv.updatedAt || conv.createdAt)}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
              className="text-terracotta-300 hover:text-terracotta-500 p-1.5 rounded-organic-sm hover:bg-terracotta-50 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
      {conversations.length === 0 && (
        <p className="p-6 text-sm text-organic-400 text-center font-body">Sin conversaciones</p>
      )}
    </div>
  </div>
);

export default ConversationSidebar;
