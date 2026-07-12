export const Translations = {
  en: {
    'Enter names below': 'Enter names below',
    Shuffle: 'Shuffle',
    Start: 'Start',
    Map: 'Map',
    Recording: 'Recording',
    'The winner is': 'The winner is',
    'Using skills': 'Using skills',
    'Buy me a coffee': 'Buy me a coffee',
    First: 'First',
    Last: 'Last',
    'Wheel of fortune': 'Wheel of fortune',
    BubblePop: 'BubblePop',
    'Pot of greed': 'Pot of greed',
    'Yoru ni Kakeru': 'Into The Night (by item4)',
    'Shake!': 'Shake!',
    'Input names separated by commas or line feed here': 'Input names separated by commas or line feed here',
    'This program is freeware and may be used freely anywhere, including in broadcasts and videos.':
      'This program is freeware and may be used freely anywhere, including in broadcasts and videos.',
    Close: 'Close',
    'The result has been copied': 'The result has been copied',
    '2025 Recap': '2025 Recap',
  },
} as const;

export type TranslatedLanguages = keyof typeof Translations;

export type TranslationKeys = keyof (typeof Translations)[TranslatedLanguages];
