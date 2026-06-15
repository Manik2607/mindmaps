import React, { useState } from 'react';
import { EdgeProps, getBezierPath, BaseEdge, EdgeLabelRenderer } from '@xyflow/react';
import { AppEdge } from '@/types';
import { useStore } from '@/store/useStore';

export function ConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
  markerEnd,
}: EdgeProps<AppEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const updateEdgeData = useStore((state) => state.updateEdgeData);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          {isEditing ? (
            <input
              autoFocus
              className="bg-node-fill border border-node-border text-xs px-2 py-1 rounded outline-none focus:border-accent text-text-main"
              value={data?.label || ''}
              onChange={(e) => updateEdgeData(id, { label: e.target.value })}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') setIsEditing(false);
              }}
            />
          ) : (
            data?.label && (
              <div 
                className="bg-node-fill border border-node-border text-text-muted text-xs px-2 py-1 rounded cursor-pointer hover:border-node-border-hover transition-colors"
              >
                {data.label}
              </div>
            )
          )}
          {!isEditing && !data?.label && (
             <div 
               className="opacity-0 hover:opacity-100 bg-node-fill border border-node-border text-text-muted text-[10px] px-1 rounded cursor-pointer transition-opacity"
             >
               + label
             </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
