// Performance monitoring utilities for development
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()
  private observers: PerformanceObserver[] = []

  private constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.setupObservers()
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private setupObservers() {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn('Long task detected:', {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime
            })
          }
        }
      })

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.push(longTaskObserver)
      } catch (e) {
        console.warn('Long task observer not supported')
      }
    }
  }

  // Measure component render time
  measureRender(componentName: string, renderFn: () => void) {
    if (typeof window === 'undefined') {
      renderFn()
      return
    }

    const start = performance.now()
    renderFn()
    const end = performance.now()
    
    const duration = end - start
    
    // Store metric
    if (!this.metrics.has(componentName)) {
      this.metrics.set(componentName, [])
    }
    this.metrics.get(componentName)!.push(duration)
    
    // Warn if render is too slow
    if (duration > 16) { // More than one frame at 60fps
      console.warn(`Slow render detected in ${componentName}:`, duration + 'ms')
    }
  }

  // Get performance metrics
  getMetrics(componentName?: string) {
    if (componentName) {
      const metrics = this.metrics.get(componentName) || []
      return {
        count: metrics.length,
        average: metrics.length > 0 ? metrics.reduce((a, b) => a + b, 0) / metrics.length : 0,
        max: metrics.length > 0 ? Math.max(...metrics) : 0,
        min: metrics.length > 0 ? Math.min(...metrics) : 0
      }
    }
    
    const allMetrics: Record<string, any> = {}
    for (const [name, metrics] of this.metrics) {
      allMetrics[name] = {
        count: metrics.length,
        average: metrics.length > 0 ? metrics.reduce((a, b) => a + b, 0) / metrics.length : 0,
        max: metrics.length > 0 ? Math.max(...metrics) : 0,
        min: metrics.length > 0 ? Math.min(...metrics) : 0
      }
    }
    return allMetrics
  }

  // Clear metrics
  clearMetrics(componentName?: string) {
    if (componentName) {
      this.metrics.delete(componentName)
    } else {
      this.metrics.clear()
    }
  }

  // Cleanup
  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.metrics.clear()
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const monitor = PerformanceMonitor.getInstance()
  
  return {
    measureRender: (renderFn: () => void) => monitor.measureRender(componentName, renderFn),
    getMetrics: () => monitor.getMetrics(componentName),
    clearMetrics: () => monitor.clearMetrics(componentName)
  }
}

// HOC for automatic performance monitoring
export const withPerformanceMonitor = <P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) => {
  const WrappedComponent = (props: P) => {
    const monitor = usePerformanceMonitor(componentName || Component.displayName || Component.name)
    
    return monitor.measureRender(() => <Component {...props} />)
  }
  
  WrappedComponent.displayName = `withPerformanceMonitor(${Component.displayName || Component.name})`
  
  return WrappedComponent
}



















