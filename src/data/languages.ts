import { Language } from "@capacitor-mlkit/translation";

export interface LanguageOption {
  code: Language;
  name: string;
  speechTag: string;
}

export const languages: LanguageOption[] = [
  {
    code: Language.German,
    name: "Deutsch",
    speechTag: "de-DE",
  },
  {
    code: Language.English,
    name: "Englisch",
    speechTag: "en-US",
  },
  {
    code: Language.French,
    name: "Französisch",
    speechTag: "fr-FR",
  },
  {
    code: Language.Spanish,
    name: "Spanisch",
    speechTag: "es-ES",
  },
  {
    code: Language.Italian,
    name: "Italienisch",
    speechTag: "it-IT",
  },
];

export function languageName(code: string): string {
  const language = languages.find((lang) => lang.code === code);

  return language?.name ?? code;
}
