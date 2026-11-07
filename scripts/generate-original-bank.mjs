import fs from 'node:fs'
import path from 'node:path'

const outDir = path.resolve('private/bank')
const outFile = path.join(outDir, 'generated-original.json')
const questions = []

const hash = (value) => [...value].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261)
const shuffle = (items, key) => {
  let state = hash(key)
  const rnd = () => ((state = Math.imul(state ^ (state >>> 15), 1 | state) + 0x6d2b79f5 >>> 0) / 4294967296)
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]] }
  return out
}
const fmt = (n) => Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100)
const choice = (correct, wrong, key) => {
  const values = [...new Set([String(correct), ...wrong.map(String)])]
  if (values.length < 5) throw new Error(`${key}: 선지 중복`)
  const choices = shuffle(values.slice(0, 5), key)
  return { choices, answer: choices.indexOf(String(correct)) }
}
const add = (q, correct, wrong) => {
  const c = choice(correct, wrong, q.id)
  questions.push({
    difficulty: 2, targetSec: 60, explanation: '', fastMethod: '', commonMistake: '',
    source: 'Notion 유형 체계를 반영한 자체 생성 문제', verification: 'script',
    ...q, ...c,
  })
}

// 언어이해: Notion의 내용 일치, 주제, 추론, 비판 유형을 원문 복제 없이 새 지문으로 생성한다.
for (let i = 1; i <= 10; i++) {
  const year = 2020 + i
  add({ id: `GV-MATCH-${i}`, section: 'verbal', subtype: '내용 일치/불일치', targetSec: 65, verification: 'manual',
    stem: '다음 글의 내용과 일치하지 않는 것은?',
    passage: `해솔시는 ${year}년에 공공 자전거를 시범 도입했다. 첫해에는 중심가 ${100 + i * 10}곳에 대여소를 설치했고, 다음 해에는 주거 지역으로 운영 범위를 넓혔다. 이용 건수는 늘었지만 모든 지역에서 증가율이 같지는 않았다. 시는 이용률이 낮은 지역의 대여소를 없애기보다 버스 정류장 가까이 옮기기로 했다.`,
    explanation: '시는 이용률이 낮은 대여소를 폐쇄하지 않고 위치를 조정하기로 했다.',
    fastMethod: '선지의 시점, 범위, 조치가 지문과 같은지 대조한다.', commonMistake: '이용률이 낮다는 사실을 폐쇄 결정으로 확대 해석한다.',
  }, '이용률이 낮은 대여소는 모두 폐쇄하기로 했다.', [
    `공공 자전거는 ${year}년에 시범 도입되었다.`, '운영 범위는 다음 해 주거 지역까지 확대되었다.', '지역별 이용 증가율은 서로 달랐다.', '일부 대여소는 버스 정류장 가까이 옮길 계획이다.',
  ])

  add({ id: `GV-MAIN-${i}`, section: 'verbal', subtype: '중심 주장/주제', targetSec: 55, verification: 'manual',
    stem: '다음 글의 주제로 가장 적절한 것은?',
    passage: `조직이 새 협업 도구를 도입하면 메시지 전달 속도는 빨라질 수 있다. 그러나 업무 기준과 책임 범위가 불명확하면 메시지만 늘고 의사결정은 오히려 늦어진다. 따라서 협업 성과를 높이려면 도구 도입과 함께 의사결정 규칙을 설계해야 한다. 사례 ${i}에서도 규칙을 먼저 정한 팀의 처리 시간이 더 짧았다.`,
    explanation: '마지막 결론은 도구와 함께 의사결정 규칙을 설계해야 한다는 것이다.',
    fastMethod: '그러나 이후의 문제 제기와 따라서 이후의 결론을 연결한다.', commonMistake: '도구의 장점만 보고 첫 문장을 주제로 고른다.',
  }, '협업 도구와 의사결정 규칙을 함께 설계해야 한다.', ['협업 도구는 모든 의사결정을 자동화한다.', '메시지가 많을수록 조직 성과가 높아진다.', '협업 도구의 가격을 낮추어야 한다.', '모든 팀은 같은 업무 기준을 사용해야 한다.'])

  add({ id: `GV-INFER-${i}`, section: 'verbal', subtype: '추론', targetSec: 70, verification: 'manual',
    stem: '다음 글에서 추론할 수 있는 내용으로 가장 적절한 것은?',
    passage: `한 온라인 상점은 상품 설명을 짧게 바꾼 뒤 구매 전환율이 ${10 + i}%에서 ${12 + i}%로 높아졌다. 같은 기간 배송비 할인 행사도 진행되었다. 두 변화가 동시에 일어났기 때문에 설명 축소만으로 전환율 상승 전체를 설명할 수는 없다.`,
    explanation: '설명 변경과 할인 행사가 동시에 있었으므로 단일 원인의 효과를 분리해 확인해야 한다.',
    fastMethod: '동시에 변한 요인이 둘 이상이면 단일 인과를 확정하지 않는다.', commonMistake: '시간적 선후만 보고 설명 축소가 상승의 유일한 원인이라고 단정한다.',
  }, '설명 축소의 효과를 알려면 다른 요인을 통제한 비교가 필요하다.', ['설명 축소가 전환율 상승의 유일한 원인이다.', '배송비 할인은 전환율에 영향을 줄 수 없다.', '전환율은 앞으로 반드시 계속 상승한다.', '상품 설명이 길수록 항상 구매가 늘어난다.'])

  add({ id: `GV-CRIT-${i}`, section: 'verbal', subtype: '비판/반박', targetSec: 70, verification: 'manual',
    stem: `주장: "표본 ${20 + i}명이 새 학습법에 만족했으므로 모든 학습자에게 기존 방법보다 효과적이다." 이 주장에 대한 가장 적절한 비판은?`,
    explanation: '작은 표본의 만족도를 전체 집단의 학습 효과로 일반화했다.',
    fastMethod: '표본에서 모집단으로 확대되는 부분과 만족도에서 효과로 지표가 바뀌는 부분을 찾는다.', commonMistake: '주장과 무관한 비용이나 유행 여부를 비판한다.',
  }, '표본의 만족도만으로 전체 학습자의 학습 효과를 일반화할 수 없다.', ['새 학습법은 기존 방법보다 비용이 많이 들 수 있다.', '모든 학습자는 새로운 방법을 싫어한다.', '만족도는 언제나 학습 효과와 완전히 같다.', '표본 수가 적으면 어떤 조사도 실시할 수 없다.'])
}

