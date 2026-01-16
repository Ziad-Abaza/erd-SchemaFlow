"use client"

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { KeyRound, Link, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Column = {
    id: string;
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    isNullable: boolean;
    isUnique?: boolean;
};

export type TableNodeData = {
    label: string;
    columns: Column[];
};

const TableNode = ({ data, selected }: NodeProps<TableNodeData>) => {
    return (
        <div className={cn(
            "bg-card border rounded-md shadow-sm min-w-[200px] transition-all",
            selected ? "border-primary ring-1 ring-primary shadow-lg scale-[1.01]" : "border-border"
        )}>
            {/* Table Header */}
            <div className="bg-secondary/50 p-2 border-b border-border font-bold text-sm text-center flex items-center justify-center gap-2 rounded-t-md">
                {data.label}
            </div>

            {/* Columns */}
            <div className="p-2 space-y-1">
                {data.columns.map((col) => (
                    <div key={col.id} className="flex items-center justify-between text-xs gap-2 group hover:bg-muted p-1 rounded transition-colors cursor-default">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            {col.isPrimaryKey && <KeyRound className="w-3 h-3 text-yellow-500 shrink-0" />}
                            {col.isForeignKey && <Link className="w-3 h-3 text-blue-500 shrink-0" />}
                            {col.isUnique && !col.isPrimaryKey && <Fingerprint className="w-3 h-3 text-purple-500 shrink-0" />}
                            <span className={cn(
                                "font-mono truncate",
                                col.isPrimaryKey ? "font-bold text-foreground" : "text-foreground/90"
                            )}>{col.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                            <span className="text-[10px] uppercase opacity-70">{col.type}</span>
                            {col.isNullable && <span className="text-[9px] border border-border px-0.5 rounded text-muted-foreground/70">NULL</span>}
                        </div>
                    </div>
                ))}
                {data.columns.length === 0 && (
                    <div className="text-[10px] text-muted-foreground text-center italic py-1">
                        No columns
                    </div>
                )}
            </div>

            <Handle
                type="target"
                position={Position.Left}
                className="!bg-primary !border-background !w-2.5 !h-2.5"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!bg-primary !border-background !w-2.5 !h-2.5"
            />
        </div>
    );
};

export default memo(TableNode);
