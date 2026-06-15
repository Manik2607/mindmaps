import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { useReactFlow } from '@xyflow/react';
import { Search } from 'lucide-react';
import { AppNode } from '@/types';

type SearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const nodes = useStore((state) => state.nodes);
  const { setCenter, getZoom } = useReactFlow();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      // eslint-disable-next-line
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const results = nodes.filter((n) => 
    n.data.label.toLowerCase().includes(query.toLowerCase()) && query.trim() !== ''
  );

  const handleSelect = (node: AppNode) => {
    setCenter(node.position.x + 60, node.position.y + 40, { zoom: Math.max(1, getZoom()), duration: 400 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/20 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-[#151515] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[#333]">
          <Search size={18} className="text-text-muted mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-text-main placeholder-text-muted text-lg"
            placeholder="Search nodes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
          />
        </div>
        {results.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto py-2">
            {results.map((node) => (
              <div
                key={node.id}
                className="px-4 py-3 hover:bg-[#1E1E1E] cursor-pointer border-l-2 border-transparent hover:border-accent"
                onClick={() => handleSelect(node)}
              >
                <div className="text-text-main">{node.data.label}</div>
              </div>
            ))}
          </div>
        )}
        {query.trim() !== '' && results.length === 0 && (
          <div className="px-4 py-8 text-center text-text-muted">
            No results found for &quot;{query}&quot;
          </div>
        )}
      </div>
    </div>
  );
}