// 자료해석
for (let i = 1; i <= 10; i++) {
  const bases = [200 + i * 10, 160 + i * 8, 300 + i * 5]
  const rates = [10, 20, 5]
  const after = bases.map((v, j) => Math.round(v * (1 + rates[j] / 100)))
  add({ id: `GD-GROWTH-${i}`, section: 'data', subtype: '증가율 비교', targetSec: 65,
    stem: '다음 표에서 전년 대비 금년 값의 증가율이 가장 큰 지역은?',
    table: { caption: '지역별 이용 건수', unit: '(단위: 건)', header: ['지역', '전년', '금년'], rows: [['A', fmt(bases[0]), fmt(after[0])], ['B', fmt(bases[1]), fmt(after[1])], ['C', fmt(bases[2]), fmt(after[2])]] },
    explanation: '증가량이 아니라 증가량을 전년 값으로 나눈 증가율을 비교하면 B가 20%로 가장 크다.',
    fastMethod: '각 증가분을 기준값으로 약분해 10%, 20%, 5%를 비교한다.', commonMistake: '증가량만 비교한다.',
  }, 'B', ['A', 'C', 'A와 B가 같다', 'B와 C가 같다'])

  const total = 400 + i * 20, old = total / 4, newer = total * 0.3
  add({ id: `GD-PP-${i}`, section: 'data', subtype: '비중/%p', targetSec: 70,
    stem: '전체에서 B가 차지하는 비중은 전년보다 금년에 몇 %p 변했는가?',
    table: { caption: 'B 항목과 전체', unit: '(단위: 명)', header: ['구분', 'B', '전체'], rows: [['전년', fmt(old), fmt(total)], ['금년', fmt(newer), fmt(total)]] },
    explanation: '전년 25%, 금년 30%이므로 5%p 증가했다.', fastMethod: '전체가 같으므로 B의 증가분을 전체로 나눈다.', commonMistake: 'B 자체의 증가율 20%와 비중 차이 5%p를 혼동한다.',
  }, '5%p 증가', ['5% 증가', '20%p 증가', '20% 증가', '5%p 감소'])

  const base = 90 + i * 2, values = [base - 15, base - 5, base + 5, base + 15]
  add({ id: `GD-MEAN-${i}`, section: 'data', subtype: '평균/합계', targetSec: 55,
    stem: '다음 네 팀의 평균 실적은?',
    table: { caption: '팀별 실적', unit: '(단위: 건)', header: ['A', 'B', 'C', 'D'], rows: [values.map(fmt)] },
    explanation: `값들이 ${base}을 중심으로 대칭이므로 평균은 ${base}이다.`, fastMethod: '기준값에서 벗어난 편차의 합이 0인지 본다.', commonMistake: '합계를 구하는 과정에서 부호를 빠뜨린다.',
  }, fmt(base), [fmt(base - 10), fmt(base - 5), fmt(base + 5), fmt(base + 10)])

  const part = 180 + i * 9, pct = 18
  const totalReverse = part / (pct / 100)
  add({ id: `GD-REVERSE-${i}`, section: 'data', subtype: '비율 역산', targetSec: 60,
    stem: `전체의 ${pct}%가 ${part}명일 때 전체 인원은?`, explanation: `전체를 T라 하면 0.18T=${part}이므로 T=${fmt(totalReverse)}이다.`,
    fastMethod: '부분을 비율의 소수 표현으로 나눈다.', commonMistake: '부분에 비율을 다시 곱한다.',
  }, fmt(totalReverse), [fmt(totalReverse - 100), fmt(totalReverse - 50), fmt(totalReverse + 50), fmt(totalReverse + 100)])
}

