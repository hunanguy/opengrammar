export type LLMProvider = 'openai' | 'openrouter' | 'groq' | 'together' | 'ollama' | 'custom';

export interface ProviderConfig {
  id: LLMProvider;
  name: string;
  baseUrl: string;
  models: string[];
  requiresApiKey: boolean;
  description: string;
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    requiresApiKey: true,
    description: 'Official OpenAI API',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      'meta-llama/llama-3-70b-instruct',
      'anthropic/claude-3.5-sonnet',
      'google/gemma-2-27b-it',
    ],
    requiresApiKey: true,
    description: 'Access 100+ models with one API',
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      'llama-3.1-70b-versatile',
      'llama-3.1-8b-instant',
      'gemma2-9b-it',
      'mixtral-8x7b-32768',
    ],
    requiresApiKey: true,
    description: 'Blazing fast inference',
  },
  {
    id: 'together',
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    models: [
      'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      'mistralai/Mixtral-8x7B-Instruct-v0.1',
    ],
    requiresApiKey: true,
    description: 'Open source models at scale',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/v1',
    models: ['qwen2.5:0.5b', 'qwen2.5:1.5b', 'phi4-mini:3.8b', 'llama3.2:3b', 'mistral:7b'],
    requiresApiKey: false,
    description: 'Run models locally on your machine',
  },
  {
    id: 'custom',
    name: 'Custom Endpoint',
    baseUrl: '',
    models: [],
    requiresApiKey: true,
    description: 'Your own OpenAI-compatible API',
  },
];

export interface Issue {
  type: 'grammar' | 'spelling' | 'clarity' | 'style';
  original: string;
  suggestion: string;
  reason: string;
  offset: number;
  length: number;
  id?: string;
  ignored?: boolean;
  confidence?: number;
  priority?: number;
  source?: 'rule' | 'llm' | 'context';
}

export interface IgnoredIssue {
  id: string;
  type: Issue['type'];
  original: string;
  suggestion: string;
  ignoredAt: number;
}

export interface AnalysisContext {
  domain?: string;
  editorType?: string;
  activeSentence?: string;
  previousText?: string;
  nextText?: string;
  fullTextExcerpt?: string;
}

export interface CustomRule {
  id: string;
  pattern: string;
  replacement: string;
  description: string;
  type: 'grammar' | 'spelling' | 'clarity' | 'style';
}

export interface AnalyzeRequest {
  text: string;
  apiKey?: string;
  model?: string;
  provider?: LLMProvider;
  baseUrl?: string;
  ignoredIssues?: string[];
  customRules?: CustomRule[];
  dictionary?: string[];
  context?: AnalysisContext;
  disabledModules?: string[];
}

export interface AnalysisMetadata {
  textLength: number;
  issuesCount: number;
  processingTimeMs: number;
  contextUsed?: boolean;
  model?: string;
  provider?: string;
}

export interface AnalyzeResponse {
  issues: Issue[];
  metadata?: AnalysisMetadata;
  error?: string;
  message?: string;
}

export interface HighlightData {
  issue: Issue;
  element: HTMLElement;
  range: Range;
}

export interface RewriteRequest {
  text: string;
  tone:
    | 'formal'
    | 'casual'
    | 'professional'
    | 'friendly'
    | 'concise'
    | 'detailed'
    | 'persuasive'
    | 'neutral';
  apiKey?: string;
  model?: string;
  provider?: LLMProvider;
  baseUrl?: string;
}

export interface RewriteResponse {
  original: string;
  rewritten: string;
  tone: string;
  error?: string;
}

export interface AutocompleteRequest {
  text: string;
  cursor: number;
  apiKey?: string;
  model?: string;
  provider?: LLMProvider;
  baseUrl?: string;
  context?: AnalysisContext;
}

export interface AutocompleteResponse {
  suggestion: string;
  confidence: number;
  replaceStart: number;
  replaceEnd: number;
  source: 'heuristic' | 'llm';
  error?: string;
}

export interface EditorContext {
  text: string;
  issues: Issue[];
  sourceTabId?: number;
  capturedAt: number;
}

export interface RewriteContext {
  selectedText: string;
  sourceTabId?: number;
  capturedAt: number;
}

export type AnalyticsEventType =
  | 'analysis_runs'
  | 'issues_found'
  | 'suggestions_applied'
  | 'suggestions_ignored'
  | 'autocomplete_shown'
  | 'autocomplete_accepted'
  | 'rewrite_opened'
  | 'rewrite_applied';

export interface AnalyticsSummary {
  totals: Record<AnalyticsEventType, number>;
  domains: Record<string, number>;
  providers: Record<string, number>;
  lastUpdatedAt?: number;
}