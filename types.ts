export enum AspectRatio {
  Portrait = '9:16',
  Landscape = '16:9',
  Square = '1:1',
  Classic = '3:4',
}

export interface Dimension {
  width: number;
  height: number;
  label: string;
  ratio: number;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

export enum AppState {
  Setup = 'SETUP',
  Recording = 'RECORDING',
  Review = 'REVIEW',
}
