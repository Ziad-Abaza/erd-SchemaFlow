import { Node, Edge, Viewport } from 'reactflow';

export interface PerformanceConfig {
    enableLazyRendering: boolean;
    maxNodesInView: number;
    viewportBuffer: number;
    enableGrouping: boolean;
    enableBackgroundLayout: boolean;
}

export interface PerformanceMetrics {
    totalNodes: number;
    visibleNodes: number;
    renderedNodes: number;
    fps: number;
    renderTime: number;
    memoryUsage?: number;
}

export interface TableGroup {
    id: string;
    name: string;
    nodeIds: string[];
    position: { x: number; y: number };
    collapsed: boolean;
    color?: string;
}

export class PerformanceEngine {
    private static instance: PerformanceEngine;
    private config: PerformanceConfig;
    private metrics: PerformanceMetrics;
    private lastFrameTime: number = 0;
    private frameCount: number = 0;
    private fpsUpdateInterval: number = 1000; // Update FPS every second
    private tableGroups: Map<string, TableGroup> = new Map();
    private backgroundLayoutTimer: NodeJS.Timeout | null = null;

    private constructor() {
        this.config = {
            enableLazyRendering: true,
            maxNodesInView: 50,
            viewportBuffer: 200,
            enableGrouping: true,
            enableBackgroundLayout: true,
        };
        
        this.metrics = {
            totalNodes: 0,
            visibleNodes: 0,
            renderedNodes: 0,
            fps: 60,
            renderTime: 0,
        };
    }

    static getInstance(): PerformanceEngine {
        if (!PerformanceEngine.instance) {
            PerformanceEngine.instance = new PerformanceEngine();
        }
        return PerformanceEngine.instance;
    }

    // Configuration management
    updateConfig(newConfig: Partial<PerformanceConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }

    getConfig(): PerformanceConfig {
        return { ...this.config };
    }

    // Performance metrics
    updateMetrics(nodes: Node[], viewport: Viewport, renderTime: number): PerformanceMetrics {
        const now = performance.now();
        
        // Calculate FPS
        this.frameCount++;
        if (now - this.lastFrameTime >= this.fpsUpdateInterval) {
            this.metrics.fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
            this.frameCount = 0;
            this.lastFrameTime = now;
        }

        // Calculate node counts
        this.metrics.totalNodes = nodes.length;
        this.metrics.visibleNodes = this.getVisibleNodes(nodes, viewport).length;
        this.metrics.renderedNodes = this.config.enableLazyRendering 
            ? this.getNodesToRender(nodes, viewport).length 
            : this.metrics.visibleNodes;
        this.metrics.renderTime = renderTime;

        // Memory usage (if available)
        if ('memory' in performance) {
            this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
        }

        return { ...this.metrics };
    }

    getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    // Viewport-based node filtering
    private getVisibleNodes(nodes: Node[], viewport: Viewport): Node[] {
        const { x, y, zoom } = viewport;
        const width = window.innerWidth / zoom;
        const height = window.innerHeight / zoom;
        const buffer = this.config.viewportBuffer / zoom;

        return nodes.filter(node => {
            const nodeX = node.position.x;
            const nodeY = node.position.y;
            const nodeWidth = (node.width || 200) / zoom;
            const nodeHeight = (node.height || 150) / zoom;

            return (
                nodeX + nodeWidth + buffer >= x &&
                nodeX - buffer <= x + width &&
                nodeY + nodeHeight + buffer >= y &&
                nodeY - buffer <= y + height
            );
        });
    }

    getNodesToRender(nodes: Node[], viewport: Viewport): Node[] {
        if (!this.config.enableLazyRendering) {
            return nodes;
        }

        const visibleNodes = this.getVisibleNodes(nodes, viewport);
        
        // If we have too many visible nodes, prioritize by selection and importance
        if (visibleNodes.length > this.config.maxNodesInView) {
            return this.prioritizeNodes(visibleNodes);
        }

        return visibleNodes;
    }

    private prioritizeNodes(nodes: Node[]): Node[] {
        // Sort by: selected nodes first, then by table size (smaller tables first), then by ID
        return nodes.sort((a, b) => {
            const aSelected = a.selected ? 1 : 0;
            const bSelected = b.selected ? 1 : 0;
            
            if (aSelected !== bSelected) {
                return bSelected - aSelected;
            }

            const aColumnCount = (a.data as any)?.columns?.length || 0;
            const bColumnCount = (b.data as any)?.columns?.length || 0;
            
            if (aColumnCount !== bColumnCount) {
                return aColumnCount - bColumnCount;
            }

            return a.id.localeCompare(b.id);
        }).slice(0, this.config.maxNodesInView);
    }

