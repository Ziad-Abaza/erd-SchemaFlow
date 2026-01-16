import { Node, Edge } from 'reactflow';
import { Column, TableNodeData } from '@/components/editor/nodes/table-node';

export type ValidationSeverity = 'error' | 'warning' | 'info';
export type ValidationCategory = 'schema' | 'naming' | 'performance' | 'integrity' | 'normalization';

export interface ValidationIssue {
    id: string;
    type: ValidationSeverity;
    category: ValidationCategory;
    title: string;
    description: string;
    tableId?: string;
    tableName?: string;
    columnId?: string;
    columnName?: string;
    edgeId?: string;
    suggestion?: string;
    autoFixable?: boolean;
    fixAction?: () => void;
}

export interface ValidationResult {
    issues: ValidationIssue[];
    summary: {
        errors: number;
        warnings: number;
        info: number;
    };
    score: number; // 0-100 quality score
}

export interface NormalizationSuggestion {
    type: 'decompose' | 'merge' | 'create_lookup' | 'move_column';
    description: string;
    reason: string;
    impact: 'high' | 'medium' | 'low';
    tables: string[];
    columns?: string[];
}

export class ValidationEngine {
    static validateDiagram(nodes: Node[], edges: Edge[]): ValidationResult {
        const issues: ValidationIssue[] = [];

        // Schema validation
        issues.push(...this.validatePrimaryKeys(nodes));
        issues.push(...this.validateForeignKeys(nodes, edges));
        issues.push(...this.validateDataTypes(nodes));
        
        // Naming validation
        issues.push(...this.validateNaming(nodes));
        
        // Integrity validation
        issues.push(...this.validateCircularDependencies(nodes, edges));
        issues.push(...this.validateOrphanedForeignKeys(nodes, edges));
        
        // Performance validation
        issues.push(...this.validateIndexes(nodes));
        issues.push(...this.validateRedundantColumns(nodes));

        const summary = {
            errors: issues.filter(i => i.type === 'error').length,
            warnings: issues.filter(i => i.type === 'warning').length,
            info: issues.filter(i => i.type === 'info').length
        };

        const score = this.calculateQualityScore(summary);

        return { issues, summary, score };
    }

    private static validatePrimaryKeys(nodes: Node[]): ValidationIssue[] {
        const issues: ValidationIssue[] = [];
        
        nodes.forEach(node => {
            if (node.type !== 'table') return;
            
            const table = node.data as TableNodeData;
            const primaryKeys = table.columns.filter(col => col.isPrimaryKey);
            
            if (primaryKeys.length === 0) {
                issues.push({
                    id: `no_pk_${node.id}`,
                    type: 'error',
                    category: 'schema',
                    title: 'Table missing primary key',
                    description: `Table "${table.label}" has no primary key defined.`,
                    tableId: node.id,
                    tableName: table.label,
                    suggestion: 'Add a primary key column (typically an id or uuid field)',
                    autoFixable: true,
                    fixAction: () => {
                        // This would be implemented in the store
                        console.log(`Auto-fix: Add primary key to ${table.label}`);
                    }
                });
            } else if (primaryKeys.length > 1) {
                issues.push({
                    id: `multiple_pk_${node.id}`,
                    type: 'warning',
                    category: 'schema',
                    title: 'Multiple primary keys',
                    description: `Table "${table.label}" has ${primaryKeys.length} primary keys. Consider using a composite primary key or single surrogate key.`,
                    tableId: node.id,
                    tableName: table.label,
                    suggestion: 'Consider using a single surrogate key (id/uuid) or properly define composite primary key'
                });
            }
        });

        return issues;
    }

