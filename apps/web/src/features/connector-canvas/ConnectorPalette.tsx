import { useDraggable } from '@dnd-kit/core';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { CONNECTOR_METADATA, ConnectorType } from './types';

interface DraggableConnectorProps {
  type: ConnectorType;
}

function DraggableConnector({ type }: DraggableConnectorProps) {
  const metadata = CONNECTOR_METADATA[type];
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-lg cursor-move transition-all
        hover:border-primary hover:bg-zinc-800/80 hover:shadow-md hover:shadow-primary/10
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl">{metadata.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate text-zinc-100">{metadata.displayName}</p>
          <p className="text-xs text-zinc-400 truncate">{metadata.category}</p>
        </div>
      </div>
    </div>
  );
}

export function ConnectorPalette() {
  const categories = {
    video: [] as ConnectorType[],
    '3d': [] as ConnectorType[],
    image: [] as ConnectorType[],
    'game-engine': [] as ConnectorType[],
  };

  Object.entries(CONNECTOR_METADATA).forEach(([type, metadata]) => {
    categories[metadata.category].push(type as ConnectorType);
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Connectors</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Video</h4>
          <div className="space-y-2">
            {categories.video.map((type) => (
              <DraggableConnector key={type} type={type} />
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">3D</h4>
          <div className="space-y-2">
            {categories['3d'].map((type) => (
              <DraggableConnector key={type} type={type} />
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Image</h4>
          <div className="space-y-2">
            {categories.image.map((type) => (
              <DraggableConnector key={type} type={type} />
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Game Engines</h4>
          <div className="space-y-2">
            {categories['game-engine'].map((type) => (
              <DraggableConnector key={type} type={type} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

