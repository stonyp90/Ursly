import { ConnectorCanvas } from '../features/connector-canvas/ConnectorCanvas';

export function Connectors() {
  return (
    <div className="h-[calc(100vh-120px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Creative Connectors</h1>
        <p className="text-muted-foreground">
          Drag and drop creative tools to build your AI-powered workflow
        </p>
      </div>
      <ConnectorCanvas />
    </div>
  );
}