    private static validateForeignKeys(nodes: Node[], edges: Edge[]): ValidationIssue[] {
        const issues: ValidationIssue[] = [];
        
        edges.forEach(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            
            if (!sourceNode || !targetNode || sourceNode.type !== 'table' || targetNode.type !== 'table') {
                return;
            }

            const sourceTable = sourceNode.data as TableNodeData;
            const targetTable = targetNode.data as TableNodeData;
            
            const sourceColumn = sourceTable.columns.find(col => col.id === edge.sourceHandle);
            const targetColumn = targetTable.columns.find(col => col.id === edge.targetHandle);

            if (!sourceColumn || !targetColumn) {
                issues.push({
                    id: `invalid_fk_${edge.id}`,
                    type: 'error',
                    category: 'integrity',
                    title: 'Invalid foreign key reference',
                    description: `Foreign key references non-existent columns.`,
                    edgeId: edge.id,
                    suggestion: 'Update the foreign key to reference valid columns or remove the relationship'
                });
                return;
            }

            if (!targetColumn.isPrimaryKey) {
                issues.push({
                    id: `fk_to_non_pk_${edge.id}`,
                    type: 'warning',
                    category: 'integrity',
                    title: 'Foreign key references non-primary key',
                    description: `Foreign key from "${sourceTable.label}.${sourceColumn.name}" references "${targetTable.label}.${targetColumn.name}" which is not a primary key.`,
                    tableId: sourceNode.id,
                    tableName: sourceTable.label,
                    columnId: sourceColumn.id,
                    columnName: sourceColumn.name,
                    edgeId: edge.id,
                    suggestion: 'Foreign keys should typically reference primary keys'
                });
            }

            if (sourceColumn.type !== targetColumn.type) {
                issues.push({
                    id: `type_mismatch_${edge.id}`,
                    type: 'warning',
                    category: 'integrity',
                    title: 'Data type mismatch',
                    description: `Foreign key "${sourceColumn.name}" (${sourceColumn.type}) has different type than referenced column "${targetColumn.name}" (${targetColumn.type}).`,
                    tableId: sourceNode.id,
                    tableName: sourceTable.label,
                    columnId: sourceColumn.id,
                    columnName: sourceColumn.name,
                    edgeId: edge.id,
                    suggestion: 'Ensure foreign key and referenced column have the same data type'
                });
            }
        });

