"use client";

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GroupNodeData {
  label: string;
  isCollapsed: boolean;
  nodeIds: string[];
  color?: string;
}

const GroupNode = ({ data, selected }: NodeProps<GroupNodeData>) => {
  const [isCollapsed, setIsCollapsed] = useState(data.isCollapsed || false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    // In a real implementation, this would update the store to hide/show child nodes
  };

  return (
    <div className={cn(
      "border-2 border-dashed rounded-lg shadow-sm transition-all",
      selected ? "border-primary ring-1 ring-primary" : "border-border/50",
      data.color ? `border-${data.color}` : "",
      isCollapsed ? "min-w-[150px] min-h-[40px]" : "min-w-[300px] min-h-[200px]"
    )}>
      {/* Group Header */}
      <div 
        className={cn(
          "bg-secondary/50 p-2 border-b border-border flex items-center justify-between cursor-pointer",
          isCollapsed ? "border-b-0" : ""
        )}
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">{data.label}</span>
          <span className="text-xs text-muted-foreground">({data.nodeIds?.length || 0})</span>
        </div>
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {!isCollapsed && (
        <div className="p-2">
          <div className="text-xs text-muted-foreground text-center">
            Group container - drag to move all tables
          </div>
        </div>
      )}

      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !border-background !w-3 !h-3 opacity-50"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !border-background !w-3 !h-3 opacity-50"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-primary !border-background !w-3 !h-3 opacity-50"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-primary !border-background !w-3 !h-3 opacity-50"
      />
    </div>
  );
};

export default memo(GroupNode);
