import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const forbidden = (file) => /(^|\/)private\//i.test(file) || /\.(pdf|epub|mobi)$/i.test(file) || /(^|\/)inbox\//i.test(file)
const failures = []

const tracked = git('ls-files').split('\n').filter(Boolean)
const staged = git('diff', '--cached', '--name-only').split('\n').filter(Boolean)
const history = git('log', '--all', '--name-only', '--pretty=format:').split('\n').filter(Boolean)

for (const [label, files] of [['현재 Git index', tracked], ['staging area', staged], ['Git history', history]]) {
  const bad = [...new Set(files.filter(forbidden))]
  if (bad.length) failures.push(`${label}에 비공개 후보 파일 존재: ${bad.join(', ')}`)
}

try {
  execFileSync('git', ['check-ignore', '-q', 'private/.privacy-probe'])
} catch {
  failures.push('private/ 경로가 .gitignore로 보호되지 않음')
}

for (const dir of ['dist', 'build']) {
  if (fs.existsSync(path.join(dir, '__private'))) failures.push(`${dir}/__private가 build 결과에 포함됨`)
}

let hooksPath = ''
try { hooksPath = git('config', '--get', 'core.hooksPath') } catch { /* 미설정 */ }
if (hooksPath !== '.githooks') failures.push(`core.hooksPath가 .githooks가 아님: ${hooksPath || '(미설정)'}`)

if (failures.length) {
  console.error(`개인 문제은행 보호 검사 실패\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log('개인 문제은행 보호 검사 통과: private 자료는 현재 index, staging, history, build에 없습니다.')