// 창의수리
const speedPairs = [[40, 60], [30, 60], [60, 90], [50, 75], [48, 72]]
for (let i = 1; i <= 10; i++) {
  const [a, b] = speedPairs[(i - 1) % speedPairs.length]
  const avg = (2 * a * b) / (a + b)
  add({ id: `GM-SPEED-${i}`, section: 'math', subtype: '거리/속력/시간', targetSec: 65,
    stem: `같은 거리를 갈 때 시속 ${a}km, 돌아올 때 시속 ${b}km로 이동했다. 왕복 평균 속력은?`, explanation: `같은 거리 왕복 평균은 조화평균 2ab/(a+b)=${fmt(avg)}km/h이다.`,
    fastMethod: '같은 거리의 평균 속력은 산술평균이 아니라 2ab/(a+b)다.', commonMistake: `${a}와 ${b}의 산술평균을 고른다.`,
  }, `${fmt(avg)}km/h`, [`${fmt((a + b) / 2)}km/h`, `${fmt(avg - 4)}km/h`, `${fmt(avg + 4)}km/h`, `${fmt(avg + 8)}km/h`])

  const mass = 180 + i * 20, current = 0.1, target = 0.2, salt = mass * current
  const added = (target * mass - salt) / (1 - target)
  add({ id: `GM-MIX-${i}`, section: 'math', subtype: '농도', targetSec: 80,
    stem: `농도 10%의 소금물 ${mass}g에 소금을 더 넣어 농도 20%로 만들려 한다. 넣을 소금은 몇 g인가?`, explanation: `(${fmt(salt)}+x)/(${mass}+x)=0.2를 풀면 x=${fmt(added)}g이다.`,
    fastMethod: `물 ${fmt(mass - salt)}g은 최종 소금물의 80%다.`, commonMistake: '전체 질량이 변하는데도 원래 질량에 농도 차이만 곱한다.',
  }, `${fmt(added)}g`, [`${fmt(added - 10)}g`, `${fmt(added - 5)}g`, `${fmt(added + 5)}g`, `${fmt(added + 10)}g`])

  const daysA = 6 + i, daysB = daysA * 2, together = (daysA * daysB) / (daysA + daysB)
  add({ id: `GM-WORK-${i}`, section: 'math', subtype: '작업량/일률', targetSec: 70,
    stem: `A는 혼자 ${daysA}일, B는 혼자 ${daysB}일 걸리는 일을 함께 하면 며칠이 걸리는가?`, explanation: `하루 일률은 1/${daysA}+1/${daysB}이므로 걸리는 시간은 ${fmt(together)}일이다.`,
    fastMethod: '두 작업자의 하루 일률을 더한 뒤 역수를 취한다.', commonMistake: '두 날짜의 산술평균을 구한다.',
  }, `${fmt(together)}일`, [`${fmt(together - 1)}일`, `${fmt(together + 1)}일`, `${fmt(daysA)}일`, `${fmt((daysA + daysB) / 2)}일`])

  const cost = 8000 + i * 1000, price = cost * 1.25, sale = price * 0.8
  add({ id: `GM-PRICE-${i}`, section: 'math', subtype: '금액/할인', targetSec: 65,
    stem: `원가 ${cost.toLocaleString()}원인 상품에 25% 이익을 붙여 정가를 정한 뒤 정가에서 20% 할인했다. 판매가는?`, explanation: `${cost.toLocaleString()}×1.25×0.8=${sale.toLocaleString()}원이다.`,
    fastMethod: '1.25×0.8=1이므로 판매가는 원가와 같다.', commonMistake: '25%-20%=5% 이익이라고 단순 차감한다.',
  }, `${sale.toLocaleString()}원`, [`${(sale * 0.8).toLocaleString()}원`, `${(sale * 0.95).toLocaleString()}원`, `${(sale * 1.05).toLocaleString()}원`, `${price.toLocaleString()}원`])
}

