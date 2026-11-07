import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const f = path.resolve('private/bank/_e2e.json')
test.afterEach(() => { try { fs.unlinkSync(f) } catch { /* */ } })

test('private bank loads at runtime from local server and isolates unverified items', async ({ page, request }) => {
  fs.writeFileSync(f, JSON.stringify([
    { id: 'E2E-1', section: 'math', stem: '2+3=?', choices: ['4', '5', '6', '7', '8'], answer: 1, verification: 'manual' },
    { id: 'E2E-2', section: 'math', stem: '정답 없음', choices: ['a', 'b', 'c', 'd', 'e'] },
    { id: 'E2E-3', section: 'bad', stem: 'x', choices: [] },
  ]))
  await page.goto('/')
  await expect(page.getByTestId('bank-info')).toContainText('2문항 로드')
  await expect(page.getByTestId('bank-info')).toContainText('검증 대기 1문항')
  await expect(page.getByTestId('bank-info')).toContainText('오류 1건')
  // 번들에는 포함되지 않음
  const js = await (await request.get('/')).text()
  expect(js).not.toContain('E2E-1')
})
