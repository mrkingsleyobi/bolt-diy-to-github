"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
class HttpClient {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'https://api.github.com';
        this.timeout = options.timeout || 10000;
        this.defaultHeaders = {
            'User-Agent': options.userAgent || 'bolt-diy-to-github-client',
            'Accept': 'application/vnd.github.v3+json'
        };
    }
    async request(url, init) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
            const response = await fetch(url, {
                ...init,
                headers: { ...this.defaultHeaders, ...init.headers },
                signal: controller.signal
            });
            return response;
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    async get(path, headers = {}) {
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
    async post(path, data, headers = {}) {
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
    async delete(path, headers = {}) {
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
exports.HttpClient = HttpClient;
//# sourceMappingURL=http.js.map