import { parse } from "sql-parser-cst";
import { TableNodeData, Column, TableIndex } from "@/components/editor/nodes/table-node";

function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

export interface SQLParseResult {
    tables: TableNodeData[];
    foreignKeyConstraints: Array<{
        tableName: string;
        columnName: string;
        referencedTable: string;
        referencedColumn: string;
        onDelete?: string;
        onUpdate?: string;
    }>;
    errors: string[];
    warnings: string[];
}

export function parseSqlToTables(sql: string): TableNodeData[] {
    const result = parseSQLFile(sql);
    return result.tables;
}

function extractForeignKeysFromAlterTable(sql: string): Array<{
    tableName: string;
    columnName: string;
    referencedTable: string;
    referencedColumn: string;
    onDelete?: string;
    onUpdate?: string;
}> {
    const foreignKeys: Array<{
        tableName: string;
        columnName: string;
        referencedTable: string;
        referencedColumn: string;
        onDelete?: string;
        onUpdate?: string;
    }> = [];

    // Find all ALTER TABLE statements with FOREIGN KEY constraints
    const alterTableRegex = /ALTER\s+TABLE\s+`([^`]+)`\s+ADD\s+CONSTRAINT[^;]*FOREIGN\s+KEY[^;]*;/gi;
    let match;

    while ((match = alterTableRegex.exec(sql)) !== null) {
        const alterStatement = match[0];
        const tableName = match[1];

        // Extract individual foreign key constraints from the ALTER statement
        const fkRegex = /ADD\s+CONSTRAINT\s+`[^`]*`\s+FOREIGN\s+KEY\s*\(`([^`]+)`\)\s+REFERENCES\s+`([^`]+)`\s*\(`([^`]+)`\)(?:\s+ON\s+(DELETE|UPDATE)\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION))?[^,]*/gi;
        let fkMatch;

        while ((fkMatch = fkRegex.exec(alterStatement)) !== null) {
            const columnName = fkMatch[1];
            const referencedTable = fkMatch[2];
            const referencedColumn = fkMatch[3];
            const actionType = fkMatch[4];
            const actionValue = fkMatch[5];

            foreignKeys.push({
                tableName,
                columnName,
                referencedTable,
                referencedColumn,
                ...(actionType && actionValue && { 
                    [actionType.toLowerCase() === 'delete' ? 'onDelete' : 'onUpdate']: actionValue.replace(/\s+/g, ' ')
                })
            });
        }
    }

    return foreignKeys;
}

function preprocessSQL(sql: string): string {
    // Remove phpMyAdmin and MySQL-specific directives
    let processed = sql;
    
    // Remove MySQL directives and comments
    processed = processed.replace(/SET\s+SQL_MODE\s*=\s*"[^"]*";?/gi, '');
    processed = processed.replace(/START\s+TRANSACTION;?/gi, '');
    processed = processed.replace(/SET\s+time_zone\s*=\s*"[^"]*";?/gi, '');
    processed = processed.replace(/\/\*\!\d+\s+SET\s+@OLD_[^=]+\s*=\s*@@[^;]+;\s*\*\//gi, '');
    processed = processed.replace(/\/\*\!\d+\s+SET\s+NAMES[^;]+;\s*\*\//gi, '');
    processed = processed.replace(/COMMIT;?/gi, '');
    processed = processed.replace(/ROLLBACK;?/gi, '');
    
    // Remove phpMyAdmin comments
    processed = processed.replace(/^--\s+phpMyAdmin.*$/gm, '');
    processed = processed.replace(/^--\s+https:\/\/www\.phpmyadmin\.net\/.*$/gm, '');
    processed = processed.replace(/^--\s+version\s+[\d.]+.*$/gm, '');
    processed = processed.replace(/^--\s+Host:.*$/gm, '');
    processed = processed.replace(/^--\s+Generation Time:.*$/gm, '');
    processed = processed.replace(/^--\s+Server version:.*$/gm, '');
    processed = processed.replace(/^--\s+PHP Version:.*$/gm, '');
    processed = processed.replace(/^--\s+Database:.*$/gm, '');
    processed = processed.replace(/^--\s+Table structure for table.*$/gm, '');
    processed = processed.replace(/^--\s+Dumping data for table.*$/gm, '');
    processed = processed.replace(/^--\s+--------------------------------------------------------.*$/gm, '');
    processed = processed.replace(/^--\s+$/gm, '');
    
    // Remove ALTER TABLE statements (foreign key constraints will be handled separately)
    processed = processed.replace(/ALTER\s+TABLE[^;]*;/gi, '');
    processed = processed.replace(/--\s+Constraints for table.*$/gm, '');
    processed = processed.replace(/ADD\s+CONSTRAINT[^;]*;/gi, '');
    
    // Remove INSERT statements (we only want CREATE TABLE)
    processed = processed.replace(/^INSERT\s+INTO.*$/gm, '');
    processed = processed.replace(/^LOCK\s+TABLES.*$/gm, '');
    processed = processed.replace(/^UNLOCK\s+TABLES.*$/gm, '');
    
    // Remove MySQL-specific table options and complex column attributes
    processed = processed.replace(/\)\s*ENGINE=\w+\s*(?:DEFAULT\s+CHARSET=\w+)?\s*(?:COLLATE=\w+)?\s*;/gi, ');');
    
    // Remove CHARACTER SET and COLLATE clauses in column definitions
    processed = processed.replace(/CHARACTER\s+SET\s+\w+\s*COLLATE\s+\w+/gi, '');
    processed = processed.replace(/CHARACTER\s+SET\s+\w+/gi, '');
    processed = processed.replace(/COLLATE\s+\w+/gi, '');
    
    // Remove CHECK constraints with json_valid
    processed = processed.replace(/CHECK\s*\(\s*json_valid\s*\([^)]+\)\s*\)/gi, '');
    
    // Remove COMMENT clauses in column definitions
    processed = processed.replace(/COMMENT\s+'[^']*'/gi, '');
    processed = processed.replace(/COMMENT\s+"[^"]*"/gi, '');
    
    // Convert current_timestamp() to CURRENT_TIMESTAMP
    processed = processed.replace(/current_timestamp\(\)/gi, 'CURRENT_TIMESTAMP');
    
    // Convert backtick-quoted identifiers to unquoted identifiers (more compatible)
    processed = processed.replace(/`([^`]+)`/g, '$1');
    
    // Convert quoted identifiers to unquoted for better compatibility
    processed = processed.replace(/"([^"]+)"/g, '$1');
    
    // Convert MySQL data types to standard types
    processed = processed.replace(/\bchar\(\d+\)/gi, 'VARCHAR');
    processed = processed.replace(/\bvarchar\(\d+\)/gi, 'VARCHAR');
    processed = processed.replace(/\btext\b/gi, 'TEXT');
    processed = processed.replace(/\blongtext\b/gi, 'TEXT');
    processed = processed.replace(/\bmediumtext\b/gi, 'TEXT');
    processed = processed.replace(/\btinytext\b/gi, 'TEXT');
    processed = processed.replace(/\btinyint\(\d+\)/gi, 'INTEGER');
    processed = processed.replace(/\bint\(\d+\)/gi, 'INTEGER');
    processed = processed.replace(/\bbigint\(\d+\)/gi, 'INTEGER');
    processed = processed.replace(/\bdecimal\(\d+,\d+\)/gi, 'DECIMAL');
    processed = processed.replace(/\bfloat\(\d+,\d+\)/gi, 'FLOAT');
    processed = processed.replace(/\bdouble\(\d+,\d+\)/gi, 'DOUBLE');
    processed = processed.replace(/\bdatetime\b/gi, 'TIMESTAMP');
    processed = processed.replace(/\bdate\b/gi, 'DATE');
    processed = processed.replace(/\btime\b/gi, 'TIME');
    processed = processed.replace(/\btinyint\(1\)\b/gi, 'BOOLEAN');
    processed = processed.replace(/\benum\([^)]+\)/gi, 'VARCHAR');
    
    // Add line breaks between CREATE TABLE statements for better parsing
    processed = processed.replace(/\);\s*CREATE\s+TABLE/gi, ');\n\nCREATE TABLE');
    
    // Clean up extra whitespace and empty lines
    processed = processed.replace(/\n\s*\n\s*\n/g, '\n\n');
    processed = processed.replace(/\s+/g, ' ');
    processed = processed.trim();
    
    return processed;
}