        return issues;
    }

    private static validateNaming(nodes: Node[]): ValidationIssue[] {
        const issues: ValidationIssue[] = [];
        const tableNames = new Map<string, string[]>();
        
        // Check for duplicate table names
        nodes.forEach(node => {
            if (node.type !== 'table') return;
            
            const table = node.data as TableNodeData;
            const normalizedName = table.label.toLowerCase().trim();
            
            if (!tableNames.has(normalizedName)) {
                tableNames.set(normalizedName, []);
            }
            tableNames.get(normalizedName)!.push(node.id);
        });

        tableNames.forEach((tableIds, name) => {
            if (tableIds.length > 1) {
                tableIds.forEach(tableId => {
                    const node = nodes.find(n => n.id === tableId);
                    const table = node?.data as TableNodeData;
                    
                    issues.push({
                        id: `duplicate_table_${tableId}`,
                        type: 'error',
                        category: 'naming',
                        title: 'Duplicate table name',
                        description: `Table name "${table?.label}" is duplicated.`,
                        tableId,
                        tableName: table?.label,
                        suggestion: 'Rename tables to have unique names'
                    });
                });
            }
        });

        // Check column naming within each table
        nodes.forEach(node => {
            if (node.type !== 'table') return;
            
            const table = node.data as TableNodeData;
            const columnNames = new Map<string, string[]>();
            
            table.columns.forEach(column => {
                const normalizedName = column.name.toLowerCase().trim();
                
                if (!columnNames.has(normalizedName)) {
                    columnNames.set(normalizedName, []);
                }
                columnNames.get(normalizedName)!.push(column.id);
            });

            columnNames.forEach((columnIds, name) => {
                if (columnIds.length > 1) {
                    columnIds.forEach(columnId => {
                        const column = table.columns.find(c => c.id === columnId);
                        
                        issues.push({
                            id: `duplicate_column_${node.id}_${columnId}`,
                            type: 'error',
                            category: 'naming',
                            title: 'Duplicate column name',
                            description: `Column name "${column?.name}" is duplicated in table "${table.label}".`,
                            tableId: node.id,
                            tableName: table.label,
                            columnId,
                            columnName: column?.name,
                            suggestion: 'Rename columns to have unique names within the table'
                        });
                    });
                }
            });

            // Check naming conventions
            table.columns.forEach(column => {
                if (!/^[a-z][a-z0-9_]*$/.test(column.name)) {
                    issues.push({
                        id: `naming_convention_${node.id}_${column.id}`,
                        type: 'warning',
                        category: 'naming',
                        title: 'Naming convention violation',
                        description: `Column "${column.name}" should use lowercase with underscores.`,
                        tableId: node.id,
                        tableName: table.label,
                        columnId: column.id,
                        columnName: column.name,
                        suggestion: 'Use lowercase letters, numbers, and underscores only. Start with a letter.'
                    });
                }
            });
        });

        return issues;
    }

    private static validateCircularDependencies(nodes: Node[], edges: Edge[]): ValidationIssue[] {
        const issues: ValidationIssue[] = [];
        
        // Build adjacency list
        const graph = new Map<string, string[]>();
        
        nodes.forEach(node => {
            if (node.type !== 'table') return;
            graph.set(node.id, []);
        });
        
        edges.forEach(edge => {
            if (graph.has(edge.source)) {
                graph.get(edge.source)!.push(edge.target);
            }
        });

        // Detect cycles using DFS
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        
        const detectCycle = (nodeId: string, path: string[] = []): boolean => {
            if (recursionStack.has(nodeId)) {
                // Found a cycle
                const cycleStart = path.indexOf(nodeId);
                const cycleNodes = path.slice(cycleStart);
                const nodeNames = cycleNodes.map(id => {
                    const node = nodes.find(n => n.id === id);
                    return node ? (node.data as TableNodeData).label : id;
                });
                
                issues.push({
                    id: `circular_dependency_${nodeId}`,
                    type: 'error',
                    category: 'integrity',
                    title: 'Circular dependency detected',
                    description: `Circular reference: ${nodeNames.join(' → ')} → ${nodeNames[0]}`,
                    tableId: nodeId,
                    suggestion: 'Break the circular dependency by redesigning the schema or removing one relationship'
                });
                
                return true;
            }
            
            if (visited.has(nodeId)) return false;
            
            visited.add(nodeId);
            recursionStack.add(nodeId);
            
            const neighbors = graph.get(nodeId) || [];
            for (const neighbor of neighbors) {
                if (detectCycle(neighbor, [...path, nodeId])) {
                    return true;
                }
            }
            
            recursionStack.delete(nodeId);
            return false;
        };
        
        graph.forEach((_, nodeId) => {
            if (!visited.has(nodeId)) {
                detectCycle(nodeId);
            }
        });

        return issues;
    }

    private static validateOrphanedForeignKeys(nodes: Node[], edges: Edge[]): ValidationIssue[] {
        const issues: ValidationIssue[] = [];
        
        nodes.forEach(node => {
            if (node.type !== 'table') return;
            
            const table = node.data as TableNodeData;
            const hasFKEdges = edges.some(edge => edge.source === node.id);
            
            const foreignKeyColumns = table.columns.filter(col => col.isForeignKey);
            
            foreignKeyColumns.forEach(column => {
                const hasEdge = edges.some(edge => 
                    edge.source === node.id && edge.sourceHandle === column.id
                );
                
                if (!hasEdge) {
                    issues.push({
                        id: `orphaned_fk_${node.id}_${column.id}`,
                        type: 'warning',
                        category: 'integrity',
                        title: 'Orphaned foreign key',
                        description: `Column "${column.name}" is marked as foreign key but has no relationship defined.`,
                        tableId: node.id,
                        tableName: table.label,
                        columnId: column.id,
                        columnName: column.name,
                        suggestion: 'Create a relationship or remove the foreign key flag'
                    });
                }
            });
        });

        return issues;
    }

    private static validateDataTypes(nodes: Node[]): ValidationIssue[] {
        const issues: ValidationIssue[] = [];
        
        nodes.forEach(node => {
            if (node.type !== 'table') return;
            
            const table = node.data as TableNodeData;
            
            table.columns.forEach(column => {
                // Check for inconsistent UUID usage
                if (column.type.toLowerCase().includes('uuid') && column.name.toLowerCase().includes('id')) {
                    if (!column.isPrimaryKey && !column.isForeignKey) {
                        issues.push({
                            id: `uuid_id_usage_${node.id}_${column.id}`,
                            type: 'info',
                            category: 'schema',
                            title: 'UUID column with ID naming',
                            description: `Column "${column.name}" uses UUID type but is not a key.`,
                            tableId: node.id,
                            tableName: table.label,
                            columnId: column.id,
                            columnName: column.name,
                            suggestion: 'Consider if this should be a key or rename the column'
                        });
                    }
                }
                
                // Check for TEXT columns that might benefit from VARCHAR
                if (column.type.toLowerCase() === 'text' && column.name.toLowerCase().includes('email')) {
                    issues.push({
                        id: `text_email_${node.id}_${column.id}`,
                        type: 'info',
                        category: 'performance',
                        title: 'TEXT type for email',
                        description: `Column "${column.name}" uses TEXT type for email data.`,
                        tableId: node.id,
                        tableName: table.label,
                        columnId: column.id,
                        columnName: column.name,
                        suggestion: 'Consider using VARCHAR(255) for email addresses'
                    });
                }
            });
        });

        return issues;
    }

    private static validateIndexes(nodes: Node[]): ValidationIssue[] {
        const issues: ValidationIssue[] = [];
        
        nodes.forEach(node => {
            if (node.type !== 'table') return;
            
            const table = node.data as TableNodeData;
            
            table.columns.forEach(column => {
                // Foreign keys should be indexed
                if (column.isForeignKey && !column.isIndexed) {
                    issues.push({
                        id: `unindexed_fk_${node.id}_${column.id}`,
                        type: 'warning',
                        category: 'performance',
                        title: 'Unindexed foreign key',
                        description: `Foreign key column "${column.name}" should be indexed for better join performance.`,
                        tableId: node.id,
                        tableName: table.label,
                        columnId: column.id,
                        columnName: column.name,
                        suggestion: 'Add an index to this foreign key column',
                        autoFixable: true
                    });
                }
                
                // Unique columns should be indexed
                if (column.isUnique && !column.isIndexed && !column.isPrimaryKey) {
                    issues.push({
                        id: `unindexed_unique_${node.id}_${column.id}`,
                        type: 'info',
                        category: 'performance',
                        title: 'Unindexed unique column',
                        description: `Unique column "${column.name}" could benefit from an index.`,
                        tableId: node.id,
                        tableName: table.label,
                        columnId: column.id,
                        columnName: column.name,
                        suggestion: 'Consider adding an index to this unique column'
                    });
                }
            });
        });

        return issues;
    }

    private static validateRedundantColumns(nodes: Node[]): ValidationIssue[] {
        const issues: ValidationIssue[] = [];
        const allColumns = new Map<string, { tableId: string; tableName: string; column: Column }[]>();
        
        // Group columns by name (case-insensitive)
        nodes.forEach(node => {
            if (node.type !== 'table') return;
            
            const table = node.data as TableNodeData;
            
            table.columns.forEach(column => {
                const normalizedName = column.name.toLowerCase();
                
                if (!allColumns.has(normalizedName)) {
                    allColumns.set(normalizedName, []);
                }
                allColumns.get(normalizedName)!.push({
                    tableId: node.id,
                    tableName: table.label,
                    column
                });
            });
        });

        // Check for potential redundancy
        allColumns.forEach((columns, columnName) => {
            if (columns.length > 1) {
                // Check if columns have same type and similar purpose
                const sameType = columns.every(c => c.column.type === columns[0].column.type);
                
                if (sameType && !columnName.includes('id')) {
                    issues.push({
                        id: `redundant_columns_${columnName}`,
                        type: 'info',
                        category: 'normalization',
                        title: 'Potentially redundant columns',
                        description: `Column "${columnName}" appears in multiple tables with same type.`,
                        suggestion: 'Consider if these columns represent the same data and could be normalized',
                        autoFixable: false
                    });
                }
            }
        });

        return issues;
    }

    private static calculateQualityScore(summary: { errors: number; warnings: number; info: number }): number {
        // Base score of 100, subtract points for issues
        let score = 100;
        score -= summary.errors * 20;    // Errors: -20 points each
        score -= summary.warnings * 5;   // Warnings: -5 points each  
        score -= summary.info * 1;       // Info: -1 point each
        return Math.max(0, score);
    }

    static generateNormalizationSuggestions(nodes: Node[], edges: Edge[]): NormalizationSuggestion[] {
        const suggestions: NormalizationSuggestion[] = [];
        
        // Check for tables that might need decomposition
        nodes.forEach(node => {
            if (node.type !== 'table') return;
            
            const table = node.data as TableNodeData;
            
            // Large tables might benefit from decomposition
            if (table.columns.length > 15) {
                suggestions.push({
                    type: 'decompose',
                    description: `Consider decomposing table "${table.label}"`,
                    reason: `Table has ${table.columns.length} columns, which might indicate multiple entities`,
                    impact: 'medium',
                    tables: [node.id]
                });
            }
            
            // Check for repeating patterns
            const columnNames = table.columns.map(c => c.name.toLowerCase());
            const numberPattern = columnNames.filter(name => /\d+$/.test(name));
            
            if (numberPattern.length > 2) {
                suggestions.push({
                    type: 'decompose',
                    description: `Consider creating separate table for repeated data in "${table.label}"`,
                    reason: `Detected pattern of numbered columns: ${numberPattern.slice(0, 3).join(', ')}...`,
                    impact: 'high',
                    tables: [node.id],
                    columns: numberPattern
                });
            }
        });

        return suggestions;
    }
}
