import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Node, Edge } from 'reactflow';
import { Column } from '@/components/editor/nodes/table-node';

export interface ExportOptions {
  format: 'png' | 'svg' | 'pdf';
  quality?: number;
  scale?: number;
  backgroundColor?: string;
  includeEdges?: boolean;
  includeColumnDetails?: boolean;
  includeEdgeLabels?: boolean;
  filename?: string;
}

export interface DocumentationOptions {
  format: 'markdown' | 'pdf';
  includeColumnDetails?: boolean;
  includeRelationships?: boolean;
  includeStatistics?: boolean;
  filename?: string;
}

export class ExportEngine {
  static async exportDiagram(
    element: HTMLElement,
    options: ExportOptions
  ): Promise<void> {
    const {
      format,
      quality = 1,
      scale = 2,
      backgroundColor = '#ffffff',
      filename = `erd-diagram-${Date.now()}`
    } = options;

    try {
      switch (format) {
        case 'png':
          await this.exportAsPNG(element, { quality, scale, backgroundColor, filename });
          break;
        case 'svg':
          await this.exportAsSVG(element, { filename });
          break;
        case 'pdf':
          await this.exportAsPDF(element, { quality, scale, backgroundColor, filename });
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  private static async exportAsPNG(
    element: HTMLElement,
    options: { quality: number; scale: number; backgroundColor: string; filename: string }
  ): Promise<void> {
    let tempContainer: HTMLElement | null = null;
    
    try {
      // Create a clean clone of the element for export
      const cleanElement = this.createCleanExportClone(element);
      tempContainer = cleanElement.parentElement;
      
      const canvas = await html2canvas(cleanElement, {
        backgroundColor: options.backgroundColor,
        scale: options.scale,
        useCORS: true,
        allowTaint: true,
        // Completely ignore all CSS to avoid color parsing issues
        ignoreElements: (element) => {
          return element.tagName === 'STYLE' || 
                 element.tagName === 'LINK' ||
                 element.tagName === 'SCRIPT' ||
                 element.tagName === 'META';
        },
        logging: false,
        // Use foreignObject rendering to avoid CSS parsing
        foreignObjectRendering: false,
      });

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${options.filename}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }
        },
        'image/png',
        options.quality
      );
    } catch (error) {
      console.error('PNG export failed:', error);
      throw new Error(`PNG export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clean up temporary container
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
    }
  }

  private static createCleanExportClone(element: HTMLElement): HTMLElement {
    // Deep clone the element
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Remove all external references and problematic content
    this.cleanElementForExport(clone);
    
    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = element.offsetWidth + 'px';
    container.style.height = element.offsetHeight + 'px';
    container.appendChild(clone);
    
    document.body.appendChild(container);
    
    // Return the cloned element
    return clone;
  }

  private static cleanElementForExport(element: HTMLElement): void {
    // Remove all style and link tags
    const stylesAndLinks = element.querySelectorAll('style, link[rel="stylesheet"]');
    stylesAndLinks.forEach(el => el.remove());
    
    // Remove all script tags
    const scripts = element.querySelectorAll('script');
    scripts.forEach(el => el.remove());
    
    // Remove all inline styles from all elements
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      el.removeAttribute('style');
      el.removeAttribute('class');
    });
    
    // Apply basic inline styles for essential elements
    this.applyBasicStyles(element);
  }

  private static applyBasicStyles(element: HTMLElement): void {
    // Apply basic styling to ReactFlow elements
    const reactFlowElement = element.querySelector('.react-flow');
    if (reactFlowElement) {
      (reactFlowElement as HTMLElement).style.backgroundColor = '#ffffff';
      (reactFlowElement as HTMLElement).style.fontFamily = 'system-ui, -apple-system, sans-serif';
    }
    
    // Style nodes
    const nodes = element.querySelectorAll('.react-flow__node');
    nodes.forEach(node => {
      (node as HTMLElement).style.backgroundColor = '#ffffff';
      (node as HTMLElement).style.border = '1px solid #e5e7eb';
      (node as HTMLElement).style.borderRadius = '8px';
      (node as HTMLElement).style.padding = '8px';
      (node as HTMLElement).style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });
    
    // Style edges
    const edges = element.querySelectorAll('.react-flow__edge-path');
    edges.forEach(edge => {
      (edge as SVGElement).setAttribute('stroke', '#3b82f6');
      (edge as SVGElement).setAttribute('stroke-width', '2');
      (edge as SVGElement).setAttribute('fill', 'none');
    });
    
    // Style text elements
    const textElements = element.querySelectorAll('text, .react-flow__node-text');
    textElements.forEach(text => {
      (text as HTMLElement).style.color = '#000000';
      (text as HTMLElement).style.fontSize = '14px';
      (text as HTMLElement).style.fontWeight = 'normal';
    });
  }

  private static async exportAsSVG(
    element: HTMLElement,
    options: { filename: string }
  ): Promise<void> {
    try {
      // Find the ReactFlow SVG element specifically
      const reactFlowElement = element.querySelector('.react-flow') as HTMLElement;
      if (!reactFlowElement) {
        throw new Error('ReactFlow container not found');
      }

      const svgElement = reactFlowElement.querySelector('svg') as SVGElement;
      if (!svgElement) {
        throw new Error('No SVG element found in the diagram');
      }

      // Clone the SVG element to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Get the actual dimensions from the ReactFlow viewport
      const bbox = reactFlowElement.getBoundingClientRect();
      const viewBox = clonedSvg.getAttribute('viewBox') || `0 0 ${bbox.width} ${bbox.height}`;
      
      // Set proper dimensions
      clonedSvg.setAttribute('width', bbox.width.toString());
      clonedSvg.setAttribute('height', bbox.height.toString());
      clonedSvg.setAttribute('viewBox', viewBox);
      
      // Remove problematic CSS and simplify styles
      this.cleanupSvgForExport(clonedSvg);
      
      // Serialize SVG to string
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      
      // Create blob and download
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${options.filename}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('SVG export failed:', error);
      throw error;
    }
  }

  private static cleanupSvgForExport(svgElement: SVGElement): void {
    // Remove all style elements that might contain unsupported CSS
    const styleElements = svgElement.querySelectorAll('style');
    styleElements.forEach(style => style.remove());
    
    // Remove elements with problematic attributes
    const allElements = svgElement.querySelectorAll('*');
    allElements.forEach(element => {
      // Remove style attributes that might contain oklab or other unsupported functions
      element.removeAttribute('style');
      
      // Remove class attributes to avoid CSS conflicts
      element.removeAttribute('class');
      
      // Remove data attributes
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('data-')) {
          element.removeAttribute(attr.name);
        }
      });
    });
    
    // Apply basic styling directly to elements for better compatibility
    const edges = svgElement.querySelectorAll('.react-flow__edge-path');
    edges.forEach(edge => {
      (edge as SVGElement).setAttribute('stroke', '#3b82f6');
      (edge as SVGElement).setAttribute('stroke-width', '2');
      (edge as SVGElement).setAttribute('fill', 'none');
    });
    
    const nodes = svgElement.querySelectorAll('.react-flow__node');
    nodes.forEach(node => {
      // Basic node styling
      const rect = node.querySelector('rect');
      if (rect) {
        (rect as SVGElement).setAttribute('fill', '#ffffff');
        (rect as SVGElement).setAttribute('stroke', '#e5e7eb');
        (rect as SVGElement).setAttribute('stroke-width', '1');
      }
    });
  }

  private static async exportAsPDF(
    element: HTMLElement,
    options: { quality: number; scale: number; backgroundColor: string; filename: string }
  ): Promise<void> {
    let tempContainer: HTMLElement | null = null;
    
    try {
      // Use the same clean clone approach as PNG export
      const cleanElement = this.createCleanExportClone(element);
      tempContainer = cleanElement.parentElement;
      
      const canvas = await html2canvas(cleanElement, {
        backgroundColor: options.backgroundColor,
        scale: options.scale,
        useCORS: true,
        allowTaint: true,
        ignoreElements: (element) => {
          return element.tagName === 'STYLE' || 
                 element.tagName === 'LINK' ||
                 element.tagName === 'SCRIPT' ||
                 element.tagName === 'META';
        },
        logging: false,
        foreignObjectRendering: false,
      });

      const imgData = canvas.toDataURL('image/png', options.quality);
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${options.filename}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clean up temporary container
      if (tempContainer && tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
    }
  }

  static generateDocumentation(
    nodes: Node[],
    edges: Edge[],
    options: DocumentationOptions
  ): string {
    const {
      format,
      includeColumnDetails = true,
      includeRelationships = true,
      includeStatistics = true,
      filename = `schema-documentation-${Date.now()}`
    } = options;

    const tableNodes = nodes.filter(node => node.type === 'table');
    
    let content = '';

    if (format === 'markdown') {
      content = this.generateMarkdownDocumentation(
        tableNodes,
        edges,
        { includeColumnDetails, includeRelationships, includeStatistics }
      );
      
      // Download markdown file
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.md`;
      link.click();
      URL.revokeObjectURL(url);
      
      return content;
    } else if (format === 'pdf') {
      // For PDF, we'll generate markdown first and then convert to PDF
      const markdownContent = this.generateMarkdownDocumentation(
        tableNodes,
        edges,
        { includeColumnDetails, includeRelationships, includeStatistics }
      );
      
      // Create a simple PDF with the markdown content
      const pdf = new jsPDF();
      const lines = pdf.splitTextToSize(markdownContent, 180);
      let y = 20;
      
      lines.forEach((line: string) => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, 15, y);
        y += 7;
      });
      
      pdf.save(`${filename}.pdf`);
      return markdownContent;
    }

