import express from 'express';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  generateComment,
  generateCompetencyBatchRecommendation,
  generateParentMessage,
  generateClassSummary,
  generateClassMeetingPlan,
  askAIAssistant,
  generateBirthdayWish,
  generateDesignedImageArtwork,
} from './src/server/aiEndpoints.ts';
import {
  requireFirebaseAuth,
  requireResourceOwnership,
} from './src/server/authMiddleware.ts';
import type { AuthenticatedRequest } from './src/server/authMiddleware.ts';
import { antiDdosShield } from './src/server/antiDdosShield.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// AI Studio Dev Server must run on port 3000 (ignore process.env.PORT which Cloud Run sets to 8080)
function resolvePort(): number {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const p = parseInt(process.argv[portArgIdx + 1], 10);
    if (!isNaN(p)) return p;
  }
  return 3000;
}
const PORT = resolvePort();

// ============================================================================
// 1. CLOUD PROXY & SECURITY HARDENING
// ============================================================================

// Critical for Cloud Run / GCP Load Balancers: Trust first hop reverse proxy
// to accurately resolve req.ip and req.protocol
app.set('trust proxy', 1);

// Prevent software fingerprinting
app.disable('x-powered-by');

// Anti-DDoS, L7 Flood Throttling & Hacker Intrusion Defense Shield
app.use(antiDdosShield.middleware());

// Response compression: only on /api in dev to avoid interfering with Vite middlewares, globally in prod
if (process.env.NODE_ENV === 'production') {
  app.use(compression());
} else {
  app.use('/api', compression());
}

// Defense-in-depth HTTP Headers (allow iframe embedding by Google AI Studio)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.removeHeader('X-Frame-Options');
  next();
});

// Explicit Path Traversal and Hidden File Blocker
app.use((req, res, next) => {
  let decodedPath = '';
  try {
    decodedPath = decodeURIComponent(req.path);
  } catch {
    return res.status(400).json({ error: 'URL không hợp lệ (Malformed URL).', code: 'MALFORMED_URL' });
  }

  // Prevent directory traversal attacks
  if (decodedPath.includes('..')) {
    return res.status(403).json({ error: 'Truy cập bị từ chối (Forbidden path).', code: 'PATH_FORBIDDEN' });
  }

  // Block sensitive hidden files (.env, .git, .ssh, etc.) while allowing Vite internal caches (.vite, .cache)
  const isViteCache = decodedPath.includes('/.vite/') || decodedPath.includes('/.cache/');
  if (!isViteCache && /(^|\/)\.(git|env|config|npmrc|ssh|bash|profile|vscode|idea|DS_Store)/i.test(decodedPath)) {
    return res.status(403).json({ error: 'Truy cập bị từ chối (Forbidden path).', code: 'PATH_FORBIDDEN' });
  }
  next();
});

// Request Timeout Middleware (protects against Slowloris & zombie requests)
app.use((req, res, next) => {
  const timeoutMs = req.path.startsWith('/api/ai') ? 60000 : 20000;
  req.setTimeout(timeoutMs, () => {
    if (!res.headersSent) {
      res.status(504).json({
        error: 'Yêu cầu xử lý quá hạn (Gateway Timeout). Vui lòng thử lại.',
        code: 'GATEWAY_TIMEOUT',
      });
    }
  });
  next();
});

// JSON and URL-encoded body parsers with bounded limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// 2. CONCURRENCY LIMITER WITH BOUNDED QUEUE & REJECTION GUARD
// ============================================================================

interface QueueTask {
  resolve: () => void;
  reject: (err: any) => void;
  timer: NodeJS.Timeout;
  priority: boolean;
}

class ConcurrencyLimiter {
  private activeCount = 0;
  private queue: QueueTask[] = [];
  private readonly maxConcurrent: number;
  private readonly maxQueueSize: number;
  private readonly queueTimeoutMs: number;

  constructor(maxConcurrent = 40, maxQueueSize = 120, queueTimeoutMs = 35000) {
    this.maxConcurrent = maxConcurrent;
    this.maxQueueSize = maxQueueSize;
    this.queueTimeoutMs = queueTimeoutMs;
  }

