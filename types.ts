
export interface Trait {
  id: string;
  name: string;
  weight: number;
  imageFile: File | null;
  previewUrl: string | null;
  constraints: Constraint[];
}

export interface Constraint {
  id: string;
  type: 'exclude' | 'require';
  targetLayerId: string;
  targetTraitId: string;
}

export interface Layer {
  id: string;
  name: string;
  traits: Trait[];
  isVisible: boolean;
  isLocked: boolean;
}

export interface CollectionConfig {
  name: string;
  symbol: string;
  description: string;
  size: number;
  startIndex: number;
  seed: string;
  externalUrl: string;
  creatorAddress: string;
  sellerFeeBasisPoints: number;
}

export interface GeneratedToken {
  id: number;
  traits: Record<string, string>; // layerId -> traitId
  hash: string;
  rarityScore: number;
}

export enum GenerationView {
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW',
  QA = 'QA',
  EXPORT = 'EXPORT'
}
