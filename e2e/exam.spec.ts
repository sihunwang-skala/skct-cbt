import { expect, test } from '@playwright/test'

const SAMPLE = 'start-skct-sample'

async function toMath(page: import('@playwright/test').Page) {
  for (let i = 0; i < 2; i++) {
    await page.getByTestId('next').click(); await page.getByTestId('next').click()
    await page.getByTestId('finish-section').click(); await page.getByTestId('confirm-yes').click()
    await page.getByRole('button', { name: '바로 시작' }).click()
  }
}

test.beforeEach(async ({ page }) => { await page.goto('/'); await page.evaluate(() => localStorage.clear()); await page.reload() })

test('start screen → exam screen at 1920x1080 (screenshots)', async ({ page }) => {
  await page.screenshot({ path: 'e2e/shots/00-start.png' })
  await page.getByTestId(SAMPLE).click()
  await expect(page.getByTestId('exam')).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/01-verbal-1920.png' })
  await expect(page.locator('.qpane.wide')).toBeVisible()
  // 스테이지는 1920x1080 비율 유지
  const box = await page.locator('.stage').boundingBox()
  expect(Math.round(box!.width)).toBe(1920); expect(Math.round(box!.height)).toBe(1080)
})

test('layout scales to a laptop viewport without clipping', async ({ page }) => {
  await page.setViewportSize({ width: 1512, height: 860 })
  await page.getByTestId(SAMPLE).click()
  await expect(page.locator('.stage')).toHaveAttribute('data-scale', /^0\.78/) // 리사이즈 반영 대기(플레이키 방지)
  await page.screenshot({ path: 'e2e/shots/02-verbal-1512x860.png' })
  const b = await page.locator('.stage').boundingBox()
  expect(b!.x).toBeGreaterThanOrEqual(-1); expect(b!.y).toBeGreaterThanOrEqual(-1)
  expect(b!.x + b!.width).toBeLessThanOrEqual(1513); expect(b!.y + b!.height).toBeLessThanOrEqual(861)
  await expect(page.getByTestId('next')).toBeInViewport()
})

test('verbal has no tools panel (full-width); other sections have memo/paint + calculator', async ({ page }) => {
  await page.getByTestId(SAMPLE).click()
  await expect(page.locator('.tools')).toHaveCount(0)
  await toMath(page)
  await expect(page.locator('.tools')).toBeVisible()
  await expect(page.getByTestId('calculator')).toBeVisible()
  await page.screenshot({ path: 'e2e/shots/08-math-tools.png' })
})

test('calculator via mouse and keyboard', async ({ page }) => {
  await page.getByTestId(SAMPLE).click()
  await toMath(page)
  const d = page.getByTestId('calc-display')
  for (const k of ['1', '2', '+', '3', '0', '=']) await page.locator(`[data-key="${k}"]`).click()
  await expect(d).toContainText('42')
  await page.locator('[data-key="C"]').click()
  await page.keyboard.type('7*8')
  await page.keyboard.press('Enter')
  await expect(d).toContainText('56')
  await page.keyboard.type('9/4=')
  await expect(d).toContainText('2.25')
})

test('memo & paint usable, persist across questions', async ({ page }) => {
  await page.getByTestId(SAMPLE).click()
  await toMath(page)
  await page.getByTestId('tab-memo').click()
  await page.getByTestId('memo').fill('A>B 3일')
  await page.getByTestId('tab-paint').click()
  const c = page.getByTestId('paint-canvas'); const bb = (await c.boundingBox())!
  await page.mouse.move(bb.x + 30, bb.y + 30); await page.mouse.down(); await page.mouse.move(bb.x + 200, bb.y + 120, { steps: 8 }); await page.mouse.up()
  const painted = await c.evaluate((el: HTMLCanvasElement) => el.getContext('2d')!.getImageData(0, 0, el.width, el.height).data.some((v, i) => i % 4 === 3 && v > 0))
  expect(painted).toBe(true)
  await page.screenshot({ path: 'e2e/shots/03-paint.png' })
  await page.getByTestId('next').click()
  await page.getByTestId('tab-memo').click()
  await expect(page.getByTestId('memo')).toHaveValue('A>B 3일')
})

