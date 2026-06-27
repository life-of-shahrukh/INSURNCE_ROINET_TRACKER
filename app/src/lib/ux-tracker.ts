/**
 * Lightweight UX telemetry SDK.
 * Captures clicks, hover-dwell, scroll depth, rage/dead clicks,
 * page views, and form interactions — buffers events and flushes
 * in batches to the backend telemetry endpoint.
 */

export type UxEventType =
  | 'pageview'
  | 'click'
  | 'hover_dwell'
  | 'scroll_depth'
  | 'rage_click'
  | 'dead_click'
  | 'form_focus'
  | 'form_blur';

export interface UxEvent {
  type: UxEventType;
  timestamp: number;
  page: string;
  target?: string;
  targetText?: string;
  meta?: Record<string, unknown>;
}

export interface UxIdentity {
  userId: string;
  role: string;
  pospId: string | null;
}

interface UxTrackerConfig {
  endpoint: string;
  flushIntervalMs: number;
  batchSize: number;
  hoverDwellThresholdMs: number;
  rageClickThreshold: number;
  rageClickWindowMs: number;
}

const DEFAULT_CONFIG: UxTrackerConfig = {
  endpoint: '/api/telemetry/events',
  flushIntervalMs: 5_000,
  batchSize: 20,
  hoverDwellThresholdMs: 1_500,
  rageClickThreshold: 3,
  rageClickWindowMs: 1_500,
};

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="button"], [tabindex]';
const SCROLL_THRESHOLDS = [25, 50, 75, 100];

function getSelector(el: Element): string {
  if (el.id) return `#${el.id}`;
  const tag = el.tagName.toLowerCase();
  const cls = Array.from(el.classList).slice(0, 3).join('.');
  const testId = el.getAttribute('data-testid');
  const ariaLabel = el.getAttribute('aria-label');
  if (testId) return `${tag}[data-testid="${testId}"]`;
  if (ariaLabel) return `${tag}[aria-label="${ariaLabel}"]`;
  return cls ? `${tag}.${cls}` : tag;
}

function sanitiseText(text: string | null | undefined): string | undefined {
  if (!text) return undefined;
  return text.trim().replace(/\d/g, '*').slice(0, 50) || undefined;
}

export class UxTracker {
  private buffer: UxEvent[] = [];
  private identity: UxIdentity | null = null;
  private readonly config: UxTrackerConfig;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  // Rage-click tracking state
  private lastClickTarget: string | null = null;
  private clickTimestamps: number[] = [];

  // Scroll depth tracking state
  private readonly scrollThresholdsReached = new Set<number>();
  private currentPage: string = '';

  // Hover tracking state
  private hoverTarget: Element | null = null;
  private hoverStart = 0;

  // Bound handlers for cleanup
  private readonly handleClick = this.onClickEvent.bind(this);
  private readonly handleMouseEnter = this.onMouseEnter.bind(this);
  private readonly handleMouseLeave = this.onMouseLeave.bind(this);
  private readonly handleScroll = this.onScroll.bind(this);
  private readonly handleFocusIn = this.onFocusIn.bind(this);
  private readonly handleFocusOut = this.onFocusOut.bind(this);
  private readonly handleVisibilityChange = this.onVisibilityChange.bind(this);

  constructor(config?: Partial<UxTrackerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  identify(identity: UxIdentity): void {
    this.identity = identity;
  }

  start(): void {
    if (this.running || typeof globalThis.window === 'undefined') return;
    this.running = true;
    this.currentPage = globalThis.location.pathname;

    document.addEventListener('click', this.handleClick, { capture: true, passive: true });
    document.addEventListener('mouseover', this.handleMouseEnter, { passive: true });
    document.addEventListener('mouseout', this.handleMouseLeave, { passive: true });
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    document.addEventListener('focusin', this.handleFocusIn, { passive: true });
    document.addEventListener('focusout', this.handleFocusOut, { passive: true });
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.flushTimer = setInterval(() => this.flush(), this.config.flushIntervalMs);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;

    document.removeEventListener('click', this.handleClick, { capture: true });
    document.removeEventListener('mouseover', this.handleMouseEnter);
    document.removeEventListener('mouseout', this.handleMouseLeave);
    window.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('focusin', this.handleFocusIn);
    document.removeEventListener('focusout', this.handleFocusOut);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }

  trackPageView(pathname: string): void {
    if (pathname === this.currentPage) return;
    this.currentPage = pathname;
    this.scrollThresholdsReached.clear();
    this.push({ type: 'pageview', timestamp: Date.now(), page: pathname });
  }

  push(event: UxEvent): void {
    this.buffer.push(event);
    if (this.buffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  private flush(): void {
    if (this.buffer.length === 0 || !this.identity) return;

    const payload = {
      identity: this.identity,
      events: [...this.buffer],
    };
    this.buffer = [];

    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(this.config.endpoint, blob);
    } else {
      fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
        credentials: 'include',
      }).catch(() => { /* telemetry loss is acceptable */ });
    }
  }