  async run<T>(fn: () => Promise<T>, priority = false): Promise<T> {
    if (this.activeCount >= this.maxConcurrent) {
      if (this.queue.length >= this.maxQueueSize) {
        const error: any = new Error(
          'Máy chủ AI hiện đang phục vụ khối lượng yêu cầu lớn. Vui lòng thử lại sau giây lát.'
        );
        error.status = 503;
        error.code = 'SERVER_BUSY';
        throw error;
      }

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          const idx = this.queue.findIndex((task) => task.timer === timer);
          if (idx !== -1) {
            this.queue.splice(idx, 1);
            const timeoutError: any = new Error(
              'Hàng đợi xử lý AI bị quá hạn. Vui lòng gửi lại yêu cầu.'
            );
            timeoutError.status = 504;
            timeoutError.code = 'QUEUE_TIMEOUT';
            reject(timeoutError);
          }
        }, this.queueTimeoutMs);

        const task: QueueTask = { resolve, reject, timer, priority };
        if (priority) {
          // Priority tasks (authenticated teachers) jump ahead of guest tasks
          const firstNonPriorityIdx = this.queue.findIndex((t) => !t.priority);
          if (firstNonPriorityIdx === -1) {
            this.queue.push(task);
          } else {
            this.queue.splice(firstNonPriorityIdx, 0, task);
          }
        } else {
          this.queue.push(task);
        }
      });
    }

    this.activeCount++;
    try {
      return await fn();
    } finally {
      this.activeCount--;
      if (this.queue.length > 0) {
        const nextTask = this.queue.shift();
        if (nextTask) {
          clearTimeout(nextTask.timer);
          nextTask.resolve();
        }
      }
    }
  }
}

const aiLimiter = new ConcurrencyLimiter(40, 120, 35000);

// ============================================================================
// 3. RATE LIMITING & SECURITY BARRIER
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_TEACHER_REQUESTS_PER_WINDOW = 60; // 60 req/min for authenticated teachers
const MAX_GUEST_REQUESTS_PER_WINDOW = 25; // 25 req/min for preview users

const rateLimitCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);
if (typeof rateLimitCleanupTimer.unref === 'function') {
  rateLimitCleanupTimer.unref();
}

function aiRateLimiter(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const user = req.user;
  const rateKey = user?.uid
    ? user.isGuest
      ? `guest:${user.uid}`
      : `teacher:${user.uid}`
    : `ip:${req.ip || 'unknown'}`;
  const maxLimit = user?.isGuest ? MAX_GUEST_REQUESTS_PER_WINDOW : MAX_TEACHER_REQUESTS_PER_WINDOW;

  const now = Date.now();
  const record = rateLimitMap.get(rateKey);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(rateKey, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (record.count >= maxLimit) {
    return res.status(429).json({
      error: user?.isGuest
        ? 'Bản dùng thử đã đạt giới hạn tần suất yêu cầu AI (25 lần/phút). Vui lòng đăng nhập tài khoản Google giáo viên để nâng hạn mức.'
        : 'Tài khoản của Thầy/Cô đang gửi nhiều yêu cầu liên tục. Vui lòng thử lại sau 30 giây.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }

  record.count++;
  next();
}

// Chain authentication, tenant authorization, and rate-limiting
app.use('/api/ai', requireFirebaseAuth, requireResourceOwnership, aiRateLimiter);

// ============================================================================
// 4. API ROUTE HANDLERS & AI CACHE
// ============================================================================

interface AiCacheEntry {
  data: any;
  expiresAt: number;
}
const aiResponseCache = new Map<string, AiCacheEntry>();
const aiInFlightMap = new Map<string, Promise<any>>();
const AI_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache for idempotent/identical generation

const aiCacheCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [k, v] of aiResponseCache.entries()) {
    if (now > v.expiresAt) {
      aiResponseCache.delete(k);
    }
  }
}, 2 * 60 * 1000);
if (typeof aiCacheCleanupTimer.unref === 'function') {
  aiCacheCleanupTimer.unref();
}

// High-Order Handler wrapper ensuring zero unhandled rejections and headersSent protection
function createAiRouteHandler(handler: (body: any) => Promise<any>) {
  return async (req: express.Request, res: express.Response) => {
    if (res.headersSent) return;

    const authReq = req as AuthenticatedRequest;
    const isPriorityTeacher = !!(authReq.user && !authReq.user.isGuest);

    // Detect client early disconnect
    let clientDisconnected = false;
    req.on('close', () => {
      clientDisconnected = true;
    });

    const cacheKey = req.path + ':' + JSON.stringify(req.body);
    const cached = aiResponseCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      res.setHeader('X-AI-Cache', 'HIT');
      return res.json(cached.data);
    }

    try {
      let runPromise = aiInFlightMap.get(cacheKey);
      if (!runPromise) {
        runPromise = aiLimiter.run(async () => {
          if (clientDisconnected) {
            throw new Error('CLIENT_DISCONNECTED');
          }
          return await handler(req.body);
        }, isPriorityTeacher);

        aiInFlightMap.set(cacheKey, runPromise);
        runPromise
          .then((resData) => {
            aiResponseCache.set(cacheKey, {
              data: resData,
              expiresAt: Date.now() + AI_CACHE_TTL_MS,
            });
          })
          .catch(() => {})
          .finally(() => {
            aiInFlightMap.delete(cacheKey);
          });
      }

      const result = await runPromise;

      if (!res.headersSent && !clientDisconnected) {
        res.setHeader('X-AI-Cache', 'MISS');
        res.json(result);
      }
    } catch (err: any) {
      if (err.message === 'CLIENT_DISCONNECTED' || res.headersSent || clientDisconnected) {
        return;
      }
      const statusCode = err.status || (err.message?.includes('bận') || err.code === 'SERVER_BUSY' ? 503 : 500);
      res.status(statusCode).json({
        error: err.message || 'Lỗi xử lý AI',
        code: err.code || 'AI_ERROR',
      });
    }
  };
}