test('full sample exam: answer, no-back, timer, result, no answers leak', async ({ page }) => {
  await page.getByTestId(SAMPLE).click()
  // 실전 중 정답/해설 비노출
  await expect(page.locator('body')).not.toContainText('해설')
  await page.getByTestId('choice-3').click()
  await page.getByTestId('next').click()
  await expect(page.getByTestId('qno')).toHaveText('2.')
  await expect(page.getByTestId('prev')).toBeDisabled()
  await page.screenshot({ path: 'e2e/shots/04-q2.png' })
  await page.getByTestId('next').click()
  // 첫 영역 종료
  await page.getByTestId('finish-section').click()
  await page.screenshot({ path: 'e2e/shots/05-confirm.png' })
  await page.getByTestId('confirm-yes').click()
  await expect(page.getByTestId('break')).toBeVisible()
  for (let i = 1; i < 5; i++) {
    await page.getByRole('button', { name: '바로 시작' }).click()
    await page.getByTestId('next').click(); await page.getByTestId('next').click()
    if (i === 1) await page.screenshot({ path: 'e2e/shots/06-data-table.png' })
    await page.getByTestId('finish-section').click(); await page.getByTestId('confirm-yes').click()
    if (i < 4) await expect(page.getByTestId('break')).toBeVisible()
  }
  await expect(page.getByTestId('result')).toBeVisible()
  await expect(page.getByTestId('raw')).toContainText('/ 15')
  await page.screenshot({ path: 'e2e/shots/07-result.png' })
})

test('reload mid-exam keeps answers and deadline', async ({ page }) => {
  await page.getByTestId(SAMPLE).click()
  await page.getByTestId('choice-1').click()
  const before = await page.getByTestId('timer').innerText()
  await page.waitForTimeout(1500)
  await page.reload()
  await expect(page.getByTestId('exam')).toBeVisible()
  await expect(page.getByTestId('choice-1')).toHaveClass(/sel/)
  const after = await page.getByTestId('timer').innerText()
  const sec = (t: string) => +t.slice(0, 2) * 60 + +t.slice(3)
  expect(sec(after)).toBeLessThanOrEqual(sec(before) - 1)
})

test('timer expiry auto-advances to next section', async ({ page }) => {
  await page.getByTestId(SAMPLE).click()
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('skct-cbt:session')!)
    s.deadline = Date.now() + 1200
    localStorage.setItem('skct-cbt:session', JSON.stringify(s))
  })
  await page.reload()
  await expect(page.getByTestId('break')).toBeVisible({ timeout: 5000 })
})

test('fullscreen exit warning appears', async ({ page }) => {
  await page.getByTestId(SAMPLE).click()
  await page.evaluate(() => document.dispatchEvent(new Event('fullscreenchange')))
  await expect(page.getByTestId('fs-warning')).toBeVisible()
})

test('home button returns to start after confirm, and cancel keeps exam', async ({ page }) => {
  await page.getByTestId(SAMPLE).click()
  await page.getByTestId('choice-0').click()
  await page.getByTestId('home').click()
  await page.getByRole('button', { name: '계속 풀기' }).click()
  await expect(page.getByTestId('choice-0')).toHaveClass(/sel/)
  await page.getByTestId('home').click()
  await page.getByTestId('home-yes').click()
  await expect(page.getByTestId('start')).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('start')).toBeVisible() // 세션이 남지 않음
})

test('timer digits do not shift layout as time changes', async ({ page }) => {
  await page.getByTestId(SAMPLE).click()
  const pos = async () => page.evaluate(() => {
    const r = (e: Element) => e.getBoundingClientRect().left
    return [...document.querySelectorAll('[data-testid=timer] span')].map(r).concat(r(document.querySelector('.topbar .timer')!))
  })
  const a = await pos()
  await page.waitForTimeout(1300)
  const b = await pos()
  expect(b).toEqual(a)
  // 숫자 폭이 달라지는 시각(11:11 vs 04:00)에서도 동일 폭
  const w = await page.evaluate(() => (document.querySelector('[data-testid=timer]') as HTMLElement).offsetWidth)
  expect(w).toBe(140)
})

test('focus mode filters a subtype and starts only matching questions', async ({ page }) => {
  await page.getByTestId('mode-focus').click()
  await page.getByLabel('농도').check()
  await page.getByTestId('focus-count').fill('1')
  await page.getByTestId('focus-seed').fill('repeatable-set')
  await expect(page.getByTestId('focus-available')).toHaveText('1')
  await page.getByTestId('start-focus').click()
  await expect(page.getByTestId('exam')).toBeVisible()
  const ids = await page.evaluate(() => JSON.parse(localStorage.getItem('skct-cbt:session')!).sectionQuestions)
  expect(ids).toEqual([['M-002']])
})
