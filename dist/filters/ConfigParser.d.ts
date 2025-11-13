import { FilterConfig, Filter } from '../types/filters';
/**
 * Filter configuration parser
 * Creates filter instances from configuration objects
 */
export declare class ConfigParser {
    /**
     * Parse filter configuration and create filter instances
     * @param config Filter configuration
     * @returns Array of filter instances
     */
    parse(config: FilterConfig): Filter[];
    /**
     * Create a glob filter for a pattern
     * @param pattern Glob pattern
     * @param isInclude Whether this is an include pattern
     * @returns Filter instance
     */
    private createGlobFilter;
}
//# sourceMappingURL=ConfigParser.d.ts.map