// Health check endpoint for Cloud Run and monitoring probes
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Anti-DDoS & Hacker Intrusion Security Telemetry
app.get('/api/security/ddos-status', (_req, res) => {
  res.status(200).json(antiDdosShield.getTelemetry());
});

// Safe DDoS Stress Pentest Simulator for CTO / SecOps verification
app.post('/api/security/ddos-simulation', (req, res) => {
  const result = antiDdosShield.runSimulation(req.body || {});
  res.status(200).json(result);
});

app.post('/api/ai/comment', createAiRouteHandler(generateComment));
app.post('/api/ai/competency-batch', createAiRouteHandler(generateCompetencyBatchRecommendation));
app.post('/api/ai/parent-message', createAiRouteHandler(generateParentMessage));
app.post('/api/ai/class-summary', createAiRouteHandler(generateClassSummary));
app.post('/api/ai/class-meeting', createAiRouteHandler(generateClassMeetingPlan));
app.post('/api/ai/assistant', createAiRouteHandler(askAIAssistant));
app.post('/api/ai/birthday-wish', createAiRouteHandler(generateBirthdayWish));
app.post('/api/ai/image-design', createAiRouteHandler(generateDesignedImageArtwork));

// Explicit 404 for unrecognized API endpoints (Never mask API 404 with HTML SPA fallback)
app.all('/api/*', (_req, res) => {
  res.status(404).json({
    error: 'Endpoint API không tồn tại hoặc đã thay đổi.',
    code: 'API_NOT_FOUND',
  });
});

// ============================================================================
// 5. STATIC ASSETS & SPA ROUTING (DEV & PRODUCTION)
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve hashed assets with aggressive immutable caching, index.html with must-revalidate
    app.use(
      express.static(path.join(__dirname, 'dist'), {
        maxAge: '1y',
        immutable: true,
        index: false,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Unhandled Server Error]', err);
    if (!res.headersSent) {
      res.status(err.status || 500).json({
        error: err.message || 'Lỗi máy chủ nội bộ.',
        code: 'INTERNAL_SERVER_ERROR',
      });
    }
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on 0.0.0.0:${PORT}`);
  });

  // Graceful Shutdown for Cloud Run / Container Lifecycle
  const gracefulShutdown = (signal: string) => {
    console.log(`[Lifecycle] Received ${signal}. Draining active connections...`);
    clearInterval(rateLimitCleanupTimer);
    server.close(() => {
      console.log('[Lifecycle] HTTP server closed gracefully.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('[Lifecycle] Forced termination after 10s timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
