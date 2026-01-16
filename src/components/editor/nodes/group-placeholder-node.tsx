import React from 'react';
import { Handle, Position } from 'reactflow';
import { ChevronRight, ChevronDown, Layers, Database } from 'lucide-react';

interface GroupPlaceholderNodeData {
    label: string;
    nodeCount: number;
    groupId: string;
    color?: string;
}

export default function GroupPlaceholderNode({ 
    data, 
    selected 
}: { 
    data: GroupPlaceholderNodeData;
    selected: boolean;
}) {
    const { label, nodeCount, groupId, color = '#6366f1' } = data;

    return (
        <div 
            className={`
                relative bg-card border-2 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl
                ${selected ? 'border-primary ring-2 ring-primary/50' : 'border-border'}
                min-w-[200px] min-h-[80px]
            `}
            style={{
                backgroundColor: color + '10',
                borderColor: selected ? undefined : color,
            }}
        >
            {/* Connection handles */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-border border-2 border-background"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-border border-2 border-background"
                style={{ top: '50%', transform: 'translateY(-50%)' }}
            />
            
            {/* Group content */}
            <div className="flex items-center gap-3 p-4">
                <div 
                    className="p-2 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: color + '20' }}
                >
                    <Layers className="w-5 h-5" style={{ color }} />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">
                        {label}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        {nodeCount} table{nodeCount !== 1 ? 's' : ''}
                    </div>
                </div>
                
                <div className="flex items-center text-muted-foreground">
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>
            
            {/* Selection indicator */}
            {selected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
            )}
        </div>
    );
}
