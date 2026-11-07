import React from 'react';
import { MessageSquare, Trash2, Plus, Clock } from 'lucide-react';

export interface SavedConversation {
  id: string;
  title: string;
  date: string;
}

interface ConversationHistoryProps {
  conversations: SavedConversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
  className?: string;
}

export const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
  className = "",
}) => {
  return (
    <div className={`flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-neutral-800 p-3 space-y-3 ${className}`}>
      {/* New Chat Button */}
      <button
        type="button"
        onClick={onNewChat}
        className="w-full py-2.5 px-3 rounded-xl bg-[#00BFFF] hover:bg-[#02CCFE] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>New Shopping Session</span>
      </button>

      {/* History List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 hide-scrollbar">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 px-2 pt-2">
          Recent Searches
        </p>

        {conversations.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-neutral-500 px-2 py-4 text-center">
            No previous sessions
          </p>
        ) : (
          conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`group flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                activeId === c.id
                  ? 'bg-slate-100 dark:bg-neutral-800 font-bold text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50'
              }`}
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <MessageSquare className="w-3.5 h-3.5 text-[#00BFFF] shrink-0" />
                <span className="truncate">{c.title}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
