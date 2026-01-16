import { Node, Edge } from 'reactflow';
import { Column, TableIndex } from '@/components/editor/nodes/table-node';

export interface SQLOptions {
    includeComments?: boolean;
    includeIfNotExists?: boolean;
    includeForeignKeys?: boolean;
    includeIndexes?: boolean;
    dropTables?: boolean;
    selectedOnly?: boolean;
    selectedNodes?: string[];
}

export interface SQLGenerationResult {
    sql: string;
    warnings: string[];
    errors: string[];
}

export class SQLGenerator {
    private nodes: Node[];
    private edges: Edge[];
    private options: SQLOptions;

    constructor(nodes: Node[], edges: Edge[], options: SQLOptions = {}) {
        this.nodes = nodes;
        this.edges = edges;
        this.options = {
            includeComments: true,
            includeIfNotExists: true,
            includeForeignKeys: true,
            includeIndexes: true,
            dropTables: false,
            selectedOnly: false,
            selectedNodes: [],
            ...options
        };
    }

    generate(): SQLGenerationResult {
        const warnings: string[] = [];
        const errors: string[] = [];
        let sql = '';

        try {
            // Filter nodes based on selection
            const relevantNodes = this.getRelevantNodes();
            
            if (relevantNodes.length === 0) {
                warnings.push('No tables to export');
                return { sql: '', warnings, errors };
            }

            // Add header comment
            if (this.options.includeComments) {
                sql += this.generateHeader();
            }

            // Add DROP statements if requested
            if (this.options.dropTables) {
                sql += this.generateDropStatements(relevantNodes);
            }

            // Generate CREATE TABLE statements
            sql += this.generateCreateTableStatements(relevantNodes, warnings);

            // Generate foreign key constraints
            if (this.options.includeForeignKeys) {
                sql += this.generateForeignKeyConstraints(relevantNodes, warnings);
            }

            // Generate indexes
            if (this.options.includeIndexes) {
                sql += this.generateIndexes(relevantNodes, warnings);
            }

            return { sql, warnings, errors };
        } catch (error) {
            errors.push(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { sql: '', warnings, errors };
        }
    }

    private getRelevantNodes(): Node[] {
        if (this.options.selectedOnly && this.options.selectedNodes) {
            return this.nodes.filter(node => 
                node.type === 'table' && this.options.selectedNodes!.includes(node.id)
            );
        }
        return this.nodes.filter(node => node.type === 'table');
    }

    private generateHeader(): string {
        const timestamp = new Date().toISOString();
        const tableCount = this.getRelevantNodes().length;
        
        return `-- Generated SQL Schema
-- Generated on: ${timestamp}
-- Tables: ${tableCount}
-- ERD SchemaFlow SQL Generator

`;
    }

    private generateDropStatements(nodes: Node[]): string {
        let sql = '-- Drop existing tables\n\n';
        
        // Drop in reverse order to handle foreign key dependencies
        const sortedNodes = [...nodes].reverse();
        
        for (const node of sortedNodes) {
            const tableName = node.data.label;
            sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
        }
        
        return sql + '\n';
    }

    private generateCreateTableStatements(nodes: Node[], warnings: string[]): string {
        let sql = '-- Create tables\n\n';
        
        for (const node of nodes) {
            const tableName = node.data.label;
            const columns = node.data.columns || [];
            const engine = node.data.engine || 'InnoDB';
            const collation = node.data.collation;
            const comment = node.data.comment;

            // Validate table name
            if (!this.isValidIdentifier(tableName)) {
                warnings.push(`Invalid table name: ${tableName}`);
                continue;
            }

            sql += `CREATE TABLE`;
            if (this.options.includeIfNotExists) {
                sql += ` IF NOT EXISTS`;
            }
            sql += ` \`${tableName}\` (\n`;

            // Generate columns
            const columnDefinitions = columns.map((column: Column) => 
                this.generateColumnDefinition(column, warnings)
            ).filter(Boolean);

            if (columnDefinitions.length === 0) {
                warnings.push(`Table ${tableName} has no valid columns`);
                continue;
            }

            sql += columnDefinitions.join(',\n');

            // Add primary key if exists
            const primaryKeys = columns.filter((col: Column) => col.isPrimaryKey);
            if (primaryKeys.length > 0) {
                const pkColumns = primaryKeys.map((col: Column) => `\`${col.name}\``).join(', ');
                sql += `,\n  PRIMARY KEY (${pkColumns})`;
            }

            sql += '\n)';

            // Add engine specification
            sql += ` ENGINE=${engine}`;

            // Add collation if specified
            if (collation) {
                sql += ` COLLATE=${collation}`;
            }

            // Add table comment if specified
            if (comment && this.options.includeComments) {
                sql += ` COMMENT='${this.escapeString(comment)}'`;
            }

            sql += ';\n\n';
        }

        return sql;
    }

    private generateColumnDefinition(column: Column, warnings: string[]): string {
        const { name, type, isNullable, isUnique, defaultValue, autoIncrement, comment } = column;

        // Validate column name
        if (!this.isValidIdentifier(name)) {
            warnings.push(`Invalid column name: ${name}`);
            return '';
        }

        let definition = `  \`${name}\` ${type}`;

        // Add NOT NULL or NULL
        if (!isNullable) {
            definition += ' NOT NULL';
        }

        // Add default value
        if (defaultValue !== undefined) {
            if (defaultValue.toUpperCase() === 'NULL') {
                definition += ' DEFAULT NULL';
            } else if (defaultValue.toUpperCase() === 'CURRENT_TIMESTAMP') {
                definition += ' DEFAULT CURRENT_TIMESTAMP';
            } else {
                definition += ` DEFAULT '${this.escapeString(defaultValue)}'`;
            }
        }

        // Add auto increment
        if (autoIncrement && isNullable === false) {
            definition += ' AUTO_INCREMENT';
        }

        // Add unique constraint (but not for primary keys)
        if (isUnique && !column.isPrimaryKey) {
            definition += ' UNIQUE';
        }

        // Add column comment
        if (comment && this.options.includeComments) {
            definition += ` COMMENT '${this.escapeString(comment)}'`;
        }

        return definition;
    }

    private generateForeignKeyConstraints(nodes: Node[], warnings: string[]): string {
        let sql = '-- Foreign key constraints\n\n';
        let hasConstraints = false;

        for (const edge of this.edges) {
            const sourceNode = nodes.find(node => node.id === edge.source);
            const targetNode = nodes.find(node => node.id === edge.target);

            if (!sourceNode || !targetNode) continue;

            const sourceColumn = sourceNode.data.columns?.find((col: Column) => col.id === edge.sourceHandle);
            const targetColumn = targetNode.data.columns?.find((col: Column) => col.id === edge.targetHandle);

            if (!sourceColumn || !targetColumn) {
                warnings.push(`Invalid foreign key relationship between ${sourceNode.data.label} and ${targetNode.data.label}`);
                continue;
            }

            const constraintName = `fk_${sourceNode.data.label}_${sourceColumn.name}_to_${targetNode.data.label}_${targetColumn.name}`;
            
            sql += `ALTER TABLE \`${sourceNode.data.label}\`\n`;
            sql += `  ADD CONSTRAINT \`${constraintName}\`\n`;
            sql += `  FOREIGN KEY (\`${sourceColumn.name}\`) REFERENCES \`${targetNode.data.label}\`(\`${targetColumn.name}\`)`;
            
            // Add ON DELETE and ON UPDATE actions (default to RESTRICT)
            sql += ' ON DELETE RESTRICT ON UPDATE RESTRICT';
            
            sql += ';\n\n';
            hasConstraints = true;
        }

        return hasConstraints ? sql : '';
    }

    private generateIndexes(nodes: Node[], warnings: string[]): string {
        let sql = '-- Indexes\n\n';
        let hasIndexes = false;

        for (const node of nodes) {
            const tableName = node.data.label;
            const indexes = node.data.indexes || [];

            for (const index of indexes) {
                if (!index.columns || index.columns.length === 0) {
                    warnings.push(`Index ${index.name} on table ${tableName} has no columns`);
                    continue;
                }

                // Get column names
                const columnNames = index.columns
                    .map((colId: string) => {
                        const column = node.data.columns?.find((col: Column) => col.id === colId);
                        return column ? column.name : null;
                    })
                    .filter((name: string | null): name is string => Boolean(name));

                if (columnNames.length === 0) {
                    warnings.push(`Index ${index.name} on table ${tableName} references non-existent columns`);
                    continue;
                }

                sql += `CREATE`;
                
                if (index.type === 'UNIQUE') {
                    sql += ' UNIQUE';
                } else if (index.type === 'FULLTEXT') {
                    sql += ' FULLTEXT';
                } else if (index.type === 'SPATIAL') {
                    sql += ' SPATIAL';
                }
                
                sql += ` INDEX \`${index.name}\` ON \`${tableName}\` (`;
                sql += columnNames.map((name: string) => `\`${name}\``).join(', ');
                sql += ')';

                if (index.comment && this.options.includeComments) {
                    sql += ` COMMENT '${this.escapeString(index.comment)}'`;
                }

                sql += ';\n\n';
                hasIndexes = true;
            }

            // Also generate indexes for indexed columns that don't have explicit indexes
            const indexedColumns = node.data.columns?.filter((col: Column) => col.isIndexed && !col.isPrimaryKey) || [];
            for (const column of indexedColumns) {
                // Check if there's already an explicit index for this column
                const hasExplicitIndex = indexes.some((index: TableIndex) => index.columns.includes(column.id));
                if (!hasExplicitIndex) {
                    sql += `CREATE INDEX \`idx_${tableName}_${column.name}\` ON \`${tableName}\`(\`${column.name}\`);\n\n`;
                    hasIndexes = true;
                }
            }
        }

        return hasIndexes ? sql : '';
    }

    private isValidIdentifier(name: string): boolean {
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
    }

    private escapeString(str: string): string {
        return str.replace(/'/g, "''");
    }
}

export function generateSQL(nodes: Node[], edges: Edge[], options: SQLOptions = {}): SQLGenerationResult {
    const generator = new SQLGenerator(nodes, edges, options);
    return generator.generate();
}
