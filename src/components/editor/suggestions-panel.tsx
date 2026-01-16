"use client"

import { memo, useState, useMemo } from 'react';
import { useDiagramStore } from '@/store/use-diagram-store';
import { cn } from '@/lib/utils';
import { Column } from './nodes/table-node';
import { 
    Lightbulb, 
    Link, 
    Hash, 
    Check, 
    X, 
    ChevronDown, 
    ChevronUp,
    Target,
    ArrowRight
} from 'lucide-react';

const SuggestionsPanel = memo(() => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        foreignKeys: true,
        indexes: false
    });

    const { 
        nodes, 
        suggestForeignKeys, 
        suggestIndexes, 
        createSuggestedForeignKey, 
        createIndex 
    } = useDiagramStore();

    const fkSuggestions = useMemo(() => suggestForeignKeys(), [suggestForeignKeys]);
    const indexSuggestions = useMemo(() => suggestIndexes(), [suggestIndexes]);

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const getTableName = (tableId: string) => {
        const table = nodes.find(node => node.id === tableId);
        return table?.data.label || 'Unknown';
    };

    const getColumnName = (tableId: string, columnId: string) => {
        const table = nodes.find(node => node.id === tableId);
        const column = table?.data.columns.find((col: Column) => col.id === columnId);
        return column?.name || 'Unknown';
    };

    const handleCreateFK = (suggestion: typeof fkSuggestions[0]) => {
        createSuggestedForeignKey(
            suggestion.sourceTableId,
            suggestion.sourceColumnId,
            suggestion.targetTableId,
            suggestion.targetColumnId
        );
    };

    const handleCreateIndex = (suggestion: typeof indexSuggestions[0]) => {
        const table = nodes.find(node => node.id === suggestion.tableId);
        const column = table?.data.columns.find((col: Column) => col.name === suggestion.columnName);
        if (column) {
            createIndex(suggestion.tableId, column.id);
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'text-green-600';
        if (confidence >= 0.6) return 'text-yellow-600';
        return 'text-orange-600';
    };

    const getConfidenceLabel = (confidence: number) => {
        if (confidence >= 0.8) return 'High';
        if (confidence >= 0.6) return 'Medium';
        return 'Low';
    };

    if (fkSuggestions.length === 0 && indexSuggestions.length === 0) {
        return null;
    }

    return (
        <div className="bg-card/95 backdrop-blur-sm rounded-lg shadow-md border border-border p-3 transition-all duration-200 hover:shadow-lg max-w-sm">
            <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <div className="text-sm font-semibold text-foreground">Smart Suggestions</div>
            </div>

            {/* Foreign Key Suggestions */}
            {fkSuggestions.length > 0 && (
                <div className="mb-3">
                    <button
                        onClick={() => toggleSection('foreignKeys')}
                        className="flex items-center justify-between w-full text-left hover:bg-muted p-1 rounded transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Link className="w-3 h-3 text-blue-500" />
                            <span className="text-xs font-medium">
                                Foreign Keys ({fkSuggestions.length})
                            </span>
                        </div>
                        {expandedSections.foreignKeys ? (
                            <ChevronUp className="w-3 h-3" />
                        ) : (
                            <ChevronDown className="w-3 h-3" />
                        )}
                    </button>

                    {expandedSections.foreignKeys && (
                        <div className="mt-2 space-y-2">
                            {fkSuggestions.slice(0, 5).map((suggestion, index) => (
                                <div key={index} className="bg-muted/50 rounded p-2 text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">
                                                {getTableName(suggestion.sourceTableId)}.{getColumnName(suggestion.sourceTableId, suggestion.sourceColumnId)}
                                            </span>
                                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                            <span className="font-medium">
                                                {getTableName(suggestion.targetTableId)}.{getColumnName(suggestion.targetTableId, suggestion.targetColumnId)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className={cn("text-[10px]", getConfidenceColor(suggestion.confidence))}>
                                                {getConfidenceLabel(suggestion.confidence)}
                                            </span>
                                            <button
                                                onClick={() => handleCreateFK(suggestion)}
                                                className="text-green-600 hover:text-green-700 p-0.5"
                                                title="Create Foreign Key"
                                            >
                                                <Check className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {fkSuggestions.length > 5 && (
                                <div className="text-[10px] text-muted-foreground text-center">
                                    ... and {fkSuggestions.length - 5} more
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Index Suggestions */}
            {indexSuggestions.length > 0 && (
                <div>
                    <button
                        onClick={() => toggleSection('indexes')}
                        className="flex items-center justify-between w-full text-left hover:bg-muted p-1 rounded transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Hash className="w-3 h-3 text-purple-500" />
                            <span className="text-xs font-medium">
                                Indexes ({indexSuggestions.length})
                            </span>
                        </div>
                        {expandedSections.indexes ? (
                            <ChevronUp className="w-3 h-3" />
                        ) : (
                            <ChevronDown className="w-3 h-3" />
                        )}
                    </button>

                    {expandedSections.indexes && (
                        <div className="mt-2 space-y-2">
                            {indexSuggestions.slice(0, 5).map((suggestion, index) => (
                                <div key={index} className="bg-muted/50 rounded p-2 text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1">
                                            <Target className="w-3 h-3 text-purple-500" />
                                            <span className="font-medium">
                                                {getTableName(suggestion.tableId)}.{suggestion.columnName}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleCreateIndex(suggestion)}
                                            className="text-green-600 hover:text-green-700 p-0.5"
                                            title="Create Index"
                                        >
                                            <Check className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="text-[9px] text-muted-foreground">
                                        {suggestion.reason}
                                    </div>
                                </div>
                            ))}
                            {indexSuggestions.length > 5 && (
                                <div className="text-[10px] text-muted-foreground text-center">
                                    ... and {indexSuggestions.length - 5} more
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Quick Actions */}
            <div className="mt-3 pt-2 border-t border-border/50">
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            fkSuggestions.slice(0, 3).forEach(handleCreateFK);
                        }}
                        className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                        disabled={fkSuggestions.length === 0}
                    >
                        Apply Top FKs
                    </button>
                    <button
                        onClick={() => {
                            indexSuggestions.slice(0, 3).forEach(handleCreateIndex);
                        }}
                        className="flex-1 text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded transition-colors"
                        disabled={indexSuggestions.length === 0}
                    >
                        Apply Top Indexes
                    </button>
                </div>
            </div>
        </div>
    );
});

SuggestionsPanel.displayName = 'SuggestionsPanel';

export default SuggestionsPanel;
