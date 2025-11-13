export interface FileContent {
    type: 'file';
    encoding: 'base64';
    size: number;
    name: string;
    path: string;
    content: string;
    sha: string;
    url: string;
    git_url: string;
    html_url: string;
    download_url: string;
}
export interface DirectoryContent {
    type: 'dir';
    size: number;
    name: string;
    path: string;
    sha: string;
    url: string;
    git_url: string;
    html_url: string;
}
export type Content = FileContent | DirectoryContent;
export interface FileCreateParams {
    message: string;
    content: string;
    branch?: string;
    committer?: {
        name: string;
        email: string;
    };
    author?: {
        name: string;
        email: string;
    };
}
export interface FileUpdateParams {
    message: string;
    content: string;
    sha: string;
    branch?: string;
    committer?: {
        name: string;
        email: string;
    };
    author?: {
        name: string;
        email: string;
    };
}
export interface FileDeleteParams {
    message: string;
    sha: string;
    branch?: string;
    committer?: {
        name: string;
        email: string;
    };
    author?: {
        name: string;
        email: string;
    };
}
export interface FileOperationResult {
    content: FileContent;
    commit: {
        sha: string;
        node_id: string;
        url: string;
        html_url: string;
        author: {
            date: string;
            name: string;
            email: string;
        };
        committer: {
            date: string;
            name: string;
            email: string;
        };
        message: string;
        tree: {
            url: string;
            sha: string;
        };
        parents: Array<{
            url: string;
            html_url: string;
            sha: string;
        }>;
    };
}
export interface FileDeleteResult {
    commit: {
        sha: string;
        node_id: string;
        url: string;
        html_url: string;
        author: {
            date: string;
            name: string;
            email: string;
        };
        committer: {
            date: string;
            name: string;
            email: string;
        };
        message: string;
        tree: {
            url: string;
            sha: string;
        };
        parents: Array<{
            url: string;
            html_url: string;
            sha: string;
        }>;
    };
}
export interface BatchFileOperation {
    path: string;
    operation: 'create' | 'update' | 'delete';
    content?: string;
    sha?: string;
    message: string;
    branch?: string;
}
export interface BatchFileOperationResult {
    path: string;
    success: boolean;
    result?: FileOperationResult | FileDeleteResult;
    error?: string;
}
//# sourceMappingURL=file.d.ts.map