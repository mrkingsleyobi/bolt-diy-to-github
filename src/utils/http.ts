// HTTP utility functions
export interface HttpClientOptions {
  baseUrl?: string;
  userAgent?: string;
  timeout?: number;
}

export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;

  constructor(options: HttpClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'https://api.github.com';
    this.timeout = options.timeout || 10000;
    this.defaultHeaders = {
      'User-Agent': options.userAgent || 'bolt-diy-to-github-client',
      'Accept': 'application/vnd.github.v3+json'
    };
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...init,
        headers: { ...this.defaultHeaders, ...init.headers },
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get(path: string, headers: Record<string, string> = {}): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.request(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async post(path: string, data: any, headers: Record<string, string> = {}): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async delete(path: string, headers: Record<string, string> = {}): Promise<void> {
    const url = `${this.baseUrl}${path}`;
    const response = await this.request(url, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
}