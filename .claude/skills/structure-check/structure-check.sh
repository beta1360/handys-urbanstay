#!/usr/bin/env bash
set -u

usage() {
  echo "사용법: bash .claude/skills/structure-check/structure-check.sh <app-admin|hotel-admin|web> [기준 ref]" >&2
  echo "  기준 ref(예: master)를 주면 그 ref에서 갈라진 뒤 바뀐 파일(커밋 전 변경·새 파일 포함)만 본다." >&2
  exit 2
}

APP="${1:-}"
BASE="${2:-}"
case "$APP" in
  app-admin | hotel-admin)
    APP_LAYER="app"
    PAGES_LAYER="pages"
    MOVE_HOOKS="useNavigate"
    ;;
  web)
    APP_LAYER="_app"
    PAGES_LAYER="_pages"
    MOVE_HOOKS="useRouter"
    ;;
  *) usage ;;
esac

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT" ] || [ ! -d "$ROOT/frontend/apps/$APP/src" ]; then
  ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
fi
SRC_REL="frontend/apps/$APP/src"
cd "$ROOT/$SRC_REL" 2>/dev/null || { echo "폴더를 찾을 수 없음: $ROOT/$SRC_REL" >&2; exit 2; }

is_source() {
  case "$1" in
    *.test.ts | *.test.tsx | *route-tree.gen.ts | generated/* | */generated/*) return 1 ;;
    *.ts | *.tsx) [ -f "$1" ] ;;
    *) return 1 ;;
  esac
}

mapfile -t EVERY < <(find . -type f \( -name '*.ts' -o -name '*.tsx' \) | sed 's#^\./##' | sort)
if [ -z "$BASE" ]; then
  CANDIDATES=("${EVERY[@]}")
  SCOPE="전체 파일"
else
  git -C "$ROOT" rev-parse --verify --quiet "$BASE^{commit}" >/dev/null || { echo "기준 ref를 찾을 수 없음: $BASE" >&2; exit 2; }
  MERGE_BASE="$(git -C "$ROOT" merge-base "$BASE" HEAD)"
  mapfile -t CANDIDATES < <(
    {
      git -C "$ROOT" diff --name-only --diff-filter=ACMR "$MERGE_BASE" -- "$SRC_REL"
      git -C "$ROOT" ls-files --others --exclude-standard -- "$SRC_REL"
    } | sed "s#^$SRC_REL/##" | sort -u
  )
  SCOPE="$BASE(${MERGE_BASE:0:7}) 이후 바뀐 파일"
fi

FILES=()
for f in "${CANDIDATES[@]}"; do
  is_source "$f" && FILES+=("$f")
done

echo "구조 점검: $APP ($SCOPE ${#FILES[@]}개, 테스트·생성 코드 제외)"
echo
if [ "${#FILES[@]}" -eq 0 ]; then
  echo "볼 파일이 없습니다."
  exit 0
fi

pick() {
  local include="$1" exclude="${2:-}"
  for f in "${FILES[@]}"; do
    [[ "$f" =~ $include ]] || continue
    [ -n "$exclude" ] && [[ "$f" =~ $exclude ]] && continue
    echo "$f"
  done
}

grep_in() {
  local pattern="$1"
  shift
  [ "$#" -eq 0 ] && return 0
  grep -HnE "$pattern" "$@" 2>/dev/null
}

HIT_COUNT=0
report() {
  echo "[$1]"
  if [ -z "$2" ]; then
    echo "  없음"
  else
    printf '%s\n' "$2" | sed 's/^/  /'
    HIT_COUNT=$((HIT_COUNT + 1))
  fi
  echo
}

mapfile -t OUTSIDE_QUERY_LAYERS < <(pick '.*' "^($APP_LAYER/|entities/[^/]+/api/|features/[^/]+/api/)")
report "1. react-query는 $APP_LAYER·entities/*/api·features/*/api에서만" \
  "$(grep_in "[\"']@tanstack/react-query(-devtools)?[\"']" "${OUTSIDE_QUERY_LAYERS[@]}")"

mapfile -t PAGE_FILES < <(pick "^$PAGES_LAYER/")
report "2. $PAGES_LAYER에 상태·요청 없음" \
  "$(grep_in "\\b(useState|useReducer|useEffect|useQuery|useQueries|useMutation|useQueryClient|$MOVE_HOOKS)\\b|\\buse[A-Z][A-Za-z]*(Query|Mutation)\\(" "${PAGE_FILES[@]}")"

mapfile -t UI_FILES < <(pick '(^|/)ui/')
report "3. ui에 이동·요청·상태 없음" \
  "$(grep_in "\\b(useState|useReducer|useEffect|useQuery|useQueries|useMutation|useQueryClient|$MOVE_HOOKS)\\b|\\buse[A-Z][A-Za-z]*(Query|Mutation)\\(|\\bnavigate\\(|\\brouter\\.(push|replace|refresh|back)\\(|pushState|\\bcookies\\(" "${UI_FILES[@]}")"

mapfile -t MODEL_FILES < <(pick '(^|/)model/')
mapfile -t REQUEST_FUNCTIONS < <(
  for f in shared/api/*.ts; do
    case "$f" in *.test.ts | */http.ts | */index.ts) continue ;; esac
    grep -ohE 'export async function [A-Za-z0-9_]+' "$f" | awk '{print $4}'
  done | sort -u
)
MODEL_PATTERN='</|/>|QueryKey\(|\bqueryClient\b|useQueryClient|setQueryData|invalidateQueries|refetchQueries'
if [ "${#REQUEST_FUNCTIONS[@]}" -gt 0 ]; then
  MODEL_PATTERN="$MODEL_PATTERN|\\b($(IFS='|'; echo "${REQUEST_FUNCTIONS[*]}"))\\("
