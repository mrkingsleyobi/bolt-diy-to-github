"use strict";
// EnvironmentAdapter.ts - Environment adapter interface for Cross-Origin Communication Framework
// Phase 4: Environment Configuration Management - Task 2: Create Environment Adapter Interface
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentType = void 0;
/**
 * Environment types
 */
var EnvironmentType;
(function (EnvironmentType) {
    EnvironmentType["DEVELOPMENT"] = "development";
    EnvironmentType["TESTING"] = "testing";
    EnvironmentType["STAGING"] = "staging";
    EnvironmentType["PRODUCTION"] = "production";
    EnvironmentType["CLOUD"] = "cloud";
    EnvironmentType["CICD"] = "cicd";
})(EnvironmentType || (exports.EnvironmentType = EnvironmentType = {}));
//# sourceMappingURL=EnvironmentAdapter.js.map