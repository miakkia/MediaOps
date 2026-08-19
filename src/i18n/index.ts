import {
  en,
  type TranslationSchema,
} from './en.js';

import { fr } from './fr.js';

export type SupportedLocale =
  | 'en'
  | 'fr';

type TranslationParams =
  Record<string, string | number>;

const translations:
  Record<SupportedLocale, TranslationSchema> = {
    en,
    fr,
  };

export function normalizeLocale(
  locale: string | null | undefined,
): SupportedLocale {
  const normalized =
    locale
      ?.trim()
      .toLowerCase();

  if (
    normalized === 'fr' ||
    normalized?.startsWith('fr-')
  ) {
    return 'fr';
  }

  return 'en';
}

export function t(
  locale: SupportedLocale,
  key: string,
  params: TranslationParams = {},
): string {
  const localizedValue =
    getTranslationValue(
      translations[locale],
      key,
    );

  const fallbackValue =
    getTranslationValue(
      translations.en,
      key,
    );

  const value =
    typeof localizedValue === 'string'
      ? localizedValue
      : fallbackValue;

  if (typeof value !== 'string') {
    throw new Error(
      `Missing translation key: ${key}`,
    );
  }

  return interpolate(
    value,
    params,
  );
}

function getTranslationValue(
  tree: TranslationSchema,
  key: string,
): unknown {
  const parts =
    key.split('.');

  let current: unknown =
    tree;

  for (const part of parts) {
    if (
      !current ||
      typeof current !== 'object'
    ) {
      return undefined;
    }

    const record =
      current as Record<string, unknown>;

    if (!(part in record)) {
      return undefined;
    }

    current =
      record[part];
  }

  return current;
}

function interpolate(
  template: string,
  params: TranslationParams,
): string {
  return template.replace(
    /\{([a-zA-Z0-9_]+)\}/g,
    (
      match: string,
      key: string,
    ) => {
      const value =
        params[key];

      if (value === undefined) {
        return match;
      }

      return String(value);
    },
  );
}