export function parseSQLFile(sql: string): SQLParseResult {
    const result: SQLParseResult = {
        tables: [],
        foreignKeyConstraints: [],
        errors: [],
        warnings: []
    };

    // Extract foreign keys from ALTER TABLE statements first
    const alterTableForeignKeys = extractForeignKeysFromAlterTable(sql);
    result.foreignKeyConstraints.push(...alterTableForeignKeys);

    // Preprocess the SQL to handle various file formats
    const processedSQL = preprocessSQL(sql);
    
    // Try different SQL dialects
    let cst;
    const dialects = ['postgresql', 'mysql', 'sqlite'] as const;
    
    for (const dialect of dialects) {
        try {
            cst = parse(processedSQL, { dialect });
            break;
        } catch (e) {
            if (dialect === dialects[dialects.length - 1]) {
                // Last dialect failed, record the error and try to provide helpful feedback
                const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                result.errors.push(`SQL Parse Error: ${errorMessage}`);
                
                // Add helpful suggestions based on common errors
                if (errorMessage.includes('ENGINE')) {
                    result.errors.push('Tip: Remove MySQL-specific ENGINE= clauses for better compatibility');
                } else if (errorMessage.includes('UUID') || errorMessage.includes('gen_random_uuid')) {
                    result.errors.push('Tip: Replace UUID types and gen_random_uuid() with standard types');
                } else if (errorMessage.includes('ENUM')) {
                    result.errors.push('Tip: Replace ENUM types with VARCHAR for better compatibility');
                } else if (errorMessage.includes('INDEX')) {
                    result.errors.push('Tip: Remove INDEX definitions inside CREATE TABLE statements');
                } else if (errorMessage.includes('`')) {
                    result.errors.push('Tip: Remove backtick-quoted identifiers or convert to standard quotes');
                } else {
                    result.errors.push('Tip: Ensure your SQL file contains valid CREATE TABLE statements');
                    result.errors.push('Tip: Try removing MySQL-specific directives and comments');
                }
                
                return result;
            }
        }
    }

    // Traverse basic CST structure
    const root = cst as any;

    if (root.type === "program" && Array.isArray(root.statements)) {
        for (const stmt of root.statements) {
            if (stmt.type === "create_table_stmt") {
                try {
                    const tableResult = parseCreateTableStatement(stmt);
                    if (tableResult.table) {
                        // Add foreign keys from inline definitions
                        result.foreignKeyConstraints.push(...tableResult.foreignKeys);
                        result.tables.push(tableResult.table);
                        result.warnings.push(...tableResult.warnings);
                    }
                } catch (e) {
                    result.errors.push(`Error parsing table: ${e instanceof Error ? e.message : 'Unknown error'}`);
                }
            }
        }
    }

    // Apply foreign keys from ALTER TABLE statements to the parsed tables
    for (const fk of alterTableForeignKeys) {
        const table = result.tables.find(t => t.label === fk.tableName);
        if (table) {
            const column = table.columns.find(c => c.name === fk.columnName);
            if (column) {
                column.isForeignKey = true;
            } else {
                result.warnings.push(`Foreign key column "${fk.columnName}" not found in table "${fk.tableName}"`);
            }
        } else {
            result.warnings.push(`Table "${fk.tableName}" referenced in foreign key not found in CREATE TABLE statements`);
        }
    }

    return result;
}

