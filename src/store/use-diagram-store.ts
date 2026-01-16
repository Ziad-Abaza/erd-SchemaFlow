import { create } from 'zustand';
import {
    Connection,
    Edge,
    EdgeChange,
    Node,
    NodeChange,
    addEdge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    applyNodeChanges,
    applyEdgeChanges,
} from 'reactflow';

type DiagramState = {
    nodes: Node[];
    edges: Edge[];
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
};

export const useDiagramStore = create<DiagramState>((set, get) => ({
    nodes: [
        {
            id: '1',
            position: { x: 100, y: 100 },
            type: 'table',
            data: {
                label: 'users',
                columns: [
                    { id: 'c1', name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isNullable: false },
                    { id: 'c2', name: 'email', type: 'varchar(255)', isPrimaryKey: false, isForeignKey: false, isNullable: false, isUnique: true },
                    { id: 'c3', name: 'password', type: 'varchar(255)', isPrimaryKey: false, isForeignKey: false, isNullable: false },
                    { id: 'c4', name: 'created_at', type: 'timestamp', isPrimaryKey: false, isForeignKey: false, isNullable: true },
                ],
            },
        },
        {
            id: '2',
            position: { x: 500, y: 100 },
            type: 'table',
            data: {
                label: 'posts',
                columns: [
                    { id: 'c1', name: 'id', type: 'uuid', isPrimaryKey: true, isForeignKey: false, isNullable: false },
                    { id: 'c2', name: 'user_id', type: 'uuid', isPrimaryKey: false, isForeignKey: true, isNullable: false },
                    { id: 'c3', name: 'title', type: 'varchar(255)', isPrimaryKey: false, isForeignKey: false, isNullable: false },
                    { id: 'c4', name: 'content', type: 'text', isPrimaryKey: false, isForeignKey: false, isNullable: true },
                ]
            }
        }
    ],
    edges: [
        { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true }
    ],
    onNodesChange: (changes: NodeChange[]) => {
        set({
            nodes: applyNodeChanges(changes, get().nodes),
        });
    },
    onEdgesChange: (changes: EdgeChange[]) => {
        set({
            edges: applyEdgeChanges(changes, get().edges),
        });
    },
    onConnect: (connection: Connection) => {
        set({
            edges: addEdge(connection, get().edges),
        });
    },
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
}));
