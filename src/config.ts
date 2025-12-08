export interface Config {
  outputPath: string;
  providers: {
    claude: ProviderConfig;
    chatgpt: ProviderConfig;
  };
  tagging: TaggingConfig;
  formatting: FormattingConfig;
}

export interface ProviderConfig {
  enabled: boolean;
  autoDetectExports: boolean;
  lastExportPath?: string;
}

export interface TaggingConfig {
  enabled: boolean;
  model: string;
  threshold: number;
  maxTags: number;
  customCategories: string[];
}

export interface FormattingConfig {
  dateFormat: string;
  folderStructure: string;
  filenameTemplate: string;
}

export const defaultConfig: Config = {
  outputPath: './output', // Default relative to CWD
  providers: {
    claude: {
      enabled: true,
      autoDetectExports: true
    },
    chatgpt: {
      enabled: true,
      autoDetectExports: true
    }
  },
  tagging: {
    enabled: false,
    model: 'Xenova/mobilebert-uncased-mnli',
    threshold: 0.5,
    maxTags: 5,
    customCategories: [
      'framework development',
      'personal reflection',
      'relationship dynamics',
      'consciousness exploration',
      'integration work',
      'practical planning',
      'emotional processing',
      'neurodivergence',
      'creativity',
      'problem solving'
    ]
  },
  formatting: {
    dateFormat: 'YYYY-MM-DD',
    folderStructure: '{year}/{month}-{monthName}/',
    filenameTemplate: '{day}-{slug}.md'
  }
};
