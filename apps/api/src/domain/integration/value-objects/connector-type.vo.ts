export enum ConnectorTypeValue {
  ADOBE_PREMIERE = 'adobe-premiere',
  ADOBE_AFTER_EFFECTS = 'adobe-after-effects',
  ADOBE_PHOTOSHOP = 'adobe-photoshop',
  MAYA = 'maya',
  BLENDER = 'blender',
  UNITY = 'unity',
  UNREAL_ENGINE = 'unreal-engine',
  DAVINCI_RESOLVE = 'davinci-resolve',
  CUSTOM = 'custom',
}

export class ConnectorType {
  private constructor(public readonly value: ConnectorTypeValue) {}

  static adobePremiere(): ConnectorType {
    return new ConnectorType(ConnectorTypeValue.ADOBE_PREMIERE);
  }

  static adobeAfterEffects(): ConnectorType {
    return new ConnectorType(ConnectorTypeValue.ADOBE_AFTER_EFFECTS);
  }

  static adobePhotoshop(): ConnectorType {
    return new ConnectorType(ConnectorTypeValue.ADOBE_PHOTOSHOP);
  }

  static maya(): ConnectorType {
    return new ConnectorType(ConnectorTypeValue.MAYA);
  }

  static blender(): ConnectorType {
    return new ConnectorType(ConnectorTypeValue.BLENDER);
  }

  static unity(): ConnectorType {
    return new ConnectorType(ConnectorTypeValue.UNITY);
  }

  static unrealEngine(): ConnectorType {
    return new ConnectorType(ConnectorTypeValue.UNREAL_ENGINE);
  }

  static davinciResolve(): ConnectorType {
    return new ConnectorType(ConnectorTypeValue.DAVINCI_RESOLVE);
  }

  static custom(): ConnectorType {
    return new ConnectorType(ConnectorTypeValue.CUSTOM);
  }

  static from(value: string): ConnectorType {
    const typeValue = Object.values(ConnectorTypeValue).find(v => v === value);
    if (!typeValue) {
      throw new Error(`Invalid connector type: ${value}`);
    }
    return new ConnectorType(typeValue);
  }

  isAdobe(): boolean {
    return this.value.startsWith('adobe-');
  }

  is3D(): boolean {
    return [
      ConnectorTypeValue.MAYA,
      ConnectorTypeValue.BLENDER,
      ConnectorTypeValue.UNITY,
      ConnectorTypeValue.UNREAL_ENGINE,
    ].includes(this.value);
  }

  isVideo(): boolean {
    return [
      ConnectorTypeValue.ADOBE_PREMIERE,
      ConnectorTypeValue.ADOBE_AFTER_EFFECTS,
      ConnectorTypeValue.DAVINCI_RESOLVE,
    ].includes(this.value);
  }

  getDisplayName(): string {
    const names: Record<ConnectorTypeValue, string> = {
      [ConnectorTypeValue.ADOBE_PREMIERE]: 'Adobe Premiere Pro',
      [ConnectorTypeValue.ADOBE_AFTER_EFFECTS]: 'Adobe After Effects',
      [ConnectorTypeValue.ADOBE_PHOTOSHOP]: 'Adobe Photoshop',
      [ConnectorTypeValue.MAYA]: 'Autodesk Maya',
      [ConnectorTypeValue.BLENDER]: 'Blender',
      [ConnectorTypeValue.UNITY]: 'Unity',
      [ConnectorTypeValue.UNREAL_ENGINE]: 'Unreal Engine',
      [ConnectorTypeValue.DAVINCI_RESOLVE]: 'DaVinci Resolve',
      [ConnectorTypeValue.CUSTOM]: 'Custom Connector',
    };
    return names[this.value];
  }

  equals(other: ConnectorType): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

