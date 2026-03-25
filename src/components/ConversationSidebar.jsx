import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { formatShortDate } from '../utils/date';

const ConversationSidebar = ({ conversations, activeConversation, onLoad, onNew, onDelete }) => (
  <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
    <div className="p-4 border-b">
      <button onClick={onNew} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700">
        <Plus size={18} /> Nueva
      </button>
    </div>
    <div className="flex-1 overflow-y-auto">
      {conversations.map(conv => (
        <div key={conv.id} className={`p-3 border-b cursor-pointer hover:bg-slate-50 ${activeConversation?.id === conv.id ? 'bg-indigo-50' : ''}`}>
          <div className="flex justify-between items-start">
            <div onClick={() => onLoad(conv)} className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{conv.title}</p>
              <p className="text-xs text-slate-400">{formatShortDate(conv.updatedAt || conv.createdAt)}</p>
            </div>
            <button onClick={() => onDelete(conv.id)} className="text-red-400 hover:text-red-600 p-1">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
      {conversations.length === 0 && (
        <p className="p-4 text-sm text-slate-400 text-center">Sin conversaciones</p>
      )}
    </div>
  </div>
);

export default ConversationSidebar;
