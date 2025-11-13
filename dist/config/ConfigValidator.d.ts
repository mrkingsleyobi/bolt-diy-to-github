/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
    /**
     * Whether validation passed
     */
    valid: boolean;
    /**
     * Validation errors
     */
    errors: string[];
    /**
     * Validation warnings
     */
    warnings: string[];
}
/**
 * Configuration schema definition
 */
export interface ConfigSchema {
    /**
     * Schema properties
     */
    properties: Record<string, ConfigProperty>;
    /**
     * Required properties
     */
    required?: string[];
    /**
     * Additional validation rules
     */
    rules?: ConfigValidationRule[];
}
/**
 * Configuration property definition
 */
export interface ConfigProperty {
    /**
     * Property type
     */
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    /**
     * Property description
     */
    description?: string;
    /**
     * Default value
     */
    default?: any;
    /**
     * Whether property is required
     */
    required?: boolean;
    /**
     * Validation constraints
     */
    constraints?: PropertyConstraints;
}
/**
 * Property constraints
 */
export interface PropertyConstraints {
    /**
     * Minimum value (for numbers) or length (for strings/arrays)
     */
    min?: number;
    /**
     * Maximum value (for numbers) or length (for strings/arrays)
     */
    max?: number;
    /**
     * Regular expression pattern (for strings)
     */
    pattern?: RegExp;
    /**
     * Enum values (for strings/numbers)
     */
    enum?: any[];
    /**
     * Nested properties (for objects)
     */
    properties?: Record<string, ConfigProperty>;
    /**
     * Array item type (for arrays)
     */
    items?: ConfigProperty;
}
/**
 * Configuration validation rule
 */
export interface ConfigValidationRule {
    /**
     * Rule name
     */
    name: string;
    /**
     * Rule description
     */
    description: string;
    /**
     * Validation function
     */
    validate: (config: any) => boolean | string;
}
/**
 * Configuration validator interface
 */
export interface ConfigValidator {
    /**
     * Validate configuration against schema
     * @param config - Configuration to validate
     * @param schema - Configuration schema
     * @returns Validation result
     */
    validate(config: any, schema: ConfigSchema): ConfigValidationResult;
    /**
     * Validate configuration property
     * @param value - Property value
     * @param property - Property definition
     * @param path - Property path for error reporting
     * @returns Validation result
     */
    validateProperty(value: any, property: ConfigProperty, path: string): string[];
}
/**
 * Configuration validator implementation
 */
export declare class ConfigValidatorImpl implements ConfigValidator {
    /**
     * Validate configuration against schema
     * @param config - Configuration to validate
     * @param schema - Configuration schema
     * @returns Validation result
     */
    validate(config: any, schema: ConfigSchema): ConfigValidationResult;
    /**
     * Validate configuration property
     * @param value - Property value
     * @param property - Property definition
     * @param path - Property path for error reporting
     * @returns Validation errors
     */
    validateProperty(value: any, property: ConfigProperty, path: string): string[];
    /**
     * Validate property type
     * @param value - Property value
     * @param expectedType - Expected type
     * @param path - Property path
     * @param errors - Error array to populate
     * @returns True if type is valid, false otherwise
     */
    private validateType;
    /**
     * Get actual type of value
     * @param value - Value to check
     * @returns Type as string
     */
    private getType;
    /**
     * Validate property constraints
     * @param value - Property value
     * @param constraints - Property constraints
     * @param path - Property path
     * @param errors - Error array to populate
     */
    private validateConstraints;
    /**
     * Create default configuration schema
     * @returns Configuration schema
     */
    createDefaultSchema(): ConfigSchema;
}
//# sourceMappingURL=ConfigValidator.d.ts.map