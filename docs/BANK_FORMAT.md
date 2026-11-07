# 개인 문제은행 형식 (비공개 자료용)

개인 문제(노션·교재·e-book 등)는 **이 저장소가 아니라 `private/` 폴더**에 둡니다. `private/`는 git이 무시하며(커밋 훅도 차단), 앱은 번들이 아니라 **이 PC의 로컬 서버에서 런타임에만** 읽습니다. 정적 배포를 해도 포함되지 않고, 외부 IP 요청은 403입니다.

```
private/
  bank/*.json     문제 (아래 형식)
  images/*.png    표·그래프 등 원본 이미지 (파일명: 영문/숫자/._-)
  inbox/          정리 전 원본 사진·PDF·노션 내보내기 (앱은 읽지 않음)
```

## 문제 JSON (`private/bank/*.json`, 배열 또는 `{ "questions": [...] }`)
```json
{
  "id": "N-001", "section": "math", "subtype": "농도", "difficulty": 2, "targetSec": 80,
  "stem": "문제 본문", "passage": "(선택) 지문", "conditions": ["(선택) 조건1"],
  "table": { "caption": "표 제목", "unit": "(단위)", "header": ["a","b"], "rows": [["1","2"]] },
  "image": "n001.png",
  "choices": ["①","②","③","④","⑤"], "answer": 2,
  "explanation": "", "fastMethod": "", "commonMistake": "",
  "source": "개인 노트", "verification": "manual"
}
```
- `section`: `verbal | data | math | reasoning | sequence`. 선지는 정확히 5개, 중복 불가.
- **정답을 직접 확인했을 때만** `answer`와 `verification: "manual"`(또는 스크립트 검증 후 `"script"`)을 적습니다.
- `answer`가 없거나 `verification`이 없으면 `unverified`로 격리되어 **모의고사에서 제외**됩니다(정답을 임의로 확정하지 않음).
- 시작 화면에 로드 수·검증 대기 수·오류가 표시됩니다.
