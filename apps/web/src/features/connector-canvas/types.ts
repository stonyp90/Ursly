export interface ConnectorNode {
  id: string;
  type: ConnectorType;
  name: string;
  position: Position;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  connections: Connection[];
  config?: ConnectorConfig;
}

export type ConnectorType =
  | 'adobe-premiere'
  | 'adobe-after-effects'
  | 'adobe-photoshop'
  | 'maya'
  | 'blender'
  | 'unity'
  | 'unreal-engine'
  | 'davinci-resolve';

export interface Position {
  x: number;
  y: number;
}

export interface Connection {
  sourceId: string;
  targetId: string;
  sourcePort: string;
  targetPort: string;
}

export interface ConnectorConfig {
  authType: 'oauth2' | 'api-key' | 'none';
  credentials?: Record<string, string>;
  settings: Record<string, any>;
}

export interface ConnectorMetadata {
  type: ConnectorType;
  icon: string;
  displayName: string;
  description: string;
  category: 'video' | '3d' | 'image' | 'game-engine';
  ports: {
    input: string[];
    output: string[];
  };
}

export const CONNECTOR_METADATA: Record<ConnectorType, ConnectorMetadata> = {
  'adobe-premiere': {
    type: 'adobe-premiere',
    icon: '🎬',
    displayName: 'Adobe Premiere Pro',
    description: 'Video editing and production',
    category: 'video',
    ports: {
      input: ['import-footage', 'import-audio', 'import-sequence'],
      output: ['export-video', 'export-xml', 'export-edl'],
    },
  },
  'adobe-after-effects': {
    type: 'adobe-after-effects',
    icon: '🎨',
    displayName: 'Adobe After Effects',
    description: 'Motion graphics and VFX',
    category: 'video',
    ports: {
      input: ['import-comp', 'import-footage', 'import-project'],
      output: ['export-render', 'export-comp', 'export-jsx'],
    },
  },
  'adobe-photoshop': {
    type: 'adobe-photoshop',
    icon: '🖼️',
    displayName: 'Adobe Photoshop',
    description: 'Image editing and compositing',
    category: 'image',
    ports: {
      input: ['import-image', 'import-psd'],
      output: ['export-image', 'export-psd', 'export-layers'],
    },
  },
  'maya': {
    type: 'maya',
    icon: '🗿',
    displayName: 'Autodesk Maya',
    description: '3D modeling and animation',
    category: '3d',
    ports: {
      input: ['import-fbx', 'import-obj', 'import-scene'],
      output: ['export-fbx', 'export-obj', 'export-render'],
    },
  },
  'blender': {
    type: 'blender',
    icon: '🎭',
    displayName: 'Blender',
    description: '3D creation suite',
    category: '3d',
    ports: {
      input: ['import-blend', 'import-fbx', 'import-obj'],
      output: ['export-blend', 'export-fbx', 'export-render'],
    },
  },
  'unity': {
    type: 'unity',
    icon: '🎮',
    displayName: 'Unity',
    description: 'Game engine and real-time 3D',
    category: 'game-engine',
    ports: {
      input: ['import-asset', 'import-scene', 'import-prefab'],
      output: ['export-bundle', 'export-build', 'export-scene'],
    },
  },
  'unreal-engine': {
    type: 'unreal-engine',
    icon: '⚡',
    displayName: 'Unreal Engine',
    description: 'Real-time 3D creation tool',
    category: 'game-engine',
    ports: {
      input: ['import-asset', 'import-level', 'import-blueprint'],
      output: ['export-build', 'export-pak', 'export-level'],
    },
  },
  'davinci-resolve': {
    type: 'davinci-resolve',
    icon: '🎥',
    displayName: 'DaVinci Resolve',
    description: 'Color grading and video editing',
    category: 'video',
    ports: {
      input: ['import-timeline', 'import-media', 'import-project'],
      output: ['export-video', 'export-xml', 'export-timeline'],
    },
  },
};

