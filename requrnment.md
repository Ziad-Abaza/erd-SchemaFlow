
## **Project Infrastructure & Architecture (Enhanced)**

* **Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS
* **State Management:** Zustand (diagram state), React Query (server-side metadata)
* **Diagram Engine:** React Flow Pro/Standard + Dagre.js for hierarchical layout + optional Force-directed layout for large schemas
* **SQL Parser:** `sql-parser-cst` or `nearley.js` for custom grammar
* **Persistence / Collaboration:** Supabase/PostgreSQL, Yjs for real-time multi-user editing

---

### **Phase 1: Environment Setup & Core Canvas (Enhanced)**

* Initialize Next.js with TypeScript and install `reactflow`.
* Configure **ThemeProvider** (Dark/Light modes).
* Implement **Viewport Controller**:

  * Zoom-to-fit, Pan, Minimap
  * Snap-to-grid and alignment guides for tables
  * Lazy rendering for large diagrams

---

### **Phase 2: Advanced Table Node Development**

* Create `TableNode` with header (Table Name) and list of columns.
* Visual indicators:

  * PK/FK/Nullable icons
  * Inline column properties: data type, default value, auto-increment, unique/index badges
* **Interactive Handles:** Left/Right for relationships
* Support **drag column → another table to create FK**

---

### **Phase 3: SQL Parsing Engine (Reverse Engineering Core)**

* Parse `.sql` files into **Concrete Syntax Tree (CST)**.
* Extraction utility to find `CREATE TABLE` statements.
* Map data types to internal JSON format.
* Detect **constraints**:

  * Primary Keys, Foreign Keys
  * Unique, Index, Auto-increment, Default values

---

### **Phase 4: Relationship Detection & Edge Mapping**

* Map `FOREIGN KEY` constraints to edges.
* Support **Edge Types**:

  * SmoothStep / Bezier curves
  * Crow’s Foot notation + cardinality labels (1:1, 1:N, N:M)
  * Display column names on edges for clarity
* Highlight invalid/missing references dynamically

---

### **Phase 5: Automated & Smart Layout Engine**

* Integrate `dagre.js` for hierarchical layout.
* Optional **force-directed layout** for large diagrams.
* "Re-layout" button to optimize table positions and minimize edge crossings.
* Support **group collapse/expand** and minimap overview.

---

### **Phase 6: Interactive CRUD & Column Management**

* Add / Delete / Rename Tables and Columns.
* Multi-select tables for batch operations (move, delete).
* Drag columns to other tables → auto-create FK.
* Context-aware right-click menus:

  * Duplicate table / clone column
  * Quick FK creation
  * Auto-index suggestion

---

### **Phase 7: Sidebar Property Panel (Advanced)**

* Opens when a table or edge is clicked.
* Edit advanced properties:

  * Indices (Unique, Full-text)
  * Engine types (InnoDB, MyISAM)
  * Collation, default values, auto-increment
* Show **validation warnings** inline.

---

### **Phase 8: State Persistence, Undo/Redo & History**

* Full **history stack** for all edits using Zustand.
* Undo / Redo support.
* Save state locally (`localStorage`) or remotely (Supabase/PostgreSQL).
* Version snapshots:

  * Compare versions visually
  * Restore old versions

---

### **Phase 9: Forward Engineering (SQL Generator)**

* Serialize Nodes & Edges into a clean `.sql` file:

  * `CREATE TABLE` + `ALTER TABLE` statements
  * Option for **full diagram or partial selection**
* Features:

  * Copy to Clipboard
  * Download `.sql`
  * Sync with actual database for differences

---

### **Phase 10: Validation, Linting & Suggestions**

* Detect and highlight:

  * Tables without PKs
  * Duplicate table or column names
  * Circular dependencies
  * Invalid FK references
* Intelligent suggestions:

  * Normalize tables
  * Detect redundant columns
  * Recommend indexes

---

### **Phase 11: Export & Documentation**

* Export diagrams as:

  * High-resolution PNG / SVG / PDF
  * Maintain vector quality and editable layers
* Table List view (Markdown / PDF) for schema documentation
* Optional: include **edge labels & column details** in exports

---

### **Phase 12: Collaboration & Real-Time Multi-user Editing**

* Integrate **Yjs** for real-time collaboration (like Figma).
* Live cursors and selection highlights for multiple users.
* Comments / Annotations per table or column.
* Version comparison and snapshot restoration.

---

### **Phase 13: Performance & Large Schema Optimization**

* Lazy rendering for 100+ tables.
* Collapse / Expand table groups.
* Minimap + overview panel for navigation.
* Background layout recalculation for smooth interactions.

