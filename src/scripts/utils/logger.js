import CONFIG from '../config';

export const logger = {
  info: (message, data) => {
    if (CONFIG.DEBUG_MODE) {
      console.log(`%c[INFO] ${message}`, 'color: blue', data || '');
    }
  },
  
  error: (message, error) => {
    console.error(`%c[ERROR] ${message}`, 'color: red', error || '');
  },
  
  warn: (message, data) => {
    if (CONFIG.DEBUG_MODE) {
      console.warn(`%c[WARN] ${message}`, 'color: orange', data || '');
    }
  },
  
  debug: (message, data) => {
    if (CONFIG.DEBUG_MODE) {
      console.log(`%c[DEBUG] ${message}`, 'color: green', data || '');
    }
  },
  
  network: (method, url, params) => {
    if (CONFIG.DEBUG_MODE) {
      console.log(
        `%c[NETWORK] ${method} ${url}`, 
        'color: purple', 
        params || ''
      );
    }
  },
  
  timer: (label) => {
    if (CONFIG.DEBUG_MODE) {
      console.time(label);
      return {
        end: () => console.timeEnd(label)
      };
    }
    return { end: () => {} };
  },
  
  // For performance monitoring
  measure: (name, callback) => {
    if (!CONFIG.DEBUG_MODE) {
      return callback();
    }
    
    const startTime = performance.now();
    const result = callback();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`%c[PERFORMANCE] ${name}: ${duration.toFixed(2)}ms`, 'color: magenta');
    
    return result;
  },
  
  // Group related logs
  group: (label, callback) => {
    if (!CONFIG.DEBUG_MODE) {
      return callback();
    }
    
    console.group(`%c${label}`, 'font-weight: bold');
    const result = callback();
    console.groupEnd();
    
    return result;
  }
};