// 언어추리
for (let i = 1; i <= 10; i++) {
  const letters = ['A', 'B', 'C', 'D'].map((x) => `${x}${i}`)
  add({ id: `GR-PROP-${i}`, section: 'reasoning', subtype: '명제', targetSec: 65,
    stem: '다음 명제가 모두 참일 때 반드시 참인 것은?', conditions: [`모든 ${letters[0]}는 ${letters[1]}이다.`, `모든 ${letters[1]}는 ${letters[2]}이다.`, `어떤 ${letters[3]}는 ${letters[0]}이다.`],
    explanation: `${letters[0]}가 ${letters[1]}에, ${letters[1]}가 ${letters[2]}에 포함되므로 일부 ${letters[3]}는 ${letters[2]}이다.`, fastMethod: '포함관계를 연속해서 연결한다.', commonMistake: '일부를 전부로 확대한다.',
  }, `어떤 ${letters[3]}는 ${letters[2]}이다.`, [`모든 ${letters[3]}는 ${letters[2]}이다.`, `모든 ${letters[2]}는 ${letters[0]}이다.`, `어떤 ${letters[2]}도 ${letters[1]}가 아니다.`, `모든 ${letters[1]}는 ${letters[0]}이다.`])

  const people = ['가', '나', '다', '라', '마'].map((x) => `${x}${i}`)
  add({ id: `GR-ORDER-${i}`, section: 'reasoning', subtype: '순위/줄세우기', targetSec: 75,
    stem: '다섯 명의 순서에 관한 조건이 다음과 같을 때 3번째 사람은?', conditions: [`${people[0]}는 ${people[1]}보다 앞선다.`, `${people[1]}는 ${people[2]}보다 앞선다.`, `${people[2]}는 ${people[3]}보다 앞선다.`, `${people[3]}는 ${people[4]}보다 앞선다.`],
    explanation: `조건을 연결하면 ${people.join(' > ')} 순서다.`, fastMethod: '짧은 조건을 하나의 긴 chain으로 연결한다.', commonMistake: '앞선다의 방향을 반대로 적는다.',
  }, people[2], [people[0], people[1], people[3], people[4]])

  add({ id: `GR-CONTRA-${i}`, section: 'reasoning', subtype: '조건명제/대우', targetSec: 55,
    stem: `명제 "${people[0]}가 참석하면 ${people[1]}도 참석한다"가 참일 때 반드시 참인 것은?`,
    explanation: 'P이면 Q의 대우는 Q가 아니면 P가 아니다.', fastMethod: '앞뒤를 바꾸고 둘 다 부정한다.', commonMistake: '역인 Q이면 P를 정답으로 고른다.',
  }, `${people[1]}가 참석하지 않으면 ${people[0]}도 참석하지 않는다.`, [`${people[1]}가 참석하면 ${people[0]}도 참석한다.`, `${people[0]}가 참석하지 않으면 ${people[1]}도 참석하지 않는다.`, `두 사람은 항상 함께 참석한다.`, `${people[1]}가 참석하지 않아도 ${people[0]}는 반드시 참석한다.`])

  add({ id: `GR-TRUTH-${i}`, section: 'reasoning', subtype: '진실과 거짓', targetSec: 80,
    stem: '갑, 을, 병 중 범인은 한 명이고 범인만 거짓말한다. 범인은?', conditions: ['갑: "범인은 을이다."', '을: "나는 범인이 아니다."', '병: "갑은 범인이 아니다."'],
    explanation: '갑을 범인으로 두면 갑의 말만 거짓이고 을과 병의 말은 참이 되어 조건을 만족한다.', fastMethod: '각 사람을 범인으로 한 번씩 가정해 거짓말 수를 센다.', commonMistake: '진술 내용만 보고 말한 사람과 범인을 연결하지 않는다.',
  }, '갑', ['을', '병', '범인이 없다', '알 수 없다'])
}

