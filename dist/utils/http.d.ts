export interface HttpClientOptions {
    baseUrl?: string;
    userAgent?: string;
    timeout?: number;
}
export declare class HttpClient {
    private baseUrl;
    private defaultHeaders;
    private timeout;
    constructor(options?: HttpClientOptions);
    private request;
    get(path: string, headers?: Record<string, string>): Promise<any>;
    post(path: string, data: any, headers?: Record<string, string>): Promise<any>;
    delete(path: string, headers?: Record<string, string>): Promise<void>;
}
//# sourceMappingURL=http.d.ts.map