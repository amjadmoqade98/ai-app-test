export interface TranslationResponse {
  originalTranscription: string;
  detectedLanguage: string;
  translatedText: string;
  targetLanguage: string;
}

export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface AudioRecorderHook {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  hasPermission: boolean;
}