// 수열추리
for (let i = 1; i <= 8; i++) {
  const start = 2 + i, d = 2 + (i % 4), seq = Array.from({ length: 6 }, (_, k) => start + d * k), next = start + d * 6
  add({ id: `GS-ARITH-${i}`, section: 'sequence', subtype: '등차수열', difficulty: 1, targetSec: 30,
    stem: '다음 수열의 빈칸에 들어갈 수는?', conditions: [`${seq.join(', ')}, ( )`], explanation: `매번 ${d}씩 증가하므로 다음 수는 ${next}이다.`, fastMethod: '인접한 두 항의 차이를 두 번 확인한다.', commonMistake: '마지막 차이만 보고 규칙을 확정한다.',
  }, fmt(next), [fmt(next - d - 1), fmt(next - 1), fmt(next + 1), fmt(next + d)])

  const a = 1 + i, r = 2 + (i % 2), geo = Array.from({ length: 5 }, (_, k) => a * r ** k), geoNext = a * r ** 5
  add({ id: `GS-GEO-${i}`, section: 'sequence', subtype: '등비수열', difficulty: 1, targetSec: 30,
    stem: '다음 수열의 빈칸에 들어갈 수는?', conditions: [`${geo.join(', ')}, ( )`], explanation: `매번 ${r}배이므로 다음 수는 ${geoNext}이다.`, fastMethod: '인접 항의 비를 확인한다.', commonMistake: '차이가 커지는 계차수열로 복잡하게 푼다.',
  }, fmt(geoNext), [fmt(geoNext / r), fmt(geoNext - r), fmt(geoNext + r), fmt(geoNext * r)])

  const x = 2 + i, plus = 1 + (i % 3), mult = 2, alt = [x]
  for (let k = 0; k < 6; k++) alt.push(k % 2 === 0 ? alt[k] + plus : alt[k] * mult)
  const altNext = alt[6] + plus
  add({ id: `GS-ALT-${i}`, section: 'sequence', subtype: '교대 연산', targetSec: 40,
    stem: '다음 수열의 빈칸에 들어갈 수는?', conditions: [`${alt.join(', ')}, ( )`], explanation: `+${plus}, ×${mult}가 교대로 반복되므로 다음은 +${plus}이다.`, fastMethod: '연산 두 개가 번갈아 반복되는지 본다.', commonMistake: '직전 곱셈을 한 번 더 적용한다.',
  }, fmt(altNext), [fmt(alt[6] * mult), fmt(altNext - 1), fmt(altNext + 1), fmt(altNext + plus + 3)])

  const f = [i, i + 2]
  while (f.length < 7) f.push(f.at(-1) + f.at(-2))
  add({ id: `GS-FIB-${i}`, section: 'sequence', subtype: '피보나치형', targetSec: 35,
    stem: '다음 수열의 빈칸에 들어갈 수는?', conditions: [`${f.slice(0, 6).join(', ')}, ( )`], explanation: `앞의 두 항을 더하므로 ${f[4]}+${f[5]}=${f[6]}이다.`, fastMethod: '세 번째 항부터 앞 두 항의 합인지 두 번 확인한다.', commonMistake: '단순 계차 규칙으로 본다.',
  }, fmt(f[6]), [fmt(f[6] - 2), fmt(f[6] - 1), fmt(f[6] + 1), fmt(f[6] + 2)])

  const odd0 = i, even0 = 20 + i, mixed = []
  for (let k = 0; k < 4; k++) mixed.push(odd0 + 3 * k, even0 + 5 * k)
  const oddNext = odd0 + 12
  add({ id: `GS-ODDEVEN-${i}`, section: 'sequence', subtype: '홀수항/짝수항 분리', targetSec: 45,
    stem: '다음 수열의 빈칸에 들어갈 수는?', conditions: [`${mixed.join(', ')}, ( )`], explanation: `홀수 번째 항은 ${odd0}에서 3씩, 짝수 번째 항은 ${even0}에서 5씩 증가한다. 빈칸은 홀수 번째이므로 ${oddNext}이다.`, fastMethod: '증가와 감소가 번갈아 보이면 홀수항과 짝수항을 분리한다.', commonMistake: '전체 항 사이의 차이만 본다.',
  }, fmt(oddNext), [fmt(oddNext - 3), fmt(oddNext - 1), fmt(oddNext + 1), fmt(even0 + 20)])
}

