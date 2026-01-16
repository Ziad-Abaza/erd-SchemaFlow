"use client";

import React, { useState } from 'react';
import { Panel } from 'reactflow';
import { useDiagramStore } from '@/store/use-diagram-store';
import { 
    Download, 
    FileImage, 
    FileText, 
    Upload, 
    Database, 
    Layout, 
    ChevronDown,
    History,
    Save,
    FolderOpen,
    Settings
} from 'lucide-react';
import { SqlImportPanel } from './sql-import-panel';

const Toolbar = () => {
    const { selectedNodes, deleteSelectedNodes, addTable, detectRelationships, autoLayout, runValidation, saveToLocal, loadFromLocal } = useDiagramStore();
    const [showImportPanel, setShowImportPanel] = useState(false);
    const [showLayoutOptions, setShowLayoutOptions] = useState(false);
    const [showHistoryPanel, setShowHistoryPanel] = useState(false);
    const [showExportPanel, setShowExportPanel] = useState(false);

    const handleAddNewTable = () => {
        const tableName = prompt('Enter table name:');
        if (tableName?.trim()) {
            addTable({ label: tableName.trim() });
        }
    };

    const openExportPanel = () => {
        setShowExportPanel(true);
    };

    const openImportPanel = () => {
        setShowImportPanel(true);
    };

    const openHistoryPanel = () => {
        setShowHistoryPanel(true);
    };

    const handleSmartLayout = (type: 'hierarchical' | 'force' | 'group' = 'hierarchical') => {
        autoLayout({ type, direction: 'TB' });
        setShowLayoutOptions(false);
    };

    const handleQuickExport = (format: 'png' | 'svg' | 'pdf' | 'sql') => {
        // This will trigger the export panel with pre-selected format
        const event = new CustomEvent('openExportPanel', { detail: { format } });
        window.dispatchEvent(event);
    };

    return (
        <>
            <Panel 
                position="top-right" 
                className="react-flow__panel flex flex-col gap-4 p-4 w-64"
            >
                <div className="bg-card/95 backdrop-blur-sm rounded-xl shadow-lg border border-border p-4 transition-all duration-200 hover:shadow-xl">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-3 h-3 bg-gradient-to-r from-primary to-primary/80 rounded-full animate-pulse"></div>
                        <div>
                            <div className="text-sm font-semibold text-foreground">ERD Editor</div>
                            <div className="text-xs text-muted-foreground">Professional Database Design</div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3">
                        <div className="text-xs font-semibold text-foreground/80 mb-2">Quick Actions</div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleAddNewTable}
                                className="bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 flex items-center justify-center p-3 text-xs font-medium shadow-sm hover:shadow-md"
                            >
                                <Database className="w-4 h-4" />
                                Add Table
                            </button>
                            
                            {selectedNodes.length > 0 && (
                                <button
                                    onClick={deleteSelectedNodes}
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 flex items-center justify-center p-3 text-xs font-medium shadow-sm hover:shadow-md"
                                >
                                    Delete Selected ({selectedNodes.length})
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={detectRelationships}
                                className="bg-card/80 hover:bg-card text-foreground border border-border rounded-lg transition-all duration-200 flex items-center justify-center p-3 text-xs font-medium shadow-sm hover:shadow-md"
                            >
                                <Layout className="w-4 h-4" />
                                Detect Relationships
                            </button>
                            
                            <div className="relative">
                                <button 
                                    onClick={() => setShowLayoutOptions(!showLayoutOptions)}
                                    className="bg-card/80 hover:bg-card text-foreground border border-border rounded-lg transition-all duration-200 flex items-center justify-center p-3 text-xs font-medium shadow-sm hover:shadow-md"
                                >
                                    <Layout className="w-4 h-4" />
                                    Smart Layout
                                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showLayoutOptions ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {/* Layout Options Dropdown */}
                                {showLayoutOptions && (
                                    <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 min-w-56 p-2">
                                        <div className="space-y-1">
                                            <button
                                                onClick={() => handleSmartLayout('hierarchical')}
                                                className="w-full text-left px-3 py-2 text-xs hover:bg-accent rounded-lg transition-colors flex items-center gap-3"
                                            >
                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                <div>
                                                    <div className="font-medium">Hierarchical Layout</div>
                                                    <div className="text-muted-foreground text-xs">Best for parent-child relationships</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => handleSmartLayout('force')}
                                                className="w-full text-left px-3 py-2 text-xs hover:bg-accent rounded-lg transition-colors flex items-center gap-3"
                                            >
                                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                <div>
                                                    <div className="font-medium">Force Directed Layout</div>
                                                    <div className="text-muted-foreground text-xs">Optimizes relationship flow</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => handleSmartLayout('group')}
                                                className="w-full text-left px-3 py-2 text-xs hover:bg-accent rounded-lg transition-colors flex items-center gap-3"
                                            >
                                                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                                <div>
                                                    <div className="font-medium">Group Layout</div>
                                                    <div className="text-muted-foreground text-xs">Groups related tables</div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={runValidation}
                            className="w-full bg-card/80 hover:bg-card text-foreground border border-border rounded-lg transition-all duration-200 flex items-center justify-center p-3 text-xs font-medium shadow-sm hover:shadow-md"
                        >
                            <Settings className="w-4 h-4" />
                            Validate Schema
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-border/60 my-4"></div>

                    {/* Data Management */}
                    <div className="space-y-3">
                        <div className="text-xs font-semibold text-foreground/80 mb-2">Data Management</div>
                        
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={openImportPanel}
                                className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-all duration-200 flex items-center justify-center p-3 text-xs font-medium shadow-sm hover:shadow-md"
                            >
                                <Upload className="w-4 h-4" />
                                Import SQL
                            </button>
                            
                            <div className="relative">
                                <button 
                                    onClick={() => setShowExportPanel(!showExportPanel)}
                                    className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-lg transition-all duration-200 flex items-center justify-center p-3 text-xs font-medium shadow-sm hover:shadow-md"
                                >
                                    <Download className="w-4 h-4" />
                                    Export
                                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showExportPanel ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {/* Export Options Dropdown */}
                                {showExportPanel && (
                                    <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-50 min-w-56 p-2">
                                        <div className="space-y-1">
                                            <button
                                                onClick={() => handleQuickExport('png')}
                                                className="w-full text-left px-3 py-2 text-xs hover:bg-accent rounded-lg transition-colors flex items-center gap-3"
                                            >
                                                <FileImage className="w-3 h-3" />
                                                <div>
                                                    <div className="font-medium">Export as PNG</div>
                                                    <div className="text-muted-foreground text-xs">High-resolution image</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => handleQuickExport('svg')}
                                                className="w-full text-left px-3 py-2 text-xs hover:bg-accent rounded-lg transition-colors flex items-center gap-3"
                                            >
                                                <FileText className="w-3 h-3" />
                                                <div>
                                                    <div className="font-medium">Export as SVG</div>
                                                    <div className="text-muted-foreground text-xs">Vector graphics</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => handleQuickExport('pdf')}
                                                className="w-full text-left px-3 py-2 text-xs hover:bg-accent rounded-lg transition-colors flex items-center gap-3"
                                            >
                                                <FileText className="w-3 h-3" />
                                                <div>
                                                    <div className="font-medium">Export as PDF</div>
                                                    <div className="text-muted-foreground text-xs">Document format</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => handleQuickExport('sql')}
                                                className="w-full text-left px-3 py-2 text-xs hover:bg-accent rounded-lg transition-colors flex items-center gap-3"
                                            >
                                                <Database className="w-3 h-3" />
                                                <div>
                                                    <div className="font-medium">Export as SQL</div>
                                                    <div className="text-muted-foreground text-xs">Database schema</div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={openHistoryPanel}
                                className="bg-card/80 hover:bg-card text-foreground border border-border rounded-lg transition-all duration-200 flex items-center justify-center p-3 text-xs font-medium shadow-sm hover:shadow-md"
                            >
                                <History className="w-4 h-4" />
                                History
                            </button>
                            
                            <button
                                onClick={saveToLocal}
                                className="bg-card/80 hover:bg-card text-foreground border border-border rounded-lg transition-all duration-200 flex items-center justify-center p-3 text-xs font-medium shadow-sm hover:shadow-md"
                            >
                                <Save className="w-4 h-4" />
                                Save Project
                            </button>
                        </div>
                    </div>
                </div>
            </Panel>
            
            {/* Import Panel */}
            {showImportPanel && (
                <SqlImportPanel onClose={() => setShowImportPanel(false)} />
            )}

            {/* Export Panel - Will be handled by existing export panel component */}
            {showExportPanel && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl shadow-2xl border border-border p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-foreground">Export Options</h3>
                            <button
                                onClick={() => setShowExportPanel(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="text-sm text-muted-foreground mb-4">
                            Choose your preferred export format from the options above.
                        </div>
                    </div>
                </div>
            )}

            {/* History Panel - Will be handled by existing history component */}
            {showHistoryPanel && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl shadow-2xl border border-border p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-foreground">Project History</h3>
                            <button
                                onClick={() => setShowHistoryPanel(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="text-sm text-muted-foreground mb-4">
                            View and restore previous versions of your diagram.
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Toolbar;
