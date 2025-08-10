// Client-side debugging utilities
const isDevelopment = import.meta.env.DEV;

export const debug = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },
  
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
  
  table: (data: any) => {
    if (isDevelopment && console.table) {
      console.table(data);
    }
  },
  
  time: (label: string) => {
    if (isDevelopment) {
      console.time(label);
    }
  },
  
  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },
  
  group: (label: string) => {
    if (isDevelopment) {
      console.group(label);
    }
  },
  
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  }
};

// Performance monitoring
export const perf = {
  mark: (name: string) => {
    if (isDevelopment && performance.mark) {
      performance.mark(name);
    }
  },
  
  measure: (name: string, startMark: string, endMark: string) => {
    if (isDevelopment && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        debug.log(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`);
      } catch (e) {
        debug.warn('Performance measurement failed:', e);
      }
    }
  }
};