// Notion에서 추가로 확인된 세부 유형: 문단 배열, 문장 삽입, 비율 비교, 증감률,
// 경우의 수, 확률, 방정식, 조건추리, 계차수열, 군수열, 조화수열.
for (let i = 1; i <= 10; i++) {
  add({ id: `GV-ORDER-${i}`, section: 'verbal', subtype: '문단 배열', targetSec: 70, verification: 'manual',
    stem: '다음 문장들을 가장 자연스럽게 배열한 것은?', conditions: [
      '(가) 새로운 제도를 평가하려면 먼저 평가 기준을 명확히 정해야 한다.',
      `(나) 예를 들어 사례 ${i}에서는 비용만 비교했을 때와 이용자 만족도를 함께 보았을 때 결론이 달랐다.`,
      '(다) 따라서 하나의 수치만으로 제도의 성과를 단정해서는 안 된다.',
    ], explanation: '일반 원칙을 제시한 뒤 사례가 나오고, 따라서로 결론을 맺는다.', fastMethod: '예를 들어는 앞의 일반 문장을, 따라서 또는 그러므로는 앞의 근거를 필요로 한다.', commonMistake: '결론 표지인 따라서 문장을 첫 문장으로 둔다.',
  }, '가-나-다', ['가-다-나', '나-가-다', '나-다-가', '다-가-나'])

  add({ id: `GV-INSERT-${i}`, section: 'verbal', subtype: '문장 삽입', targetSec: 75, verification: 'manual',
    stem: '제시 문장이 들어갈 위치로 가장 적절한 것은?', passage: `① 초기에 이 서비스는 PC에서만 이용할 수 있었다. ② 이후 모바일 앱이 출시되면서 이용 장소의 제약이 줄었다. ③ 이용 시간대도 낮 중심에서 아침과 저녁으로 넓어졌다. ④ 기업은 서버 용량을 늘려 변화에 대응했다.`,
    conditions: ['제시 문장: 이러한 변화로 전체 이용자 수뿐 아니라 이용 방식도 달라졌다.'],
    explanation: '이러한 변화는 모바일 출시와 이용 시간대 확대를 함께 가리키므로 두 설명 뒤에 와야 한다.', fastMethod: '지시어가 가리키는 복수의 선행 내용을 찾는다.', commonMistake: '이러한의 선행 내용이 하나만 제시된 위치에 넣는다.',
  }, '③ 뒤', ['① 앞', '① 뒤', '② 뒤', '④ 뒤'])

  const aNum = 45 + i, aDen = 60 + i, bNum = 38 + i, bDen = 50 + i, cNum = 30 + i, cDen = 45 + i
  const ratios = [{ k: 'A', v: aNum / aDen }, { k: 'B', v: bNum / bDen }, { k: 'C', v: cNum / cDen }].sort((x, y) => y.v - x.v)
  add({ id: `GD-RATIO-${i}`, section: 'data', subtype: '비율 비교', targetSec: 70,
    stem: `A는 ${aNum}/${aDen}, B는 ${bNum}/${bDen}, C는 ${cNum}/${cDen}이다. 비율이 가장 큰 것은?`,
    explanation: '각 비율을 교차곱 또는 근삿값으로 비교한다.', fastMethod: '두 비율씩 교차곱해 나눗셈을 피한다.', commonMistake: '분자만 비교하거나 분모가 작은 것을 무조건 크게 본다.',
  }, ratios[0].k, ['A와 B가 같다', 'B와 C가 같다', ...['A', 'B', 'C'].filter((x) => x !== ratios[0].k)])

  const before = 200 + i * 20, rate = 10 + i, after = before * (1 + rate / 100)
  add({ id: `GD-CHANGE-${i}`, section: 'data', subtype: '증감률', targetSec: 60,
    stem: `어떤 값이 ${before}에서 ${fmt(after)}로 증가했다. 증가율은?`, explanation: `증가량 ${fmt(after - before)}을 기준값 ${before}으로 나누면 ${rate}%이다.`,
    fastMethod: '변화량을 이전 값으로 나눈다.', commonMistake: '변화량을 이후 값으로 나눈다.',
  }, `${rate}%`, [`${rate - 2}%`, `${rate - 1}%`, `${rate + 1}%`, `${rate + 2}%`])

  const n = 5 + i
  const comb = n * (n - 1) / 2
  add({ id: `GM-COMB-${i}`, section: 'math', subtype: '경우의 수/조합', targetSec: 65,
    stem: `서로 다른 ${n}명 중 순서를 고려하지 않고 대표 2명을 고르는 방법의 수는?`, explanation: `${n}C2=${n}×${n - 1}/2=${comb}이다.`,
    fastMethod: '두 명 선택은 n(n-1)/2를 사용한다.', commonMistake: '순서를 고려해 n(n-1)로 계산한다.',
  }, fmt(comb), [fmt(n * (n - 1)), fmt(comb - n), fmt(comb + n), fmt(n ** 2)])

  const red = 2 + i, blue = 3 + i, total = red + blue
  add({ id: `GM-PROB-${i}`, section: 'math', subtype: '확률', targetSec: 55,
    stem: `주머니에 빨간 공 ${red}개와 파란 공 ${blue}개가 있다. 한 개를 무작위로 꺼낼 때 빨간 공일 확률은?`, explanation: `전체 ${total}개 중 빨간 공이 ${red}개이므로 ${red}/${total}이다.`,
    fastMethod: '원하는 경우의 수를 전체 경우의 수로 나눈다.', commonMistake: '빨간 공 수를 파란 공 수로 나눈다.',
  }, `${red}/${total}`, [`${blue}/${total}`, `${red}/${blue}`, `1/${total}`, `${red - 1}/${total}`])

  const rooms = 4 + i, basePeople = rooms * 4 + 3
  add({ id: `GM-EQ-${i}`, section: 'math', subtype: '방정식/인원 배치', targetSec: 75,
    stem: `사람 ${basePeople}명을 방 ${rooms}개에 배치한다. 모든 방에 최소 4명씩 넣으면 남는 사람은 몇 명인가?`, explanation: `${rooms}×4=${rooms * 4}명을 먼저 배치하면 ${basePeople - rooms * 4}명이 남는다.`,
    fastMethod: '최소 인원을 모든 방에 먼저 배치한 뒤 나머지를 계산한다.', commonMistake: '방 하나에만 최소 인원을 적용한다.',
  }, fmt(3), ['1', '2', '4', '5'])

  const floorPeople = ['A', 'B', 'C', 'D', 'E'].map((x) => `${x}${i}`)
  add({ id: `GR-FLOOR-${i}`, section: 'reasoning', subtype: '층수/위치', targetSec: 80,
    stem: '다섯 사람이 서로 다른 1층부터 5층에 한 명씩 있을 때 3층에 있는 사람은?', conditions: [
      `${floorPeople[0]}는 ${floorPeople[1]}보다 위층이다.`, `${floorPeople[1]}는 ${floorPeople[2]}보다 위층이다.`, `${floorPeople[2]}는 ${floorPeople[3]}보다 위층이다.`, `${floorPeople[3]}는 ${floorPeople[4]}보다 위층이다.`,
    ], explanation: `위에서부터 ${floorPeople.join(', ')} 순서이므로 3층은 ${floorPeople[2]}이다.`, fastMethod: '모든 비교조건을 하나의 긴 chain으로 연결한다.', commonMistake: '위층과 앞선다는 표현의 방향을 뒤집는다.',
  }, floorPeople[2], [floorPeople[0], floorPeople[1], floorPeople[3], floorPeople[4]])

  add({ id: `GR-SELECT-${i}`, section: 'reasoning', subtype: '선택/조합 조건', targetSec: 85,
    stem: 'A, B, C, D 중 정확히 두 명을 선발한다. 다음 조건을 모두 만족하는 조합은?', conditions: ['A를 선발하면 B도 선발한다.', 'C와 D는 함께 선발할 수 없다.', 'B와 C 중 적어도 한 명은 선발한다.'],
    explanation: '가능한 두 명 조합을 조건에 대입하면 A와 B가 모든 조건을 만족한다.', fastMethod: '선지를 조건에 직접 대입하고 모순이 하나라도 생기면 제거한다.', commonMistake: 'A이면 B를 B이면 A로 뒤집는다.',
  }, 'A, B', ['A, C', 'A, D', 'C, D', 'A만 선발'])
}

