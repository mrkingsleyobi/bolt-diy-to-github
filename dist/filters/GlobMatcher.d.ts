export declare class GlobMatcher {
    private pattern;
    private regex;
    private isNegation;
    constructor(pattern: string);
    match(path: string): boolean;
    private patternToRegex;
}
//# sourceMappingURL=GlobMatcher.d.ts.map