function detectImplicitPrimaryKey(tableName: string, columns: Column[]): Column | null {
    // If no explicit primary key found, try to detect implicit primary key based on naming conventions
    if (columns.length === 0) return null;

    // Check for junction table patterns (tables that typically have composite primary keys)
    const junctionTablePatterns = [
        /.*ables$/,  // ends with "ables" (like branchables)
        /.*ings$/,   // ends with "ings" (like class_students, course_enrollments)
        /.*_has_/,  // contains "_has_" (like user_has_roles)
        /.*_to_/,   // contains "_to_" (like user_to_role)
    ];
    
    const isJunctionTable = junctionTablePatterns.some(pattern => pattern.test(tableName.toLowerCase()));
    
    if (isJunctionTable && columns.length >= 2) {
        // For junction tables, look for foreign key columns that could form a composite key
        const fkColumns = columns.filter(col => col.isForeignKey);
        if (fkColumns.length >= 2) {
            // Use the first foreign key as the primary key for display purposes
            // In a real database, this would be a composite key, but we need to pick one for visualization
            return fkColumns[0];
        }
    }

    // Common primary key naming patterns
    const pkPatterns = [
        `${tableName}_id`,  // table_name_id
        `${tableName.slice(0, -1)}_id`,  // table_name_id (for plural table names)
        'id',  // generic id
        'uuid',  // generic uuid
        'guid',  // generic guid
    ];

    // First, try exact matches
    for (const pattern of pkPatterns) {
        const candidate = columns.find(col => 
            col.name.toLowerCase() === pattern.toLowerCase()
        );
        if (candidate) {
            return candidate;
        }
    }

    // Try partial matches (for cases like user_id in users table)
    for (const pattern of pkPatterns) {
        const candidate = columns.find(col => 
            col.name.toLowerCase().includes(pattern.toLowerCase())
        );
        if (candidate) {
            return candidate;
        }
    }

    // If still no match, pick the first column that's NOT a foreign key
    const nonFkColumn = columns.find(col => !col.isForeignKey);
    if (nonFkColumn) {
        return nonFkColumn;
    }

    // Last resort: return the first column
    return columns[0];
}

