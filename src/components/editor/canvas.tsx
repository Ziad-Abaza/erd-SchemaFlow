"use client"

import React, { useEffect, useState } from 'react';
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    Panel,
    ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useDiagramStore } from '@/store/use-diagram-store';
import { useTheme } from 'next-themes';
import TableNode from './nodes/table-node';

const nodeTypes = {
    table: TableNode,
};

const CanvasContent = () => {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useDiagramStore();
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentTheme = mounted ? (theme === 'system' ? resolvedTheme : theme) : 'light';
    const isDark = currentTheme === 'dark';

    return (
        <div className="w-full h-full bg-background transition-colors duration-300">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="bg-background"
                minZoom={0.1}
                maxZoom={4}
                snapToGrid={true}
                snapGrid={[20, 20]}
                onlyRenderVisibleElements={true}
            >
                <Background
                    gap={20}
                    color={isDark ? '#333' : '#ddd'}
                    variant={BackgroundVariant.Dots}
                />
                <Controls className="bg-card border-border fill-foreground stroke-foreground text-foreground" />
                <MiniMap
                    nodeColor={isDark ? '#555' : '#eee'}
                    maskColor={isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)'}
                    style={{
                        backgroundColor: isDark ? '#111' : '#fff',
                        height: 150,
                        width: 200
                    }}
                    className="border border-border rounded shadow-lg"
                />
                <Panel position="top-right" className="p-2 bg-card rounded shadow-md border border-border">
                    <div className="text-xs text-muted-foreground font-mono">ERD Editor v0.1</div>
                </Panel>
            </ReactFlow>
        </div>
    );
};

export default function Canvas() {
    return (
        <ReactFlowProvider>
            <CanvasContent />
        </ReactFlowProvider>
    )
}
