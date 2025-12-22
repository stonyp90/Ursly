import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ConnectorNode, CONNECTOR_METADATA } from './types';

interface PropertiesPanelProps {
  node: ConnectorNode | null;
  onUpdate: (nodeId: string, updates: Partial<ConnectorNode>) => void;
  onDelete: (nodeId: string) => void;
}

export function PropertiesPanel({ node, onUpdate, onDelete }: PropertiesPanelProps) {
  if (!node) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a connector to view properties
          </p>
        </CardContent>
      </Card>
    );
  }

  const metadata = CONNECTOR_METADATA[node.type];

  const handleConnect = () => {
    onUpdate(node.id, { status: 'connected' });
  };

  const handleDisconnect = () => {
    onUpdate(node.id, { status: 'disconnected' });
  };

  const handleDelete = () => {
    onDelete(node.id);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{metadata.icon}</span>
          <span>Properties</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Name</label>
          <input
            type="text"
            value={node.name}
            onChange={(e) => onUpdate(node.id, { name: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Type</label>
          <p className="text-sm text-muted-foreground mt-1">{metadata.displayName}</p>
        </div>

        <div>
          <label className="text-sm font-medium">Status</label>
          <div className="mt-1">
            <span className={`
              inline-block px-3 py-1 rounded-full text-xs font-medium
              ${node.status === 'connected' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : ''}
              ${node.status === 'disconnected' ? 'bg-zinc-700/50 text-zinc-400 border border-zinc-600/30' : ''}
              ${node.status === 'connecting' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : ''}
              ${node.status === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : ''}
            `}>
              {node.status}
            </span>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Position</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">X</label>
              <input
                type="number"
                value={Math.round(node.position.x)}
                onChange={(e) => onUpdate(node.id, { 
                  position: { ...node.position, x: parseInt(e.target.value) || 0 } 
                })}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Y</label>
              <input
                type="number"
                value={Math.round(node.position.y)}
                onChange={(e) => onUpdate(node.id, { 
                  position: { ...node.position, y: parseInt(e.target.value) || 0 } 
                })}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Connections</label>
          <p className="text-sm text-muted-foreground mt-1">
            {node.connections.length} active connection(s)
          </p>
        </div>

        <div className="pt-4 space-y-2">
          {node.status === 'disconnected' ? (
            <Button onClick={handleConnect} className="w-full" variant="default">
              Connect
            </Button>
          ) : (
            <Button onClick={handleDisconnect} className="w-full" variant="outline">
              Disconnect
            </Button>
          )}
          
          <Button onClick={handleDelete} className="w-full" variant="destructive">
            Delete
          </Button>
        </div>

        <div className="pt-4 border-t border-zinc-700/50">
          <h4 className="text-sm font-medium mb-2">Available Ports</h4>
          
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Inputs:</p>
            <div className="space-y-1">
              {metadata.ports.input.map((port) => (
                <div key={port} className="text-xs bg-blue-500/15 text-blue-400 px-2 py-1 rounded border border-blue-500/20">
                  {port}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Outputs:</p>
            <div className="space-y-1">
              {metadata.ports.output.map((port) => (
                <div key={port} className="text-xs bg-purple-500/15 text-purple-400 px-2 py-1 rounded border border-purple-500/20">
                  {port}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

