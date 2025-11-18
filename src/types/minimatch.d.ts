declare module 'minimatch' {
  function minimatch(path: string, pattern: string, options?: any): boolean;

  namespace minimatch {
    function match(list: string[], pattern: string, options?: any): string[];
    class Minimatch {
      constructor(pattern: string, options?: any);
      match(path: string): boolean;
    }
    function makeRe(pattern: string, options?: any): RegExp;
  }

  export = minimatch;
}