function parseCreateTableStatement(stmt: any): {
    table?: TableNodeData;
    foreignKeys: Array<{
        tableName: string;
        columnName: string;
        referencedTable: string;
        referencedColumn: string;
        onDelete?: string;
        onUpdate?: string;
    }>;
    warnings: string[];
} {
    const tableName = stmt.name?.name;
    if (!tableName) {
        throw new Error('Table name not found');
    }

    const columns: Column[] = [];
    const foreignKeys: Array<{
        tableName: string;
        columnName: string;
        referencedTable: string;
        referencedColumn: string;
        onDelete?: string;
        onUpdate?: string;
    }> = [];
    const warnings: string[] = [];
    const indexes: TableIndex[] = [];

    // Parse column definitions
    if (stmt.columns && stmt.columns.expr && stmt.columns.expr.items) {
        for (const item of stmt.columns.expr.items) {
            if (item.type === "column_definition") {
                const columnResult = parseColumnDefinition(item);
                if (columnResult.column) {
                    columns.push(columnResult.column);
                    warnings.push(...columnResult.warnings);
                }
                
                if (columnResult.foreignKey) {
                    foreignKeys.push({
                        tableName,
                        ...columnResult.foreignKey
                    });
                }
            }
        }
    }

    // Parse out-of-line constraints (FOREIGN KEY, PRIMARY KEY, UNIQUE, etc.)
    let hasExplicitPrimaryKey = false;
    if (stmt.constraints && stmt.constraints.expr && stmt.constraints.expr.items) {
        for (const constraint of stmt.constraints.expr.items) {
            if (constraint.type === "table_constraint") {
                const constraintResult = parseTableConstraint(constraint, tableName);
                foreignKeys.push(...constraintResult.foreignKeys);
                warnings.push(...constraintResult.warnings);
                
                // Handle multi-column primary keys
                if (constraintResult.primaryKeyColumns && constraintResult.primaryKeyColumns.length > 0) {
                    hasExplicitPrimaryKey = true;
                    constraintResult.primaryKeyColumns.forEach(colName => {
                        const column = columns.find(c => c.name === colName);
                        if (column) {
                            column.isPrimaryKey = true;
                            column.isNullable = false;
                        } else {
                            warnings.push(`Primary key column "${colName}" not found in table "${tableName}"`);
                        }
                    });
                }
                
                // Handle unique constraints
                if (constraintResult.uniqueColumns && constraintResult.uniqueColumns.length > 0) {
                    constraintResult.uniqueColumns.forEach(colName => {
                        const column = columns.find(c => c.name === colName);
                        if (column) {
                            column.isUnique = true;
                        }
                    });
                    
                    // Create index for unique constraint
                    if (constraintResult.constraintName) {
                        indexes.push({
                            id: generateId(),
                            name: constraintResult.constraintName,
                            columns: constraintResult.uniqueColumns.map(colName => {
                                const column = columns.find(c => c.name === colName);
                                return column?.id || '';
                            }).filter(Boolean),
                            type: 'UNIQUE'
                        });
                    }
                }
            }
        }
    }

    // If no explicit primary key found, try to detect implicit primary key
    if (!hasExplicitPrimaryKey && columns.length > 0) {
        const implicitPk = detectImplicitPrimaryKey(tableName, columns);
        if (implicitPk) {
            implicitPk.isPrimaryKey = true;
            implicitPk.isNullable = false;
            // This is informational, not a warning - the detection worked correctly
            // warnings.push(`Detected implicit primary key: "${implicitPk.name}" in table "${tableName}"`);
        } else {
            warnings.push(`Table "${tableName}" has no detectable primary key`);
        }
    }

    // Extract table-level properties
    let engine: 'InnoDB' | 'MyISAM' | 'MEMORY' | 'ARCHIVE' | 'CSV' = 'InnoDB';
    let collation: string | undefined;
    let comment: string | undefined;

    if (stmt.options) {
        for (const option of stmt.options) {
            if (option.type === "table_option") {
                if (option.name?.text?.toUpperCase() === 'ENGINE') {
                    engine = mapEngineType(option.value?.text);
                } else if (option.name?.text?.toUpperCase() === 'COLLATE') {
                    collation = option.value?.text;
                } else if (option.name?.text?.toUpperCase() === 'COMMENT') {
                    comment = option.value?.text?.replace(/['"]/g, '');
                }
            }
        }
    }

    const table: TableNodeData = {
        label: tableName,
        columns,
        engine,
        collation,
        comment,
        indexes: indexes.length > 0 ? indexes : undefined
    };

    return { table, foreignKeys, warnings };
}

function parseColumnDefinition(item: any): {
    column?: Column;
    foreignKey?: {
        columnName: string;
        referencedTable: string;
        referencedColumn: string;
        onDelete?: string;
        onUpdate?: string;
    };
    warnings: string[];
} {
    const warnings: string[] = [];
    
    const colName = item.name?.name;
    if (!colName) {
        warnings.push('Column name not found');
        return { warnings };
    }

    const dataType = getDataTypeString(item.dataType);
    
    let isPrimaryKey = false;
    let isNullable = true;
    let isUnique = false;
    let isForeignKey = false;
    let defaultValue: string | undefined;
    let autoIncrement = false;
    let collation: string | undefined;
    let comment: string | undefined;

    // Parse column constraints
    if (item.constraints) {
        for (const constraint of item.constraints) {
            switch (constraint.type) {
                case "constraint_primary_key":
                    isPrimaryKey = true;
                    isNullable = false;
                    break;
                case "constraint_not_null":
                    isNullable = false;
                    break;
                case "constraint_null":
                    isNullable = true;
                    break;
                case "constraint_unique":
                    isUnique = true;
                    break;
                case "constraint_default":
                    defaultValue = getDefaultValue(constraint.value);
                    break;
                case "constraint_auto_increment":
                case "constraint_identity":
                    autoIncrement = true;
                    break;
                case "constraint_collate":
                    collation = constraint.collation?.name;
                    break;
                case "constraint_comment":
                    comment = constraint.text?.text?.replace(/['"]/g, '');
                    break;
                case "constraint_references":
                    isForeignKey = true;
                    const refTable = constraint.table?.name;
                    const refColumn = constraint.columns?.expr?.items?.[0]?.name;
                    if (refTable && refColumn) {
                        return {
                            column: {
                                id: generateId(),
                                name: colName,
                                type: dataType,
                                isPrimaryKey,
                                isForeignKey,
                                isNullable,
                                isUnique,
                                defaultValue,
                                autoIncrement,
                                collation,
                                comment
                            },
                            foreignKey: {
                                columnName: colName,
                                referencedTable: refTable,
                                referencedColumn: refColumn,
                                onDelete: constraint.on_delete?.text,
                                onUpdate: constraint.on_update?.text
                            },
                            warnings
                        };
                    }
                    break;
            }
        }
    }

    if (isPrimaryKey) isNullable = false;

    return {
        column: {
            id: generateId(),
            name: colName,
            type: dataType,
            isPrimaryKey,
            isForeignKey,
            isNullable,
            isUnique,
            defaultValue,
            autoIncrement,
            collation,
            comment
        },
        warnings
    };
}

function parseTableConstraint(constraint: any, tableName: string): {
    foreignKeys: Array<{
        tableName: string;
        columnName: string;
        referencedTable: string;
        referencedColumn: string;
        onDelete?: string;
        onUpdate?: string;
    }>;
    warnings: string[];
    primaryKeyColumns?: string[];
    uniqueColumns?: string[];
    constraintName?: string;
} {
    const foreignKeys: Array<{
        tableName: string;
        columnName: string;
        referencedTable: string;
        referencedColumn: string;
        onDelete?: string;
        onUpdate?: string;
    }> = [];
    const warnings: string[] = [];
    let primaryKeyColumns: string[] = [];
    let uniqueColumns: string[] = [];
    let constraintName: string | undefined;

    if (constraint.constraint_name?.name) {
        constraintName = constraint.constraint_name.name;
    }

    const constraintType = constraint.constraint_type;
    
    switch (constraintType?.type) {
        case "constraint_foreign_key":
            const fkConstraint = constraintType;
            const sourceColumns = fkConstraint.columns?.expr?.items?.map((item: any) => item.name) || [];
            const refTable = fkConstraint.reference?.table?.name;
            const refColumns = fkConstraint.reference?.columns?.expr?.items?.map((item: any) => item.name) || [];
            
            sourceColumns.forEach((sourceCol: string, index: number) => {
                const refCol = refColumns[index] || 'id';
                foreignKeys.push({
                    tableName,
                    columnName: sourceCol,
                    referencedTable: refTable,
                    referencedColumn: refCol,
                    onDelete: fkConstraint.reference?.on_delete?.text,
                    onUpdate: fkConstraint.reference?.on_update?.text
                });
            });
            break;
            
        case "constraint_primary_key":
            primaryKeyColumns = constraintType.columns?.expr?.items?.map((item: any) => item.name) || [];
            break;
            
        case "constraint_unique":
            uniqueColumns = constraintType.columns?.expr?.items?.map((item: any) => item.name) || [];
            break;
            
        default:
            warnings.push(`Unsupported constraint type: ${constraintType?.type}`);
    }

    return { foreignKeys, warnings, primaryKeyColumns, uniqueColumns, constraintName };
}

function getDataTypeString(dataTypeNode: any): string {
    if (!dataTypeNode) return "unknown";
    
    switch (dataTypeNode.type) {
        case "data_type_name":
            return dataTypeNode.name?.text || "unknown";
        case "modified_data_type":
            const base = getDataTypeString(dataTypeNode.dataType);
            if (dataTypeNode.modifiers?.expr?.items) {
                const params = dataTypeNode.modifiers.expr.items.map((i: any) => i.text || i.value).join(",");
                return `${base}(${params})`;
            }
            return base;
        default:
            return "unknown";
    }
}

function getDefaultValue(valueNode: any): string | undefined {
    if (!valueNode) return undefined;
    
    switch (valueNode.type) {
        case "literal_null":
            return "NULL";
        case "literal_string":
            return valueNode.text?.replace(/['"]/g, '');
        case "literal_number":
            return valueNode.text;
        case "function_call":
            if (valueNode.name?.text?.toUpperCase() === 'CURRENT_TIMESTAMP') {
                return "CURRENT_TIMESTAMP";
            }
            return valueNode.text;
        default:
            return valueNode.text;
    }
}

function mapEngineType(engineStr?: string): 'InnoDB' | 'MyISAM' | 'MEMORY' | 'ARCHIVE' | 'CSV' {
    if (!engineStr) return 'InnoDB';
    
    const engine = engineStr.toUpperCase();
    switch (engine) {
        case 'INNODB':
            return 'InnoDB';
        case 'MYISAM':
            return 'MyISAM';
        case 'MEMORY':
            return 'MEMORY';
        case 'ARCHIVE':
            return 'ARCHIVE';
        case 'CSV':
            return 'CSV';
        default:
            return 'InnoDB';
    }
}