    return content;
  }

  private static generateMarkdownDocumentation(
    tableNodes: Node[],
    edges: Edge[],
    options: { includeColumnDetails: boolean; includeRelationships: boolean; includeStatistics: boolean }
  ): string {
    let content = '# Database Schema Documentation\n\n';
    
    // Add statistics
    if (options.includeStatistics) {
      content += '## Schema Statistics\n\n';
      content += `- **Tables**: ${tableNodes.length}\n`;
      content += `- **Relationships**: ${edges.length}\n`;
      
      let totalColumns = 0;
      let primaryKeys = 0;
      let foreignKeys = 0;
      
      tableNodes.forEach(node => {
        const columns = (node.data as any).columns || [];
        totalColumns += columns.length;
        primaryKeys += columns.filter((col: Column) => col.isPrimaryKey).length;
        foreignKeys += columns.filter((col: Column) => col.isForeignKey).length;
      });
      
      content += `- **Total Columns**: ${totalColumns}\n`;
      content += `- **Primary Keys**: ${primaryKeys}\n`;
      content += `- **Foreign Keys**: ${foreignKeys}\n\n`;
    }

    // Add tables
    content += '## Tables\n\n';
    
    tableNodes.forEach(node => {
      const tableData = node.data as any;
      const columns = tableData.columns || [];
      
      content += `### ${tableData.label}\n\n`;
      
      if (options.includeColumnDetails && columns.length > 0) {
        content += '| Column Name | Type | PK | FK | Nullable | Unique | Default |\n';
        content += '|-------------|------|----|----|----------|--------|----------|\n';
        
        columns.forEach((column: Column) => {
          content += `| ${column.name} | ${column.type} | ${column.isPrimaryKey ? '✓' : ''} | ${column.isForeignKey ? '✓' : ''} | ${column.isNullable ? '✓' : ''} | ${column.isUnique ? '✓' : ''} | ${column.defaultValue || ''} |\n`;
        });
        
        content += '\n';
      }
    });

    // Add relationships
    if (options.includeRelationships && edges.length > 0) {
      content += '## Relationships\n\n';
      
      edges.forEach(edge => {
        const sourceTable = tableNodes.find(node => node.id === edge.source);
        const targetTable = tableNodes.find(node => node.id === edge.target);
        
        if (sourceTable && targetTable) {
          const sourceColumn = (sourceTable.data as any).columns?.find((col: Column) => col.id === edge.sourceHandle);
          const targetColumn = (targetTable.data as any).columns?.find((col: Column) => col.id === edge.targetHandle);
          
          content += `- **${sourceTable.data.label}**.${sourceColumn?.name || edge.sourceHandle} → **${targetTable.data.label}**.${targetColumn?.name || edge.targetHandle}\n`;
        }
      });
      
      content += '\n';
    }

    content += `---\n*Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*`;
    
    return content;
  }

  static getDiagramStatistics(nodes: Node[], edges: Edge[]): {
    tables: number;
    relationships: number;
    totalColumns: number;
    primaryKeys: number;
    foreignKeys: number;
    uniqueConstraints: number;
    indexedColumns: number;
  } {
    const tableNodes = nodes.filter(node => node.type === 'table');
    
    let totalColumns = 0;
    let primaryKeys = 0;
    let foreignKeys = 0;
    let uniqueConstraints = 0;
    let indexedColumns = 0;
    
    tableNodes.forEach(node => {
      const columns = (node.data as any).columns || [];
      totalColumns += columns.length;
      primaryKeys += columns.filter((col: Column) => col.isPrimaryKey).length;
      foreignKeys += columns.filter((col: Column) => col.isForeignKey).length;
      uniqueConstraints += columns.filter((col: Column) => col.isUnique).length;
      indexedColumns += columns.filter((col: Column) => (col as any).isIndexed).length;
    });
    
    return {
      tables: tableNodes.length,
      relationships: edges.length,
      totalColumns,
      primaryKeys,
      foreignKeys,
      uniqueConstraints,
      indexedColumns
    };
  }
}
