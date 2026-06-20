import { de } from './de';
import { en } from './en';
export const dictionaries = { de, en } as const;
export type Dictionary = typeof de;
