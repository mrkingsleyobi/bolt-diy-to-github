"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubClient = void 0;
// Main GitHub Client with service integration
const http_1 = require("../utils/http");
const GitHubPATAuthService_1 = require("../services/GitHubPATAuthService");
const RepositoryService_1 = require("./repositories/RepositoryService");
const BranchService_1 = require("./branches/BranchService");
const FileService_1 = require("./files/FileService");
class GitHubClient {
    constructor(token) {
        // Validate token format
        this.authService = new GitHubPATAuthService_1.GitHubPATAuthService();
        if (!this.authService.validateToken(token)) {
            throw new Error('Invalid GitHub PAT format');
        }
        this.token = token;
        this.httpClient = new http_1.HttpClient({
            baseUrl: 'https://api.github.com',
            userAgent: 'bolt-diy-to-github-client'
        });
        // Initialize services
        this._repositories = new RepositoryService_1.RepositoryService(this.httpClient, this.getAuthHeaders.bind(this));
        this._branches = new BranchService_1.BranchService(this.httpClient, this.getAuthHeaders.bind(this));
        this._files = new FileService_1.FileService(this.httpClient, this.getAuthHeaders.bind(this));
    }
    getAuthHeaders() {
        return {
            'Authorization': `token ${this.token}`
        };
    }
    get repositories() {
        return this._repositories;
    }
    get branches() {
        return this._branches;
    }
    get files() {
        return this._files;
    }
}
exports.GitHubClient = GitHubClient;
//# sourceMappingURL=GitHubClient.js.map