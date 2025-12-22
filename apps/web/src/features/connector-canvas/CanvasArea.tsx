import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Card } from '../../components/ui/card';
import { ConnectorNode, CONNECTOR_METADATA } from './types';

interface CanvasAreaProps {
  nodes: ConnectorNode[];
  onNodeSelect: (node: ConnectorNode) => void;
  selectedNodeId?: string;
}

interface DraggableNodeProps {
  node: ConnectorNode;
  isSelected: boolean;
  onClick: () => void;
}

function DraggableNode({ node, isSelected, onClick }: DraggableNodeProps) {
  const metadata = CONNECTOR_METADATA[node.type];
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: node.id,
    data: { nodeId: node.id },
  });

  const statusColors = {
    connected: 'border-emerald-500/50 bg-emerald-500/10',
    connecting: 'border-amber-500/50 bg-amber-500/10',
    disconnected: 'border-zinc-600 bg-zinc-800/80',
    error: 'border-red-500/50 bg-red-500/10',
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: `${node.position.x}px`,
        top: `${node.position.y}px`,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
      }}
      className={`
        w-48 p-4 rounded-lg border-2 shadow-md cursor-move transition-all
        ${statusColors[node.status]}
        ${isSelected ? 'ring-2 ring-primary' : ''}
        ${isDragging ? 'opacity-50' : ''}
      `}
      onClick={onClick}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{metadata.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate text-zinc-100">{node.name}</p>
          <p className="text-xs text-zinc-400">{metadata.category}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={`px-2 py-1 rounded ${node.status === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700/50 text-zinc-400'}`}>
          {node.status}
        </span>
        <span className="text-zinc-400">{node.connections.length} links</span>
      </div>

      {/* Input Ports */}
      <div className="mt-3 space-y-1">
        <p className="text-xs font-medium text-zinc-400">Inputs:</p>
        {metadata.ports.input.slice(0, 2).map((port) => (
          <div key={port} className="text-xs bg-blue-500/15 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
            {port}
          </div>
        ))}
      </div>

      {/* Output Ports */}
      <div className="mt-2 space-y-1">
        <p className="text-xs font-medium text-zinc-400">Outputs:</p>
        {metadata.ports.output.slice(0, 2).map((port) => (
          <div key={port} className="text-xs bg-purple-500/15 text-purple-400 px-2 py-1 rounded border border-purple-500/20">
            {port}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CanvasArea({ nodes, onNodeSelect, selectedNodeId }: CanvasAreaProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-area',
  });

  return (
    <Card className="h-full">
      <div
        ref={setNodeRef}
        className={`
          relative w-full h-full min-h-[600px]
          bg-zinc-900/50 rounded-lg overflow-auto
          ${isOver ? 'bg-primary/5 border-2 border-dashed border-primary' : ''}
        `}
      >
        {nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">Drag connectors here</p>
              <p className="text-sm">Build your creative workflow by connecting tools</p>
            </div>
          </div>
        ) : (
          nodes.map((node) => (
            <DraggableNode
              key={node.id}
              node={node}
              isSelected={node.id === selectedNodeId}
              onClick={() => onNodeSelect(node)}
            />
          ))
        )}
      </div>
    </Card>
  );
}

