import React from 'react';

const ChatMessage = ({ message }) => (
  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[85%] p-4 rounded-2xl ${
      message.role === 'user'
        ? 'bg-indigo-600 text-white rounded-tr-none'
        : 'bg-white border text-slate-800 rounded-tl-none'
    }`}>
      {message.content}
    </div>
  </div>
);

export default ChatMessage;