fi
MODEL_TSX="$(printf '%s\n' "${MODEL_FILES[@]}" | grep -E '\.tsx$' | sed 's/$/: model에 .tsx 파일/')"
MODEL_HITS="$(grep_in "$MODEL_PATTERN" "${MODEL_FILES[@]}")"
report "4. model에 JSX·요청 함수 직접 호출·쿼리 키·캐시 조작 없음" \
  "$(printf '%s\n%s' "$MODEL_TSX" "$MODEL_HITS" | sed '/^$/d')"

mapfile -t TSX_FILES < <(pick '\.tsx$')
report "5. 화면 이동은 링크로 (버튼 onClick 이동 없음)" \
  "$(grep_in 'onClick=\{[^}]*(navigate|router\.(push|replace))' "${TSX_FILES[@]}")"

BOOLEAN_STATES=""
for f in "${MODEL_FILES[@]}"; do
  n="$(grep -cE 'useState(<boolean>)?\((true|false)\)' "$f")"
  [ "$n" -ge 2 ] && BOOLEAN_STATES+="$f: 불리언 useState ${n}개"$'\n'
done
report "6. 화면 상태는 하나의 값 (불리언 상태 여럿이면 검토)" "$(printf '%s' "$BOOLEAN_STATES" | sed '/^$/d')"

mapfile -t MESSAGE_FILES < <(printf '%s\n' "${EVERY[@]}" | grep -E '(^|/)config/[a-z-]*messages\.ts$')
DUPLICATES=""
if [ "${#MESSAGE_FILES[@]}" -gt 0 ]; then
  while IFS= read -r text; do
    [ -z "$text" ] && continue
    mapfile -t owners < <(grep -lF -- "$text" "${MESSAGE_FILES[@]}")
    [ "${#owners[@]}" -lt 2 ] && continue
    if [ -n "$BASE" ]; then
      touched=""
      for o in "${owners[@]}"; do
        printf '%s\n' "${FILES[@]}" | grep -qxF -- "$o" && touched="yes"
      done
      [ -z "$touched" ] && continue
    fi
    DUPLICATES+="$text"$'\n'
    for o in "${owners[@]}"; do DUPLICATES+="  - $o"$'\n'; done
  done < <(
    for f in "${MESSAGE_FILES[@]}"; do
      grep -vE '^\s*(import|export \{|export \*)' "$f" | grep -oE '"[^"]+"' | sort -u
    done | grep -vE '^"(\.|/|@)' | sort | uniq -d
  )
fi
report "7. 같은 문구를 여러 messages 파일에 따로 두지 않음" "$(printf '%s' "$DUPLICATES" | sed '/^$/d')"

if [ "$APP" = "web" ]; then
  mapfile -t OUTSIDE_WIDGET_MODEL < <(pick '.*' '^widgets/[^/]+/model/')
  report "web. next/headers는 widgets/*/model에서만" \
    "$(grep_in "[\"']next/headers[\"']" "${OUTSIDE_WIDGET_MODEL[@]}")"
fi

echo "걸린 항목: ${HIT_COUNT}개. 걸린 줄은 SKILL.md의 '결과 읽기'로 위반인지 판단한다."
