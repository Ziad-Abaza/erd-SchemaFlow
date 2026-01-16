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
import { AlertTriangle } from 'lucide-react';

interface RelationshipEdgeData {
  relationship: {
    sourceColumn: string;
    targetColumn: string;
    cardinality: '1:1' | '1:N' | 'N:M';
  };
  label: string;
  isValid?: boolean;
}

const RelationshipEdge = ({
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
}: EdgeProps<RelationshipEdgeData>) => {
  const isValid = data?.isValid !== false;
  const edgeColor = isValid ? (selected ? '#3b82f6' : '#6b7280') : '#ef4444';
  const strokeWidth = selected ? 3 : (isValid ? 2 : 3);
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getCardinalitySymbol = (cardinality: string, isSource: boolean) => {
    switch (cardinality) {
      case '1:1':
        return isSource ? '|' : '|';
      case '1:N':
        return isSource ? '|' : 'O';
      case 'N:M':
        return isSource ? 'O' : 'O';
      default:
        return isSource ? '|' : 'O';
    }
  };

  const getCrowsFootNotation = (cardinality: string) => {
    switch (cardinality) {
      case '1:1':
        return '||';
      case '1:N':
        return '|O';
      case 'N:M':
        return 'OO';
      default:
        return '|O';
    }
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={getMarkerEnd(markerEnd as MarkerType)}
        style={{
          strokeWidth,
          stroke: edgeColor,
        }}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className={cn(
            "bg-background border rounded px-2 py-1 shadow-md text-xs font-mono",
            "flex items-center gap-2 whitespace-nowrap",
            isValid ? "border-border" : "border-red-500 bg-red-50"
          )}>
            {!isValid && <AlertTriangle className="w-3 h-3 text-red-500" />}
            <span className={cn(
              "font-mono",
              isValid ? "text-muted-foreground" : "text-red-700"
            )}>
              {data?.relationship?.sourceColumn}
            </span>
            <span className={cn(
              "font-mono",
              isValid ? "text-foreground" : "text-red-900"
            )}>
              {getCrowsFootNotation(data?.relationship?.cardinality || '1:N')}
            </span>
            <span className={cn(
              "font-mono",
              isValid ? "text-muted-foreground" : "text-red-700"
            )}>
              {data?.relationship?.targetColumn}
            </span>
          </div>
        </div>
      </EdgeLabelRenderer>

      {/* Source cardinality marker */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${sourceX + (targetX - sourceX) * 0.2}px,${sourceY + (targetY - sourceY) * 0.2}px)`,
            pointerEvents: 'none',
          }}
        >
          <div className="text-xs font-bold text-foreground bg-background px-1 rounded border border-border">
            {getCardinalitySymbol(data?.relationship?.cardinality || '1:N', true)}
          </div>
        </div>
      </EdgeLabelRenderer>

      {/* Target cardinality marker */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${sourceX + (targetX - sourceX) * 0.8}px,${sourceY + (targetY - sourceY) * 0.8}px)`,
            pointerEvents: 'none',
          }}
        >
          <div className="text-xs font-bold text-foreground bg-background px-1 rounded border border-border">
            {getCardinalitySymbol(data?.relationship?.cardinality || '1:N', false)}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(RelationshipEdge);
