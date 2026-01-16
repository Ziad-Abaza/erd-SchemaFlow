# ERD Design Engine - Advanced Entity Relationship Diagram Editor

![ERD Editor Overview](public/overview.jpeg)

A powerful, feature-rich web-based ERD (Entity Relationship Diagram) editor built with Next.js, React Flow, and modern web technologies. Designed for database architects and developers to visualize, design, and export database schemas with comprehensive SQL support.

![Next.js](https://img.shields.io/badge/Next.js-16.1.2-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![React](https://img.shields.io/badge/React-19.2.3-blue?logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)
![React Flow](https://img.shields.io/badge/React%20Flow-11.11.4-blue?logo=react)

## ✨ Key Features

### 🎨 Visual Design & Interaction
- **Interactive Canvas** with zoom, pan, and minimap navigation
- **Drag-and-drop** table and column management
- **Real-time validation** with visual indicators
- **Dark/Light theme** support with smooth transitions
- **Responsive design** for desktop and tablet use

### 🗄️ Database Schema Management
- **Complete CRUD operations** for tables and columns
- **Advanced column properties**: data types, constraints, defaults, comments
- **Index management** (UNIQUE, FULLTEXT, SPATIAL)
- **Table properties**: engine, collation, comments
- **Foreign key relationships** with visual edge connections

### 📊 SQL Integration
- **SQL Import**: Upload `.sql` files to automatically generate ERDs
- **Multi-dialect support**: PostgreSQL, MySQL, SQLite
- **SQL Export**: Generate clean, production-ready SQL scripts
- **Forward engineering**: Convert diagrams to database schemas
- **Schema validation** with intelligent suggestions

### 🚀 Performance & Scalability
- **Lazy rendering** for large schemas (100+ tables)
- **Viewport culling** for optimal performance
- **Table grouping** and clustering
- **Background layout processing**
- **Real-time performance monitoring**

### 📤 Export & Documentation
- **Multiple formats**: PNG, SVG, PDF, Markdown
- **High-resolution exports** with customizable quality
- **Schema documentation** with detailed table information
- **Selective exports** (selected tables only)
- **Professional-quality output** for presentations

### ⏰ History & Persistence
- **Undo/Redo** functionality with full history stack
- **Auto-save** to localStorage every 30 seconds
- **Version snapshots** with visual management
- **Import/Export** diagram state as JSON
- **Keyboard shortcuts** for power users

### 🔍 Validation & Quality
- **Comprehensive validation engine** for schema quality
- **Real-time linting** with visual feedback
- **Intelligent suggestions** for optimization
- **Naming convention checks**
- **Performance recommendations**

### 🤖 AI-Powered Features
- **AI Chat Assistant**: Conversational database design help with context awareness
- **Intelligent Suggestions**: AI-driven schema optimizations and recommendations
- **Natural Language Table Creation**: Create tables from natural language descriptions
- **Database Monitoring Insights**: Performance analysis and optimization suggestions
- **Smart Refactoring**: AI-assisted schema normalization and improvements

## 🛠️ Technology Stack

- **Frontend**: Next.js 16.1.2 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand 5.0.10
- **Diagram Engine**: React Flow 11.11.4
- **Layout Algorithm**: Dagre.js 0.8.5
- **SQL Parsing**: sql-parser-cst 0.38.2
- **UI Components**: Radix UI, Lucide React
- **Data Fetching**: TanStack React Query 5.90.17
- **Export**: html2canvas 1.4.1, jsPDF 4.0.0
- **Theme**: next-themes 0.4.6
- **AI Backend**: FastAPI with ctransformers
- **AI Model**: Mistral-7B-Instruct (4-bit quantized)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Python 3.8+ (for AI features)
- npm, yarn, pnpm, or bun

### Quick Start with Docker (Optional)

```bash
docker build -t erd-editor .
docker run -p 3000:3000 erd-editor
```

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd erd-editor
```

2. **Install frontend dependencies**:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. **Set up AI server** (optional but recommended):
```bash
cd server
pip install -r requirements.txt
cd ..
```

4. **Download AI Model** (optional):
The AI features use Mistral-7B-Instruct model. Place the model file in the project root or set the `MODEL_PATH` environment variable.

5. **Run the development servers**:

**Terminal 1 - AI Server** (optional, for AI features):
```bash
cd server
python main.py
# AI server will start on http://localhost:8000
```

**Terminal 2 - Frontend**:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

6. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

7. **Start designing** your database schema!

> **Note**: The application works without the AI server, but AI features will run in mock mode. For the full experience, run both servers.

## 📖 Usage Guide

### Creating Your First ERD

1. **Add Tables**: Click "Add Table" in the toolbar or right-click on the canvas
2. **Edit Columns**: Click on a table to open the property panel and add columns
3. **Create Relationships**: Drag from a column to another table to create foreign keys
4. **Set Properties**: Use the property panel to configure advanced settings
5. **Validate**: Enable validation to check for schema issues
6. **Export**: Use the export panel to generate SQL or documentation

### Importing SQL Schemas

1. Click "Import SQL" in the toolbar
2. Upload a `.sql` file or drag-and-drop it onto the import panel
3. Review the parsed schema and detected relationships
4. Click "Generate ERD" to create the diagram
5. Continue editing as needed

### Keyboard Shortcuts

- `Ctrl+Z`: Undo
- `Ctrl+Y` / `Ctrl+Shift+Z`: Redo
- `Ctrl+S`: Save to localStorage
- `Ctrl+O`: Load from localStorage
- `Ctrl+A`: Select all nodes
- `Delete/Backspace`: Delete selected nodes
- `Escape`: Clear selection

## 🤖 AI Features Guide

### Setting Up AI Features

1. **Install Python dependencies**:
```bash
cd server
pip install -r requirements.txt
```

2. **Download the AI Model**:
- Get Mistral-7B-Instruct (4-bit quantized) from Hugging Face
- Place the model file in the project root or specify path via `MODEL_PATH` environment variable

3. **Start the AI Server**:
```bash
cd server
python main.py
```

4. **Configure Frontend**:
- Set `AI_SERVER_URL` environment variable (default: `http://localhost:8000`)
- The frontend will automatically connect to the AI server

### Using AI Features

#### AI Chat Assistant
- Access via the AI chat panel in the editor
- Ask questions about database design, SQL, and optimization
- Use commands like:
  - `/create-table <description>` - Create tables from natural language
  - `/suggest-indexes` - Get index recommendations
  - `/explain-issues` - Understand validation problems
  - `/generate-sql <table>` - Generate SQL for specific tables

#### AI Suggestions
- AI analyzes your current schema and provides intelligent recommendations
- Suggestions include:
  - Missing foreign keys
  - Performance optimizations (indexes)
  - Normalization improvements
  - Naming convention fixes
- Click "Apply" to automatically implement suggestions

#### Natural Language Table Creation
1. Click "AI Table" or use the chat command
2. Describe your table: "Create a users table with email, name, and created_at"
3. Review the AI-generated table structure
4. Apply to your diagram

#### Database Monitoring
- Connect to your database for performance insights
- AI analyzes query patterns and suggests optimizations
- Get recommendations for indexing and schema improvements

### AI Model Details

- **Model**: Mistral-7B-Instruct-v0.2 (4-bit quantized)
- **Framework**: ctransformers with Python backend
- **Performance**: Optimized for CPU, GPU acceleration available
- **Context**: Supports large context windows for complex schemas
- **Privacy**: Runs locally, no data sent to external services

### Troubleshooting AI Features

**Model not loading**:
- Check model path in `MODEL_PATH` environment variable
- Ensure sufficient RAM (8GB+ recommended for 4-bit quantized model)
- Verify Python dependencies are installed

**Slow AI responses**:
- Enable GPU acceleration with CUDA-compatible PyTorch
- Reduce context size by limiting schema complexity
- Use streaming responses for better UX

**Mock mode active**:
- AI server is not running or model failed to load
- Start the AI server: `cd server && python main.py`
- Check server logs for error messages

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── globals.css        # Global styles
│   ├── favicon.ico        # App icon
│   └── api/               # API routes
│       └── ai/            # AI integration endpoints
│           └── chat/      # AI chat proxy
├── components/
│   ├── editor/            # ERD editor components
│   │   ├── canvas.tsx     # Main diagram canvas
│   │   ├── toolbar.tsx    # Editor toolbar
│   │   ├── unified-toolbar.tsx # Enhanced toolbar with controls
│   │   ├── bottom-toolbar.tsx # Bottom action toolbar
│   │   ├── layout-controls.tsx # Layout management
│   │   ├── context-menu.tsx # Right-click context menu
│   │   ├── export-button.tsx # Quick export functionality
│   │   ├── nodes/         # Custom node components
│   │   │   ├── table-node.tsx # Table node component
│   │   │   └── group-node.tsx # Table grouping node
│   │   ├── edges/         # Custom edge components
│   │   │   └── database-relationship-edge.tsx # Relationship edges
│   │   ├── property-panel.tsx # Sidebar property editor
│   │   ├── validation-panel.tsx # Validation interface
│   │   ├── sql-export-panel.tsx # SQL export interface
│   │   ├── sql-import-panel.tsx # SQL import interface
│   │   ├── export-panel.tsx # Export options panel
│   │   ├── history-panel.tsx # Version history management
│   │   ├── performance-panel.tsx # Performance monitoring
│   │   ├── suggestions-panel.tsx # AI suggestions
│   │   └── reactflow-enhancements.css # Custom React Flow styles
│   ├── providers.tsx      # Global React providers
│   └── ui/                # Reusable UI components
├── lib/
│   ├── layout-engine.ts   # Dagre layout integration
│   ├── performance-engine.ts # Performance optimization
│   ├── export-engine.ts   # Export functionality
│   └── store/
│       └── use-diagram-store.ts # Zustand state management
server/
├── main.py               # FastAPI AI server
├── requirements.txt      # Python dependencies
└── run_server.bat       # Windows startup script
AI/                      # AI model directory (optional)
├── mistral-7b-instruct-v0.2.Q4_K_M.gguf  # AI model file
```

## 🔧 Advanced Features

### Performance Optimization

The ERD editor includes advanced performance features for handling large schemas:

- **Lazy Rendering**: Only renders visible tables in the viewport
- **Table Grouping**: Automatically clusters related tables
- **Background Processing**: Non-blocking layout calculations
- **Memory Management**: Efficient state management and cleanup

### Validation Engine

Comprehensive schema validation with real-time feedback:

- **Schema Validation**: Missing primary keys, data type issues
- **Naming Validation**: Duplicate names, convention violations
- **Integrity Validation**: Circular dependencies, orphaned foreign keys
- **Performance Validation**: Unindexed foreign keys, optimization suggestions
- **Normalization**: Redundancy detection and decomposition suggestions

### SQL Dialect Support

The parser supports multiple SQL dialects with automatic detection:

- **PostgreSQL**: Advanced data types, constraints, and extensions
- **MySQL**: Engine types, character sets, and MySQL-specific features
- **SQLite**: Lightweight database with standard SQL features

## 📊 Export Capabilities

### Image Exports
- **PNG**: High-resolution raster images with customizable quality
- **SVG**: Vector graphics with editable layers
- **PDF**: Professional documents with automatic layout

### Documentation Exports
- **Markdown**: Structured documentation with table details
- **PDF**: Formatted documentation with headers and styling
- **SQL Scripts**: Production-ready database schemas

### Export Options
- Include/exclude edge labels and column details
- Customizable background colors
- Selective table exports
- Quality and scale controls

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork the repository** and create your feature branch
2. **Set up your development environment** (see Getting Started)
3. **Make your changes** following our code style guidelines
4. **Test thoroughly**:
   ```bash
   npm run lint      # Check code quality
   npm run build     # Ensure production build works
   ```
5. **Commit your changes** using conventional commits:
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
6. **Push to your fork** and open a Pull Request

### Code Style Guidelines

- **TypeScript** for type safety and better DX
- **ESLint** with Next.js configuration for code quality
- **Tailwind CSS** for consistent styling
- **Conventional Commits** for clear commit messages
- **Component-first architecture** with clear separation of concerns

### Areas for Contribution

- 🎨 **UI/UX improvements** and new components
- 🔧 **Performance optimizations** for large schemas
- 📊 **Additional export formats** and integrations
- 🔍 **Enhanced validation rules** and suggestions
- 🤖 **AI features and model improvements**
- 🌐 **Internationalization** support
- 📱 **Mobile responsiveness** improvements

## 📝 Development

### Available Scripts

```bash
# Frontend
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint

# AI Server (Python)
cd server
python main.py   # Start AI server (http://localhost:8000)
# Or on Windows:
run_server.bat   # Start AI server with batch script
```

### Environment Setup

The project uses modern tooling for optimal development experience:

- **Babel React Compiler**: Experimental React compiler for performance
- **ESLint with Next.js Config**: Code quality and consistency
- **Tailwind CSS v4**: Latest utility-first CSS framework
- **TypeScript**: Type safety and better developer experience

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Conventional commits for messages

---

<div align="center">
  <p>Made with ❤️ by the database community</p>
  <p><strong>Star ⭐ this repo if it helped you design better databases!</strong></p>
</div>
