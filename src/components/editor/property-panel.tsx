"use client"

import React, { useState, useEffect } from 'react';
import { X, Settings, Database, Key, AlertTriangle, Plus, Trash2, Edit3, Share2, Link as LinkIcon } from 'lucide-react';
import { useDiagramStore } from '@/store/use-diagram-store';
import { Column, TableIndex } from './nodes/table-node';
import { cn } from '@/lib/utils';

const PropertyPanel = () => {
    const nodes = useDiagramStore(state => state.nodes);
    const edges = useDiagramStore(state => state.edges);
    const selectedNodes = useDiagramStore(state => state.selectedNodes);
    const selectedEdges = useDiagramStore(state => state.selectedEdges);
    const clearSelection = useDiagramStore(state => state.clearSelection);
    const updateTableProperties = useDiagramStore(state => state.updateTableProperties);
    const updateColumnProperties = useDiagramStore(state => state.updateColumnProperties);
    const addIndex = useDiagramStore(state => state.addIndex);
    const updateIndex = useDiagramStore(state => state.updateIndex);
    const deleteIndex = useDiagramStore(state => state.deleteIndex);
    const validateDiagram = useDiagramStore(state => state.validateDiagram);
    const updateRelationshipCardinality = useDiagramStore(state => state.updateRelationshipCardinality);
    const updateEdgeData = useDiagramStore(state => state.updateEdgeData);

    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'table' | 'column' | 'indexes' | 'validation' | 'relationship'>('table');
    const [selectedColumn, setSelectedColumn] = useState<string | null>(null);
    const [editingIndex, setEditingIndex] = useState<string | null>(null);
    const [validation, setValidation] = useState<{ isValid: boolean; errors: string[]; warnings: string[] } | null>(null);

    const selectedNode = nodes.find(node => selectedNodes.includes(node.id));
    const selectedEdge = edges.find(edge => selectedEdges.includes(edge.id));
    const tableData = selectedNode?.data;
    const relationshipData = selectedEdge?.data?.relationship;

    useEffect(() => {
        if (selectedNodes.length > 0) {
            setIsOpen(true);
            setActiveTab('table');
            setSelectedColumn(null);
        } else if (selectedEdges.length > 0) {
            setIsOpen(true);
            setActiveTab('relationship');
        } else {
            setIsOpen(false);
        }
    }, [selectedNodes, selectedEdges]);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (isOpen && selectedNode) {
            // Debounce validation in property panel to avoid blocking UI
            timeout = setTimeout(() => {
                const result = validateDiagram();
                setValidation(result);
            }, 300);
        }
        return () => clearTimeout(timeout);
    }, [isOpen, selectedNode, validateDiagram]);

    const handleClose = () => {
        setIsOpen(false);
        clearSelection();
    };

    const handleTablePropertyChange = (property: string, value: string) => {
        if (!selectedNode) return;
        updateTableProperties(selectedNode.id, { [property]: value });
    };

    const handleColumnPropertyChange = (columnId: string, property: string, value: any) => {
        if (!selectedNode) return;
        updateColumnProperties(selectedNode.id, columnId, { [property]: value });
    };

    const handleAddIndex = () => {
        if (!selectedNode) return;

        const newIndex: Omit<TableIndex, 'id'> = {
            name: `idx_${Date.now()}`,
            columns: [],
            type: 'INDEX'
        };

        addIndex(selectedNode.id, newIndex);
    };

    const handleUpdateIndex = (indexId: string, property: string, value: any) => {
        if (!selectedNode) return;
        updateIndex(selectedNode.id, indexId, { [property]: value });
    };

    const handleDeleteIndex = (indexId: string) => {
        if (!selectedNode) return;
        deleteIndex(selectedNode.id, indexId);
    };

    const handleCardinalityChange = (value: string) => {
        if (!selectedEdge) return;
        updateRelationshipCardinality(selectedEdge.id, value as any);
    };

    if (!isOpen) return null;
    if (!selectedNode && !selectedEdge) return null;

    return (
        <div className="fixed right-0 top-0 h-full w-80 bg-background border-l border-border shadow-lg z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <h2 className="font-semibold text-sm">Properties</h2>
                </div>
                <button
                    onClick={handleClose}
                    className="text-muted-foreground hover:text-foreground p-1 rounded"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Selection Name */}
            <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                    {selectedNode ? (
                        <>
                            <Database className="w-4 h-4 text-primary" />
                            <span className="font-medium text-sm">{tableData?.label}</span>
                        </>
                    ) : (
                        <>
                            <Share2 className="w-4 h-4 text-blue-500" />
                            <span className="font-medium text-sm">Relationship</span>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
                {selectedNode ? [
                    { id: 'table', label: 'Table', icon: Database },
                    { id: 'column', label: 'Column', icon: Key },
                    { id: 'indexes', label: 'Indexes', icon: Settings },
                    { id: 'validation', label: 'Validation', icon: AlertTriangle }
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors",
                            activeTab === id
                                ? "text-primary border-b-2 border-primary bg-primary/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        <Icon className="w-3 h-3" />
                        {label}
                    </button>
                )) : [
                    { id: 'relationship', label: 'Relationship', icon: Share2 },
                    { id: 'validation', label: 'Validation', icon: AlertTriangle }
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors",
                            activeTab === id
                                ? "text-primary border-b-2 border-primary bg-primary/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        <Icon className="w-3 h-3" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {selectedNode && (
                    <>
                        {/* Table Properties */}
                        {activeTab === 'table' && tableData && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Engine</label>
                                    <select
                                        value={tableData.engine || 'InnoDB'}
                                        onChange={(e) => handleTablePropertyChange('engine', e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
                                    >
                                        <option value="InnoDB">InnoDB</option>
                                        <option value="MyISAM">MyISAM</option>
                                        <option value="MEMORY">MEMORY</option>
                                        <option value="ARCHIVE">ARCHIVE</option>
                                        <option value="CSV">CSV</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Collation</label>
                                    <input
                                        type="text"
                                        value={tableData.collation || 'utf8mb4_unicode_ci'}
                                        onChange={(e) => handleTablePropertyChange('collation', e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
                                        placeholder="utf8mb4_unicode_ci"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">Comment</label>
                                    <textarea
                                        value={tableData.comment || ''}
                                        onChange={(e) => handleTablePropertyChange('comment', e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-border rounded bg-background resize-none"
                                        rows={3}
                                        placeholder="Table description..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Column Properties */}
                        {activeTab === 'column' && tableData && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-foreground mb-2">Select Column</label>
                                    <div className="space-y-1">
                                        {tableData.columns.map((column: Column) => (
                                            <button
                                                key={column.id}
                                                onClick={() => setSelectedColumn(column.id)}
                                                className={cn(
                                                    "w-full text-left px-2 py-1.5 text-xs rounded border transition-colors",
                                                    selectedColumn === column.id
                                                        ? "border-primary bg-primary/5 text-primary"
                                                        : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                                                )}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-mono">{column.name}</span>
                                                    <span className="text-muted-foreground">{column.type}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedColumn && (
                                    <div className="space-y-3 border-t border-border pt-3">
                                        {(() => {
                                            const column = tableData.columns.find((c: Column) => c.id === selectedColumn);
                                            if (!column) return null;

                                            return (
                                                <>
                                                    <div>
                                                        <label className="block text-xs font-medium text-foreground mb-1">Type</label>
                                                        <select
                                                            value={column.type}
                                                            onChange={(e) => handleColumnPropertyChange(selectedColumn, 'type', e.target.value)}
                                                            className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
                                                        >
                                                            <option value="varchar(255)">VARCHAR(255)</option>
                                                            <option value="text">TEXT</option>
                                                            <option value="int">INT</option>
                                                            <option value="bigint">BIGINT</option>
                                                            <option value="uuid">UUID</option>
                                                            <option value="timestamp">TIMESTAMP</option>
                                                            <option value="datetime">DATETIME</option>
                                                            <option value="boolean">BOOLEAN</option>
                                                            <option value="decimal">DECIMAL</option>
                                                            <option value="float">FLOAT</option>
                                                            <option value="double">DOUBLE</option>
                                                            <option value="json">JSON</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-foreground mb-1">Default Value</label>
                                                        <input
                                                            type="text"
                                                            value={column.defaultValue || ''}
                                                            onChange={(e) => handleColumnPropertyChange(selectedColumn, 'defaultValue', e.target.value)}
                                                            className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
                                                            placeholder="NULL or custom value"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-foreground mb-1">Collation</label>
                                                        <input
                                                            type="text"
                                                            value={column.collation || ''}
                                                            onChange={(e) => handleColumnPropertyChange(selectedColumn, 'collation', e.target.value)}
                                                            className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
                                                            placeholder="utf8mb4_unicode_ci"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-medium text-foreground mb-1">Comment</label>
                                                        <textarea
                                                            value={column.comment || ''}
                                                            onChange={(e) => handleColumnPropertyChange(selectedColumn, 'comment', e.target.value)}
                                                            className="w-full px-2 py-1 text-xs border border-border rounded bg-background resize-none"
                                                            rows={2}
                                                            placeholder="Column description..."
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="flex items-center gap-2 text-xs">
                                                            <input
                                                                type="checkbox"
                                                                checked={column.isNullable || false}
                                                                onChange={(e) => handleColumnPropertyChange(selectedColumn, 'isNullable', e.target.checked)}
                                                                className="rounded border-border"
                                                            />
                                                            <span>Nullable</span>
                                                        </label>

                                                        <label className="flex items-center gap-2 text-xs">
                                                            <input
                                                                type="checkbox"
                                                                checked={column.isUnique || false}
                                                                onChange={(e) => handleColumnPropertyChange(selectedColumn, 'isUnique', e.target.checked)}
                                                                className="rounded border-border"
                                                                disabled={column.isPrimaryKey}
                                                            />
                                                            <span>Unique</span>
                                                        </label>

                                                        <label className="flex items-center gap-2 text-xs">
                                                            <input
                                                                type="checkbox"
                                                                checked={column.isIndexed || false}
                                                                onChange={(e) => handleColumnPropertyChange(selectedColumn, 'isIndexed', e.target.checked)}
                                                                className="rounded border-border"
                                                            />
                                                            <span>Indexed</span>
                                                        </label>

                                                        <label className="flex items-center gap-2 text-xs">
                                                            <input
                                                                type="checkbox"
                                                                checked={column.autoIncrement || false}
                                                                onChange={(e) => handleColumnPropertyChange(selectedColumn, 'autoIncrement', e.target.checked)}
                                                                className="rounded border-border"
                                                                disabled={!column.isPrimaryKey || !column.type.includes('int')}
                                                            />
                                                            <span>Auto Increment</span>
                                                        </label>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Indexes */}
                        {activeTab === 'indexes' && tableData && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-medium text-foreground">Table Indexes</h3>
                                    <button
                                        onClick={handleAddIndex}
                                        className="text-primary hover:text-primary/80 p-1 rounded"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {(tableData.indexes || []).map((index: TableIndex) => (
                                        <div key={index.id} className="border border-border rounded p-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <input
                                                    type="text"
                                                    value={index.name}
                                                    onChange={(e) => handleUpdateIndex(index.id, 'name', e.target.value)}
                                                    className="text-xs font-medium bg-transparent border-none p-0 focus:outline-none"
                                                />
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setEditingIndex(editingIndex === index.id ? null : index.id)}
                                                        className="text-muted-foreground hover:text-foreground p-0.5"
                                                    >
                                                        <Edit3 className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteIndex(index.id)}
                                                        className="text-muted-foreground hover:text-red-600 p-0.5"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <select
                                                    value={index.type}
                                                    onChange={(e) => handleUpdateIndex(index.id, 'type', e.target.value)}
                                                    className="text-xs border border-border rounded px-1 py-0.5 bg-background"
                                                >
                                                    <option value="INDEX">INDEX</option>
                                                    <option value="UNIQUE">UNIQUE</option>
                                                    <option value="FULLTEXT">FULLTEXT</option>
                                                    <option value="SPATIAL">SPATIAL</option>
                                                </select>

                                                {editingIndex === index.id && (
                                                    <div className="mt-2 space-y-1">
                                                        <label className="text-xs text-muted-foreground">Columns:</label>
                                                        {tableData.columns.map((column: Column) => (
                                                            <label key={column.id} className="flex items-center gap-2 text-xs">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={index.columns.includes(column.id)}
                                                                    onChange={(e) => {
                                                                        const columns = e.target.checked
                                                                            ? [...index.columns, column.id]
                                                                            : index.columns.filter(id => id !== column.id);
                                                                        handleUpdateIndex(index.id, 'columns', columns);
                                                                    }}
                                                                    className="rounded border-border"
                                                                />
                                                                <span>{column.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {(!tableData.indexes || tableData.indexes.length === 0) && (
                                        <div className="text-xs text-muted-foreground text-center py-4">
                                            No indexes defined
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {selectedEdge && activeTab === 'relationship' && relationshipData && (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connectivity</h3>

                            <div className="p-3 rounded-lg border bg-muted/20 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Parent Table:</span>
                                    <span className="font-mono font-medium">{relationshipData.sourceTable}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Parent Column:</span>
                                    <span className="font-mono text-primary">{relationshipData.sourceColumn}</span>
                                </div>
                                <div className="my-2 border-t border-dashed border-border/50" />
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Child Table:</span>
                                    <span className="font-mono font-medium">{relationshipData.targetTable}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Child Column:</span>
                                    <span className="font-mono text-primary">{relationshipData.targetColumn}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cardinality</h3>

                            <div>
                                <label className="block text-xs font-medium text-foreground mb-2">Relationship Type</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { value: '1:N', label: 'One to Many (1:N)', desc: 'One parent, multiple children' },
                                        { value: '1:1', label: 'One to One (1:1)', desc: 'One parent, one child' },
                                        { value: '0:N', label: 'Zero to Many (0:N)', desc: 'Optional parent, multiple children' },
                                        { value: '0:1', label: 'Zero to One (0:1)', desc: 'Optional parent, one child' },
                                        { value: 'N:M', label: 'Many to Many (N:M)', desc: 'Multiple parents, multiple children' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleCardinalityChange(opt.value)}
                                            className={cn(
                                                "w-full text-left p-2 rounded border transition-all hover:bg-muted/50",
                                                relationshipData.cardinality === opt.value
                                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                    : "border-border"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium">{opt.label}</span>
                                                {relationshipData.cardinality === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settings</h3>
                            <label className="flex items-center gap-3 p-2 rounded border border-border bg-background cursor-pointer hover:bg-muted/30 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={relationshipData.isIdentifying ?? true}
                                    onChange={(e) => {
                                        updateEdgeData(selectedEdge.id, {
                                            relationship: {
                                                ...relationshipData,
                                                isIdentifying: e.target.checked
                                            }
                                        });
                                    }}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium">Identifying Relationship</span>
                                    <span className="text-[10px] text-muted-foreground">Child existence depends on parent</span>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {/* Validation */}
                {activeTab === 'validation' && validation && (
                    <div className="space-y-4">
                        <div className={cn(
                            "p-3 rounded text-xs",
                            validation.isValid
                                ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
                                : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
                        )}>
                            <div className="flex items-center gap-2 font-medium">
                                <AlertTriangle className="w-3 h-3" />
                                {validation.isValid ? 'Valid Schema' : 'Schema Issues Found'}
                            </div>
                        </div>

                        {validation.errors.length > 0 && (
                            <div>
                                <h4 className="text-xs font-medium text-foreground mb-2">Errors</h4>
                                <div className="space-y-1">
                                    {validation.errors.map((error, index) => (
                                        <div key={index} className="text-xs text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                                            {error}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {validation.warnings.length > 0 && (
                            <div>
                                <h4 className="text-xs font-medium text-foreground mb-2">Warnings</h4>
                                <div className="space-y-1">
                                    {validation.warnings.map((warning, index) => (
                                        <div key={index} className="text-xs text-yellow-600 dark:text-yellow-400 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                                            {warning}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {validation.errors.length === 0 && validation.warnings.length === 0 && (
                            <div className="text-xs text-muted-foreground text-center py-4">
                                No issues found. Schema looks good!
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertyPanel;
