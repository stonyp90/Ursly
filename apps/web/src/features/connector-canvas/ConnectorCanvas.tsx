import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { ConnectorPalette } from './ConnectorPalette';
import { CanvasArea } from './CanvasArea';
import { PropertiesPanel } from './PropertiesPanel';
import { ConnectorNode } from './types';

export function ConnectorCanvas() {
  const [nodes, setNodes] = useState<ConnectorNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<ConnectorNode | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;

    if (over && over.id === 'canvas-drop-area') {
      // Adding new connector from palette
      const connectorType = active.data.current?.type;
      if (connectorType) {
        const newNode: ConnectorNode = {
          id: `connector-${Date.now()}`,
          type: connectorType,
          name: `${connectorType} ${nodes.length + 1}`,
          position: {
            x: delta.x,
            y: delta.y,
          },
          status: 'disconnected',
          connections: [],
        };
        setNodes([...nodes, newNode]);
      }
    } else if (active.data.current?.nodeId) {
      // Moving existing connector
      const nodeId = active.data.current.nodeId;
      setNodes(nodes.map(node => 
        node.id === nodeId
          ? { ...node, position: { x: node.position.x + delta.x, y: node.position.y + delta.y } }
          : node
      ));
    }

    setActiveId(null);
  };

  const handleNodeSelect = (node: ConnectorNode) => {
    setSelectedNode(node);
  };

  const handleNodeUpdate = (nodeId: string, updates: Partial<ConnectorNode>) => {
    setNodes(nodes.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    ));
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, ...updates });
    }
  };

  const handleNodeDelete = (nodeId: string) => {
    setNodes(nodes.filter(node => node.id !== nodeId));
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex gap-4">
        <div className="w-64 flex-shrink-0">
          <ConnectorPalette />
        </div>
        
        <div className="flex-1">
          <CanvasArea
            nodes={nodes}
            onNodeSelect={handleNodeSelect}
            selectedNodeId={selectedNode?.id}
          />
        </div>
        
        <div className="w-80 flex-shrink-0">
          <PropertiesPanel
            node={selectedNode}
            onUpdate={handleNodeUpdate}
            onDelete={handleNodeDelete}
          />
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="bg-zinc-800 shadow-lg shadow-primary/20 rounded-lg p-4 border-2 border-primary text-zinc-100">
            Dragging...
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

