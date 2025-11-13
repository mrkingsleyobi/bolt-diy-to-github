import { RepositoryService } from './repositories/RepositoryService';
import { BranchService } from './branches/BranchService';
import { FileService } from './files/FileService';
export declare class GitHubClient {
    private httpClient;
    private authService;
    private token;
    private _repositories;
    private _branches;
    private _files;
    constructor(token: string);
    private getAuthHeaders;
    get repositories(): RepositoryService;
    get branches(): BranchService;
    get files(): FileService;
}
//# sourceMappingURL=GitHubClient.d.ts.map