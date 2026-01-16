"use client";

import { memo } from 'react';
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  EdgeProps, 
  getBezierPath,
  getMarkerEnd,
  MarkerType,
} from 'reactflow';
import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowRightLeft, Link2 } from 'lucide-react';

interface ManyToManyEdgeData {
  relationship: {
    sourceTable: string;
    sourceColumn: string;
    targetTable: string;
    targetColumn: string;
    cardinality: 'N:M';
    junctionTable?: string;
  };
  label: string;
  isValid?: boolean;
  hasJunctionTable?: boolean;
}

const ManyToManyEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<ManyToManyEdgeData>) => {
  const isValid = data?.isValid !== false;
  const hasJunctionTable = data?.hasJunctionTable || false;
  const edgeColor = isValid ? (selected ? '#8b5cf6' : '#6b7280') : '#ef4444';
  const strokeWidth = selected ? 3 : (isValid ? 2 : 3);
  
  // Calculate bezier path
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Calculate junction table position (middle of the path)
  const junctionX = (sourceX + targetX) / 2;
  const junctionY = (sourceY + targetY) / 2;

  return (
    <>
      {/* Main edge from source to junction */}
      <BaseEdge
        id={`${id}_source`}
        path={`M ${sourceX} ${sourceY} Q ${junctionX} ${sourceY} ${junctionX} ${junctionY}`}
        markerEnd={getMarkerEnd(MarkerType.ArrowClosed)}
        style={{
          strokeWidth,
          stroke: edgeColor,
          strokeDasharray: hasJunctionTable ? '0' : '5,5',
        }}
      />
      
      {/* Edge from junction to target */}
      <BaseEdge
        id={`${id}_target`}
        path={`M ${junctionX} ${junctionY} Q ${junctionX} ${targetY} ${targetX} ${targetY}`}
        markerEnd={getMarkerEnd(MarkerType.ArrowClosed)}
        style={{
          strokeWidth,
          stroke: edgeColor,
          strokeDasharray: hasJunctionTable ? '0' : '5,5',
        }}
      />
      
      {/* Junction Table Indicator */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${junctionX}px,${junctionY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className={cn(
            "bg-gradient-to-r from-purple-500 to-blue-500 text-white border-2 border-purple-600 rounded-lg p-2 shadow-lg",
            "flex items-center gap-2 whitespace-nowrap min-w-[120px] justify-center",
            !hasJunctionTable && "opacity-60 animate-pulse"
          )}>
            <ArrowRightLeft className="w-4 h-4" />
            <div className="text-xs font-bold">
              {hasJunctionTable ? data?.relationship?.junctionTable || 'Junction' : 'N:M Required'}
            </div>
            {!hasJunctionTable && <AlertTriangle className="w-3 h-3 text-yellow-300" />}
          </div>
        </div>
      </EdgeLabelRenderer>

      {/* Source Label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${sourceX + (junctionX - sourceX) * 0.3}px,${sourceY + (junctionY - sourceY) * 0.3}px)`,
            pointerEvents: 'none',
          }}
        >
          <div className="bg-background border rounded px-2 py-1 shadow-md text-xs font-mono">
            <span className="font-mono text-muted-foreground">
              {data?.relationship?.sourceColumn}
            </span>
          </div>
        </div>
      </EdgeLabelRenderer>

      {/* Target Label */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${junctionX + (targetX - junctionX) * 0.7}px,${junctionY + (targetY - junctionY) * 0.7}px)`,
            pointerEvents: 'none',
          }}
        >
          <div className="bg-background border rounded px-2 py-1 shadow-md text-xs font-mono">
            <span className="font-mono text-muted-foreground">
              {data?.relationship?.targetColumn}
            </span>
          </div>
        </div>
      </EdgeLabelRenderer>

      {/* Cardinality Indicators */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${sourceX + (junctionX - sourceX) * 0.1}px,${sourceY + (junctionY - sourceY) * 0.1}px)`,
            pointerEvents: 'none',
          }}
        >
          <div className="text-xs font-bold text-foreground bg-background px-1 rounded border border-border">
            N
          </div>
        </div>
      </EdgeLabelRenderer>

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${junctionX + (targetX - junctionX) * 0.9}px,${junctionY + (targetY - junctionY) * 0.9}px)`,
            pointerEvents: 'none',
          }}
        >
          <div className="text-xs font-bold text-foreground bg-background px-1 rounded border border-border">
            M
          </div>
        </div>
      </EdgeLabelRenderer>

      {/* Relationship Type Badge */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + 30}px)`,
            pointerEvents: 'none',
          }}
        >
          <div className={cn(
            "bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded px-2 py-1 shadow-md text-xs font-mono flex items-center gap-1",
            isValid ? "" : "border-red-500 bg-red-100 dark:bg-red-900/30"
          )}>
            <Link2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span className="text-purple-700 dark:text-purple-300 font-bold">
              N:M
            </span>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(ManyToManyEdge);
