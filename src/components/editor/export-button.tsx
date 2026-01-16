"use client"

import React, { useState } from 'react';
import { Download, FileImage, FileText, File } from 'lucide-react';
import { useDiagramStore } from '@/store/use-diagram-store';
import { ExportEngine, ExportOptions } from '@/lib/export-engine';

export default function ExportButton() {
  const { nodes, edges } = useDiagramStore();
  const [isExporting, setIsExporting] = useState(false);
  const [showQuickExport, setShowQuickExport] = useState(false);

  const handleQuickExport = async (format: 'png' | 'svg' | 'pdf') => {
    setIsExporting(true);
    
    try {
      // Find the ReactFlow canvas element
      const reactFlowElement = document.querySelector('.react-flow') as HTMLElement;
      if (!reactFlowElement) {
        throw new Error('Diagram canvas not found. Please make sure the diagram is loaded.');
      }

      const options: ExportOptions = {
        format,
        quality: 1,
        scale: 2,
        backgroundColor: '#ffffff',
        includeEdges: true,
        includeColumnDetails: true,
        includeEdgeLabels: true,
        filename: `erd-diagram-${Date.now()}`
      };

      await ExportEngine.exportDiagram(reactFlowElement, options);
    } catch (error) {
      console.error('Export failed:', error);
      // Show a brief error indication
      console.error('Quick export failed:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsExporting(false);
      setShowQuickExport(false);
    }
  };

  const handleDocumentationExport = (format: 'markdown' | 'pdf') => {
    setIsExporting(true);
    
    try {
      ExportEngine.generateDocumentation(nodes, edges, {
        format,
        includeColumnDetails: true,
        includeRelationships: true,
        includeStatistics: true,
        filename: `schema-documentation-${Date.now()}`
      });
    } catch (error) {
      console.error('Documentation export failed:', error);
      console.error('Documentation export failed:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsExporting(false);
      setShowQuickExport(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="relative">
        {/* Quick Export Menu */}
        {showQuickExport && (
          <div className="absolute bottom-16 right-0 bg-card border border-border rounded-lg shadow-xl p-2 min-w-[200px]">
            <div className="text-xs font-semibold text-muted-foreground px-2 py-1 border-b border-border mb-2">
              Quick Export
            </div>
            
            {/* Image Export Options */}
            <div className="space-y-1 mb-2">
              <div className="text-xs font-medium text-foreground px-2 py-1">Image</div>
              <button
                onClick={() => handleQuickExport('png')}
                disabled={isExporting}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted rounded transition-colors disabled:opacity-50"
              >
                <FileImage className="w-3 h-3" />
                PNG
              </button>
              <button
                onClick={() => handleQuickExport('svg')}
                disabled={isExporting}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted rounded transition-colors disabled:opacity-50"
              >
                <FileText className="w-3 h-3" />
                SVG
              </button>
              <button
                onClick={() => handleQuickExport('pdf')}
                disabled={isExporting}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted rounded transition-colors disabled:opacity-50"
              >
                <File className="w-3 h-3" />
                PDF
              </button>
            </div>
            
            {/* Documentation Export Options */}
            <div className="space-y-1">
              <div className="text-xs font-medium text-foreground px-2 py-1 border-t border-border">Documentation</div>
              <button
                onClick={() => handleDocumentationExport('markdown')}
                disabled={isExporting}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted rounded transition-colors disabled:opacity-50"
              >
                <FileText className="w-3 h-3" />
                Markdown
              </button>
              <button
                onClick={() => handleDocumentationExport('pdf')}
                disabled={isExporting}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted rounded transition-colors disabled:opacity-50"
              >
                <File className="w-3 h-3" />
                Documentation PDF
              </button>
            </div>
          </div>
        )}

        {/* Main Export Button */}
        <button
          onClick={() => setShowQuickExport(!showQuickExport)}
          disabled={isExporting}
          className="bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
