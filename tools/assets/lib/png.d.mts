export interface PngPixels { width: number; height: number; data: Uint8Array }
export function readPng(path: string | URL): PngPixels
export function alphaBounds(png: PngPixels, minAlpha?: number): { x: number; y: number; width: number; height: number } | null
export function alphaBoundsInRows(png: PngPixels, fromRow: number, toRow: number, minAlpha?: number): { x: number; y: number; width: number; height: number } | null