  // ─── Event Handlers ─────────────────────────────────────────────────────

  private onClickEvent(e: MouseEvent): void {
    const target = e.target as Element | null;
    if (!target) return;

    const selector = getSelector(target);
    const now = Date.now();

    // Rage click detection
    if (selector === this.lastClickTarget) {
      this.clickTimestamps.push(now);
      this.clickTimestamps = this.clickTimestamps.filter(
        (t) => now - t < this.config.rageClickWindowMs,
      );
      if (this.clickTimestamps.length >= this.config.rageClickThreshold) {
        this.push({
          type: 'rage_click',
          timestamp: now,
          page: this.currentPage,
          target: selector,
          targetText: sanitiseText(target.textContent),
          meta: { count: this.clickTimestamps.length },
        });
        this.clickTimestamps = [];
        return;
      }
    } else {
      this.lastClickTarget = selector;
      this.clickTimestamps = [now];
    }

    // Dead click detection
    const isInteractive = target.closest(INTERACTIVE_SELECTOR) !== null;
    if (!isInteractive) {
      this.push({
        type: 'dead_click',
        timestamp: now,
        page: this.currentPage,
        target: selector,
        targetText: sanitiseText(target.textContent),
      });
      return;
    }

    // Normal click
    this.push({
      type: 'click',
      timestamp: now,
      page: this.currentPage,
      target: selector,
      targetText: sanitiseText(target.textContent),
    });
  }

  private onMouseEnter(e: MouseEvent): void {
    const target = e.target as Element | null;
    if (!target || target === this.hoverTarget) return;
    this.hoverTarget = target;
    this.hoverStart = Date.now();
  }

  private onMouseLeave(e: MouseEvent): void {
    const target = e.target as Element | null;
    if (!target || target !== this.hoverTarget) return;

    const dwell = Date.now() - this.hoverStart;
    if (dwell >= this.config.hoverDwellThresholdMs) {
      this.push({
        type: 'hover_dwell',
        timestamp: this.hoverStart,
        page: this.currentPage,
        target: getSelector(target),
        targetText: sanitiseText(target.textContent),
        meta: { dwellMs: dwell },
      });
    }
    this.hoverTarget = null;
  }

  private scrollDebounce: ReturnType<typeof setTimeout> | null = null;

  private onScroll(): void {
    if (this.scrollDebounce) return;
    this.scrollDebounce = setTimeout(() => {
      this.scrollDebounce = null;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const pct = Math.round((scrollTop / docHeight) * 100);

      for (const threshold of SCROLL_THRESHOLDS) {
        if (pct >= threshold && !this.scrollThresholdsReached.has(threshold)) {
          this.scrollThresholdsReached.add(threshold);
          this.push({
            type: 'scroll_depth',
            timestamp: Date.now(),
            page: this.currentPage,
            meta: { depth: threshold },
          });
        }
      }
    }, 300);
  }

  private onFocusIn(e: FocusEvent): void {
    const target = e.target as HTMLElement | null;
    if (!target || !this.isFormElement(target)) return;

    const fieldName = this.getFieldName(target);
    this.push({
      type: 'form_focus',
      timestamp: Date.now(),
      page: this.currentPage,
      target: getSelector(target),
      meta: { fieldName },
    });
  }

  private readonly focusOutTimers = new WeakMap<Element, number>();

  private onFocusOut(e: FocusEvent): void {
    const target = e.target as HTMLElement | null;
    if (!target || !this.isFormElement(target)) return;

    const fieldName = this.getFieldName(target);
    this.push({
      type: 'form_blur',
      timestamp: Date.now(),
      page: this.currentPage,
      target: getSelector(target),
      meta: { fieldName },
    });
  }

  private onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      this.flush();
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  private isFormElement(el: HTMLElement): boolean {
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'select' || tag === 'textarea';
  }

  private getFieldName(el: HTMLElement): string {
    return (
      el.getAttribute('name') ??
      el.getAttribute('aria-label') ??
      el.getAttribute('placeholder') ??
      getSelector(el)
    );
  }
}
