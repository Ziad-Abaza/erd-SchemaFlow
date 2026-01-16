"use client";

import React from 'react';
import { RotateCcw, GitBranch, Zap, Layers, Sparkles } from 'lucide-react';
import { useDiagramStore } from '@/store/use-diagram-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const LayoutControls = () => {
  const { detectRelationships, autoLayout, validateDiagram } = useDiagramStore();

  const handleDetectRelationships = () => {
    detectRelationships();
  };

  const handleAutoLayout = (type: 'hierarchical' | 'force' | 'group', direction?: 'TB' | 'LR' | 'BT' | 'RL') => {
    autoLayout({ type, direction });
  };

  const handleOptimizedLayout = () => {
    // Optimized layout with edge crossing minimization
    autoLayout({ type: 'hierarchical', direction: 'TB' });
    setTimeout(() => {
      detectRelationships(); // Re-detect relationships after layout
    }, 100);
  };

  const handleValidate = () => {
    const validation = validateDiagram();
    if (validation.isValid) {
      console.log('Diagram is valid!');
    } else {
      console.error('Validation errors:', validation.errors);
      console.warn('Validation warnings:', validation.warnings);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDetectRelationships}
        className="flex items-center gap-2 text-xs transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-accent/50"
      >
        <GitBranch className="w-3 h-3 transition-transform duration-200 group-hover:rotate-12" />
        <span>Detect Relationships</span>
      </Button>

      <Button
        variant="default"
        size="sm"
        onClick={handleOptimizedLayout}
        className="flex items-center gap-2 text-xs transition-all duration-200 hover:scale-105 hover:shadow-lg bg-gradient-to-r from-primary/80 to-primary/60 hover:from-primary hover:to-primary/90"
      >
        <Sparkles className="w-3 h-3 transition-transform duration-200 group-hover:rotate-12" />
        <span className="font-medium">Smart Layout</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-xs transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-accent/50"
          >
            <RotateCcw className="w-3 h-3 transition-transform duration-200 group-hover:rotate-12" />
            <span>Auto Layout</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 bg-card/95 backdrop-blur-sm border-border shadow-lg">
          <div className="p-3 border-b border-border">
            <div className="text-xs font-semibold text-foreground flex items-center gap-2">
              <RotateCcw className="w-3 h-3" />
              Hierarchical Layout
            </div>
            <div className="text-xs text-muted-foreground mt-1">Organize nodes in tree structure</div>
          </div>
          <div className="p-1">
            <DropdownMenuItem 
              onClick={() => handleAutoLayout('hierarchical', 'TB')}
              className="flex items-center gap-3 text-xs p-2 transition-colors duration-150 hover:bg-accent/50 rounded-sm"
            >
              <div className="w-6 h-6 bg-accent/30 rounded flex items-center justify-center">
                <RotateCcw className="w-3 h-3" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Top to Bottom</div>
                <div className="text-muted-foreground text-[10px]">Vertical flow</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleAutoLayout('hierarchical', 'LR')}
              className="flex items-center gap-3 text-xs p-2 transition-colors duration-150 hover:bg-accent/50 rounded-sm"
            >
              <div className="w-6 h-6 bg-accent/30 rounded flex items-center justify-center">
                <RotateCcw className="w-3 h-3 rotate-90" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Left to Right</div>
                <div className="text-muted-foreground text-[10px]">Horizontal flow</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleAutoLayout('hierarchical', 'BT')}
              className="flex items-center gap-3 text-xs p-2 transition-colors duration-150 hover:bg-accent/50 rounded-sm"
            >
              <div className="w-6 h-6 bg-accent/30 rounded flex items-center justify-center">
                <RotateCcw className="w-3 h-3 rotate-180" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Bottom to Top</div>
                <div className="text-muted-foreground text-[10px]">Inverted vertical</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleAutoLayout('hierarchical', 'RL')}
              className="flex items-center gap-3 text-xs p-2 transition-colors duration-150 hover:bg-accent/50 rounded-sm"
            >
              <div className="w-6 h-6 bg-accent/30 rounded flex items-center justify-center">
                <RotateCcw className="w-3 h-3 -rotate-90" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Right to Left</div>
                <div className="text-muted-foreground text-[10px]">Inverted horizontal</div>
              </div>
            </DropdownMenuItem>
          </div>
          
          <div className="border-t border-border my-1" />
          
          <div className="p-1">
            <DropdownMenuItem 
              onClick={() => handleAutoLayout('force')}
              className="flex items-center gap-3 text-xs p-2 transition-colors duration-150 hover:bg-accent/50 rounded-sm"
            >
              <div className="w-6 h-6 bg-accent/30 rounded flex items-center justify-center">
                <Zap className="w-3 h-3" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Force-Directed</div>
                <div className="text-muted-foreground text-[10px]">Physics-based layout</div>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem 
              onClick={() => handleAutoLayout('group')}
              className="flex items-center gap-3 text-xs p-2 transition-colors duration-150 hover:bg-accent/50 rounded-sm"
            >
              <div className="w-6 h-6 bg-accent/30 rounded flex items-center justify-center">
                <Layers className="w-3 h-3" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Group by Relationships</div>
                <div className="text-muted-foreground text-[10px]">Cluster related tables</div>
              </div>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        onClick={handleValidate}
        className="flex items-center gap-2 text-xs transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-accent/50"
      >
        <Layers className="w-3 h-3 transition-transform duration-200 group-hover:rotate-12" />
        <span>Validate</span>
      </Button>
    </div>
  );
};

export default LayoutControls;
