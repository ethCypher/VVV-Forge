
import { Layer, Trait, GeneratedToken, CollectionConfig } from './types';
import JSZip from 'jszip';

// IndexedDB Helper for Binary Storage
const DB_NAME = 'VVV_Forge_Assets';
const STORE_NAME = 'traits';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveTraitImage(id: string, file: File): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file, id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getTraitImage(id: string): Promise<File | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Simple seeded PRNG
export function createPRNG(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;

  return function() {
    h = (Math.imul(1597334677, h) + 1) | 0;
    return (h >>> 0) / 0xffffffff;
  };
}

// Generate a hash for a string (used for basic auth key derivation)
export async function hashCredentials(username: string, password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(username + ":" + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a hash for a set of traits to ensure uniqueness
export function generateTokenHash(traits: Record<string, string>, layers: Layer[]): string {
  return layers
    .map(l => traits[l.id] || 'none')
    .join('|');
}

// Weight-based trait selection
export function selectTrait(traits: Trait[], random: number): Trait {
  const totalWeight = traits.reduce((acc, t) => acc + t.weight, 0);
  let threshold = random * totalWeight;
  
  for (const trait of traits) {
    if (threshold < trait.weight) return trait;
    threshold -= trait.weight;
  }
  
  return traits[traits.length - 1];
}

// Simple Canvas Compositing
export async function renderToken(
  token: GeneratedToken, 
  layers: Layer[], 
  canvas: HTMLCanvasElement
): Promise<string> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const layer of layers) {
    const traitId = token.traits[layer.id];
    const trait = layer.traits.find(t => t.id === traitId);
    
    if (trait?.previewUrl) {
      const img = new Image();
      img.src = trait.previewUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  }

  return canvas.toDataURL('image/png');
}

export function formatMetadata(token: GeneratedToken, config: CollectionConfig, layers: Layer[]) {
  const attributes = layers.map(layer => {
    const traitId = token.traits[layer.id];
    const trait = layer.traits.find(t => t.id === traitId);
    return {
      trait_type: layer.name,
      value: trait?.name || 'None'
    };
  });

  return {
    name: `${config.name} #${token.id}`,
    symbol: config.symbol,
    description: config.description,
    seller_fee_basis_points: config.sellerFeeBasisPoints,
    image: `${token.id}.png`,
    external_url: config.externalUrl,
    attributes,
    properties: {
      files: [
        {
          uri: `${token.id}.png`,
          type: "image/png"
        }
      ],
      category: "image",
      creators: [
        {
          address: config.creatorAddress,
          share: 100
        }
      ]
    }
  };
}

export async function createZipArchive(
  tokens: GeneratedToken[],
  layers: Layer[],
  config: CollectionConfig,
  onProgress: (p: number) => void
) {
  const zip = new JSZip();
  const imagesFolder = zip.folder("images");
  const metadataFolder = zip.folder("metadata");
  
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1000;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    // 1. Render Image
    const dataUrl = await renderToken(token, layers, canvas);
    const base64Data = dataUrl.split(',')[1];
    imagesFolder?.file(`${token.id}.png`, base64Data, { base64: true });
    
    // 2. Generate Metadata
    const meta = formatMetadata(token, config, layers);
    metadataFolder?.file(`${token.id}.json`, JSON.stringify(meta, null, 2));
    
    onProgress(Math.round(((i + 1) / tokens.length) * 100));
  }
  
  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${config.name.replace(/\s+/g, '_')}_collection.zip`;
  link.click();
}
