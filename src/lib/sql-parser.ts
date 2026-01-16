import { parse } from "sql-parser-cst";
import { TableNodeData, Column } from "@/components/editor/nodes/table-node";

function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

export function parseSqlToTables(sql: string): TableNodeData[] {
    let cst;
    try {
        cst = parse(sql, { dialect: "postgresql" });
    } catch (e) {
        console.error("SQL Parse Error", e);
        return [];
    }

    const tables: TableNodeData[] = [];

    // Traverse basic CST structure
    // Casting to any because CstNode types are complex to import without full setup
    const root = cst as any;

    if (root.type === "program" && Array.isArray(root.statements)) {
        for (const stmt of root.statements) {
            if (stmt.type === "create_table_stmt") {
                const tableName = stmt.name.name;
                const columns: Column[] = [];

                if (stmt.columns && stmt.columns.expr && stmt.columns.expr.items) {
                    for (const item of stmt.columns.expr.items) {
                        if (item.type === "column_definition") {
                            const colName = item.name.name;
                            const dataType = getDataTypeString(item.dataType);

                            let isPrimaryKey = false;
                            let isNullable = true; // Default SQL behavior usually nullable unless NOT NULL specified
                            let isUnique = false;
                            let isForeignKey = false;

                            if (item.constraints) {
                                for (const constraint of item.constraints) {
                                    if (constraint.type === "constraint_primary_key") isPrimaryKey = true;
                                    if (constraint.type === "constraint_not_null") isNullable = false;
                                    if (constraint.type === "constraint_unique") isUnique = true;
                                    // Check for inline references
                                    if (constraint.type === "constraint_check") {
                                        // complex
                                    }
                                }
                            }

                            if (isPrimaryKey) isNullable = false;

                            columns.push({
                                id: generateId(),
                                name: colName,
                                type: dataType,
                                isPrimaryKey,
                                isForeignKey,
                                isNullable,
                                isUnique
                            });
                        }
                        // TODO: Handle out-of-line constraints (FOREIGN KEY ...) in future
                    }
                }

                tables.push({
                    label: tableName,
                    columns
                });
            }
        }
    }

    return tables;
}

function getDataTypeString(dataTypeNode: any): string {
    if (!dataTypeNode) return "unknown";
    if (dataTypeNode.type === "data_type_name") {
        return dataTypeNode.name.text;
    }
    if (dataTypeNode.type === "modified_data_type") {
        const base = getDataTypeString(dataTypeNode.dataType);
        if (dataTypeNode.modifiers?.expr?.items) {
            const params = dataTypeNode.modifiers.expr.items.map((i: any) => i.text).join(",");
            return `${base}(${params})`;
        }
        return base;
    }
    return "unknown";
}
