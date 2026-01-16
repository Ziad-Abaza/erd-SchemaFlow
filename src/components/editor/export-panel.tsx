"use client"

import React, { useState, useRef } from 'react';
import { useDiagramStore } from '@/store/use-diagram-store';
import { ExportEngine, ExportOptions, DocumentationOptions } from '@/lib/export-engine';
import { 
  Download, 
  FileImage, 
  FileText, 
  File, 
  Settings, 
  X, 
  Check,
  Image as ImageIcon,
  FileDown,
  Database
} from 'lucide-react';

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportPanel({ isOpen, onClose }: ExportPanelProps) {
  const { nodes, edges } = useDiagramStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    quality: 1,
    scale: 2,
    backgroundColor: '#ffffff',
    includeEdges: true,
    includeColumnDetails: true,
    includeEdgeLabels: true,
  });
  
  const [documentationOptions, setDocumentationOptions] = useState<DocumentationOptions>({
    format: 'markdown',
    includeColumnDetails: true,
    includeRelationships: true,
    includeStatistics: true,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!canvasRef.current) return;
    
    setIsExporting(true);
    setExportSuccess(false);
    setExportError(null);
    
    try {
      // Find the ReactFlow canvas element
      const reactFlowElement = document.querySelector('.react-flow') as HTMLElement;
      if (!reactFlowElement) {
        throw new Error('Diagram canvas not found. Please make sure the diagram is loaded.');
      }

      await ExportEngine.exportDiagram(reactFlowElement, exportOptions);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Export failed due to an unknown error';
      setExportError(errorMessage);
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDocumentationExport = () => {
    setIsExporting(true);
    setExportSuccess(false);
    setExportError(null);
    
    try {
      ExportEngine.generateDocumentation(nodes, edges, documentationOptions);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Documentation export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Documentation export failed due to an unknown error';
      setExportError(errorMessage);
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const stats = ExportEngine.getDiagramStatistics(nodes, edges);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Export Diagram</h2>
              <p className="text-sm text-muted-foreground">
                Export your diagram as image or documentation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Statistics */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Diagram Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Tables:</span>
                <span className="ml-2 font-medium">{stats.tables}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Relationships:</span>
                <span className="ml-2 font-medium">{stats.relationships}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Columns:</span>
                <span className="ml-2 font-medium">{stats.totalColumns}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Keys:</span>
                <span className="ml-2 font-medium">{stats.primaryKeys + stats.foreignKeys}</span>
              </div>
            </div>
          </div>

          {/* Image Export Section */}
          <div className="mb-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Export as Image
            </h3>
            
            {/* Format Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Format</label>
              <div className="flex gap-2">
                {(['png', 'svg', 'pdf'] as const).map(format => (
                  <button
                    key={format}
                    onClick={() => setExportOptions(prev => ({ ...prev, format }))}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      exportOptions.format === format
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {format === 'png' && <FileImage className="w-4 h-4" />}
                      {format === 'svg' && <FileText className="w-4 h-4" />}
                      {format === 'pdf' && <File className="w-4 h-4" />}
                      <span className="uppercase">{format}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Settings */}
            {exportOptions.format === 'png' || exportOptions.format === 'pdf' ? (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quality: {Math.round(exportOptions.quality! * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={exportOptions.quality}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      quality: parseFloat(e.target.value) 
                    }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Scale: {exportOptions.scale}x
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.5"
                    value={exportOptions.scale}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      scale: parseFloat(e.target.value) 
                    }))}
                    className="w-full"
                  />
                </div>
              </div>
            ) : null}

            {/* Background Color */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Background Color</label>
              <div className="flex gap-2">
                {['#ffffff', '#f3f4f6', '#374151', '#000000'].map(color => (
                  <button
                    key={color}
                    onClick={() => setExportOptions(prev => ({ ...prev, backgroundColor: color }))}
                    className={`w-8 h-8 rounded border-2 ${
                      exportOptions.backgroundColor === color
                        ? 'border-primary'
                        : 'border-border'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeEdges}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    includeEdges: e.target.checked 
                  }))}
                  className="rounded"
                />
                <span className="text-sm">Include relationships</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeColumnDetails}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    includeColumnDetails: e.target.checked 
                  }))}
                  className="rounded"
                />
                <span className="text-sm">Include column details</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeEdgeLabels}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    includeEdgeLabels: e.target.checked 
                  }))}
                  className="rounded"
                />
                <span className="text-sm">Include edge labels</span>
              </label>
            </div>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Export Image
                </>
              )}
            </button>
          </div>

          {/* Documentation Export Section */}
          <div>
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Export Documentation
            </h3>

            {/* Documentation Format */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Format</label>
              <div className="flex gap-2">
                {(['markdown', 'pdf'] as const).map(format => (
                  <button
                    key={format}
                    onClick={() => setDocumentationOptions(prev => ({ ...prev, format }))}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      documentationOptions.format === format
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-muted border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="capitalize">{format}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Documentation Options */}
            <div className="space-y-2 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={documentationOptions.includeColumnDetails}
                  onChange={(e) => setDocumentationOptions(prev => ({ 
                    ...prev, 
                    includeColumnDetails: e.target.checked 
                  }))}
                  className="rounded"
                />
                <span className="text-sm">Include column details</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={documentationOptions.includeRelationships}
                  onChange={(e) => setDocumentationOptions(prev => ({ 
                    ...prev, 
                    includeRelationships: e.target.checked 
                  }))}
                  className="rounded"
                />
                <span className="text-sm">Include relationships</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={documentationOptions.includeStatistics}
                  onChange={(e) => setDocumentationOptions(prev => ({ 
                    ...prev, 
                    includeStatistics: e.target.checked 
                  }))}
                  className="rounded"
                />
                <span className="text-sm">Include statistics</span>
              </label>
            </div>

            <button
              onClick={handleDocumentationExport}
              disabled={isExporting}
              className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Export Documentation
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {exportSuccess && (
          <div className="absolute bottom-6 right-6 bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
            <Check className="w-4 h-4" />
            Export successful!
          </div>
        )}

        {/* Error Message */}
        {exportError && (
          <div className="absolute bottom-6 right-6 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg max-w-md">
            <X className="w-4 h-4" />
            <span className="text-sm">{exportError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