    // Table grouping functionality
    createTableGroup(group: Omit<TableGroup, 'id'>): string {
        const id = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const tableGroup: TableGroup = { ...group, id };
        this.tableGroups.set(id, tableGroup);
        return id;
    }

    updateTableGroup(groupId: string, updates: Partial<TableGroup>): boolean {
        const group = this.tableGroups.get(groupId);
        if (!group) return false;

        this.tableGroups.set(groupId, { ...group, ...updates });
        return true;
    }

    deleteTableGroup(groupId: string): boolean {
        return this.tableGroups.delete(groupId);
    }

    getTableGroup(groupId: string): TableGroup | undefined {
        return this.tableGroups.get(groupId);
    }

    getAllTableGroups(): TableGroup[] {
        return Array.from(this.tableGroups.values());
    }

    getCollapsedGroups(): TableGroup[] {
        return Array.from(this.tableGroups.values()).filter(group => group.collapsed);
    }

    // Group-based node filtering
    getNodesForDisplay(nodes: Node[], viewport: Viewport): Node[] {
        let displayNodes = this.getNodesToRender(nodes, viewport);

        // Filter out nodes from collapsed groups
        const collapsedGroups = this.getCollapsedGroups();
        const collapsedNodeIds = new Set<string>();
        
        collapsedGroups.forEach(group => {
            group.nodeIds.forEach(nodeId => {
                collapsedNodeIds.add(nodeId);
            });
        });

        // Add group placeholder nodes for collapsed groups
        const groupPlaceholderNodes: Node[] = collapsedGroups.map(group => ({
            id: `group_placeholder_${group.id}`,
            type: 'groupPlaceholder',
            position: group.position,
            data: {
                label: group.name,
                nodeCount: group.nodeIds.length,
                groupId: group.id,
                color: group.color,
            },
            draggable: false,
            selectable: true,
        }));

        displayNodes = displayNodes.filter(node => !collapsedNodeIds.has(node.id));
        displayNodes = [...displayNodes, ...groupPlaceholderNodes];

        return displayNodes;
    }

    // Background layout recalculation
    scheduleBackgroundLayout(
        nodes: Node[],
        edges: Edge[],
        layoutCallback: (nodes: Node[], edges: Edge[]) => void,
        delay: number = 500
    ): void {
        if (!this.config.enableBackgroundLayout) {
            return;
        }

        // Clear existing timer
        if (this.backgroundLayoutTimer) {
            clearTimeout(this.backgroundLayoutTimer);
        }

        // Schedule new layout calculation
        this.backgroundLayoutTimer = setTimeout(() => {
            try {
                layoutCallback(nodes, edges);
            } catch (error) {
                console.warn('Background layout calculation failed:', error);
            }
        }, delay);
    }

    cancelBackgroundLayout(): void {
        if (this.backgroundLayoutTimer) {
            clearTimeout(this.backgroundLayoutTimer);
            this.backgroundLayoutTimer = null;
        }
    }

    // Performance optimization suggestions
    getOptimizationSuggestions(): string[] {
        const suggestions: string[] = [];
        const { totalNodes, visibleNodes, fps, renderTime } = this.metrics;

        if (totalNodes > 100 && !this.config.enableLazyRendering) {
            suggestions.push('Enable lazy rendering for better performance with large schemas');
        }

        if (visibleNodes > 50 && fps < 30) {
            suggestions.push('Consider reducing the maximum nodes in view or enable table grouping');
        }

        if (renderTime > 16 && fps < 60) { // 16ms = 60fps
            suggestions.push('Render time is high. Try enabling background layout recalculation');
        }

        if (totalNodes > 200 && !this.config.enableGrouping) {
            suggestions.push('Enable table grouping to better organize large schemas');
        }

        if (this.metrics.memoryUsage && this.metrics.memoryUsage > 100) {
            suggestions.push('High memory usage detected. Consider reducing viewport buffer');
        }

        return suggestions;
    }

    // Cleanup
    dispose(): void {
        this.cancelBackgroundLayout();
        this.tableGroups.clear();
    }
}

// React hook for performance management
export const usePerformanceEngine = () => {
    return PerformanceEngine.getInstance();
};