for (let i = 1; i <= 8; i++) {
  const first = 3 + i, diffs = [2, 4, 6, 8, 10, 12], seq = [first]
  for (const d of diffs.slice(0, 5)) seq.push(seq.at(-1) + d)
  const next = seq.at(-1) + diffs[5]
  add({ id: `GS-DIFF-${i}`, section: 'sequence', subtype: '계차수열', targetSec: 45,
    stem: '다음 수열의 빈칸에 들어갈 수는?', conditions: [`${seq.join(', ')}, ( )`], explanation: `계차가 2, 4, 6, 8, 10으로 2씩 증가하므로 다음 계차는 12, 정답은 ${next}이다.`,
    fastMethod: '원수열의 차이를 아래 줄에 맞춰 적는다.', commonMistake: '마지막 항에 다음 계차가 아니라 이전 계차를 더한다.',
  }, fmt(next), [fmt(next - 4), fmt(next - 2), fmt(next + 2), fmt(next + 4)])

  const sums = [12 + i, 15 + i, 18 + i, 21 + i]
  const triples = sums.map((sum, k) => [2 + k, 3 + k, sum - 5 - 2 * k])
  const missing = triples[3][2]
  add({ id: `GS-GROUP-${i}`, section: 'sequence', subtype: '군수열/묶음 합', targetSec: 50,
    stem: '각 괄호 안 세 수가 같은 규칙을 따를 때 빈칸은?', conditions: [`${triples.slice(0, 3).map((x) => `(${x.join(', ')})`).join(' / ')} / (${triples[3][0]}, ${triples[3][1]}, ?)`],
    explanation: `각 묶음의 합이 ${sums.join(', ')}로 3씩 증가하므로 마지막 묶음의 합은 ${sums[3]}, 빈칸은 ${missing}이다.`, fastMethod: '세 수를 묶어 합, 곱, 평균을 먼저 확인한다.', commonMistake: '전체 숫자를 하나의 긴 수열로 본다.',
  }, fmt(missing), [fmt(missing - 2), fmt(missing - 1), fmt(missing + 1), fmt(missing + 2)])

  const dens = [2 + i, 4 + i, 6 + i, 8 + i, 10 + i]
  add({ id: `GS-HARM-${i}`, section: 'sequence', subtype: '조화수열/분수', targetSec: 45,
    stem: '다음 수열의 빈칸에 들어갈 수는?', conditions: [`1/${dens.slice(0, 4).join(', 1/')}, ( )`], explanation: `분모가 2씩 증가하므로 다음 항은 1/${dens[4]}이다.`,
    fastMethod: '분자가 1로 고정되면 역수를 취해 분모 수열을 본다.', commonMistake: '분수 전체의 차이를 직접 계산한다.',
  }, `1/${dens[4]}`, [`1/${dens[4] - 1}`, `1/${dens[4] + 1}`, `2/${dens[4]}`, `1/${dens[4] + 2}`])
}

const ids = new Set()
for (const q of questions) {
  if (ids.has(q.id)) throw new Error(`중복 id: ${q.id}`)
  ids.add(q.id)
  if (q.choices.length !== 5 || new Set(q.choices).size !== 5 || q.answer < 0 || q.answer > 4) throw new Error(`문항 오류: ${q.id}`)
}

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(outFile, `${JSON.stringify({ generatedAt: new Date().toISOString(), questions }, null, 2)}\n`)
console.log(`자체 생성 문제은행 ${questions.length}문항 생성: ${outFile}`)
