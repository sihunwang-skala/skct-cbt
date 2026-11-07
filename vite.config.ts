import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'

// 개인 문제은행(private/)은 번들에 포함하지 않고, 이 PC(loopback)에서만 런타임에 제공한다.
// → 정적 배포(GitHub Pages 등)를 해도 비공개 문제는 포함되지 않고, 외부 IP 접근은 403.
function privateBank(): Plugin {
  const root = path.resolve('private')
  const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1']
  const mw = (req: any, res: any, next: () => void) => {
    const url = String(req.url ?? '').split('?')[0]
    if (!url.startsWith('/__private/')) return next()
    if (!local.includes(req.socket.remoteAddress)) { res.statusCode = 403; return res.end('forbidden') }
    res.setHeader('Cache-Control', 'no-store')
    if (url === '/__private/bank.json') {
      const dir = path.join(root, 'bank')
      const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')) : []
      const items = files.flatMap((f) => {
        try { const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); return Array.isArray(j) ? j : (j.questions ?? []) } catch { return [{ id: `(${f} 파싱 실패)` }] }
      })
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      return res.end(JSON.stringify(items))
    }
    const m = url.match(/^\/__private\/img\/([\w.-]+)$/)
    const file = m && path.join(root, 'images', m[1])
    if (file && fs.existsSync(file)) {
      res.setHeader('Content-Type', { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[path.extname(file).toLowerCase()] ?? 'application/octet-stream')
      return res.end(fs.readFileSync(file))
    }
    res.statusCode = 404; res.end('not found')
  }
  return { name: 'private-bank', configureServer: (s) => void s.middlewares.use(mw), configurePreviewServer: (s) => void s.middlewares.use(mw) }
}

export default defineConfig({
  plugins: [react(), privateBank()],
  test: { include: ['src/**/*.test.ts'] },
})
