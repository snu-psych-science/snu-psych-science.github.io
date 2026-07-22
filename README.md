[![on-push](../../actions/workflows/on-push.yaml/badge.svg)](../../actions/workflows/on-push.yaml)
[![on-pull-request](../../actions/workflows/on-pull-request.yaml/badge.svg)](../../actions/workflows/on-pull-request.yaml)

# 서울대학교 심리과학연구소 웹사이트

서울대학교 심리과학연구소(Institute of Psychological Science)의 공식 웹사이트입니다. 행동과학, 뇌과학, 임상심리, 데이터 과학을 아우르는 연구소의 활동과 성과를 소개합니다.

- 웹사이트: [snu-psych-science.github.io](https://snu-psych-science.github.io)
- 연락처: [ips.snu@gmail.com](mailto:ips.snu@gmail.com)
- 주소: 서울특별시 관악구 관악로 1, 서울대학교 사회과학대학 16동

## 사이트 구성

- **연구소 소개**: 소장 인사말, 설립 목적과 연혁, 조직 및 구성원, 찾아오시는 길
- **학술행사**: 세미나, 콜로키움, 초청강연, 워크숍 등 연구 교류 활동
- **연구소개**: 기초·응용 심리학을 아우르는 연구 분야와 대표논문
- **뉴스레터**: 연구소 활동, 연구 성과, 학술행사 및 구성원 소식
- **자료실**: 연구소 운영규정, 연구윤리 지침, 관련 기관 및 학술단체 링크
- **공지사항**: 연구소의 주요 공지와 자료 업데이트 안내

## 콘텐츠 관리

사이트는 Jekyll 컬렉션과 YAML 데이터를 사용합니다. 주요 콘텐츠의 관리 위치는 다음과 같습니다.

| 콘텐츠 | 관리 위치 |
| --- | --- |
| 사이트 기본 정보와 연락처 | `_config.yaml` |
| 전체 메뉴 | `_data/navigation.yaml` |
| 메인 화면 슬라이드 | `_data/home.yaml`, `images/home-slide-*` |
| 소장·겸임연구원 정보와 프로필·연구실 링크 | `_data/members.yaml` |
| 학술행사 | `_events/*.md` |
| 연구소개와 대표논문 | `research/index.md`, `_data/psi_publications.yaml` |
| 뉴스레터 | `_newsletters/*.md`, `files/newsletters/*` |
| 공지사항 | `_notices/*.md` |
| 규정과 관련 링크 | `resources/` |

공통 화면 구조는 `_layouts/`와 `_includes/`, 스타일은 `assets/css/main.scss`와 `_styles/`에서 관리합니다. 기존 공개 URL은 `tests/fixtures/routes.txt`를 기준으로 보존합니다.

## 로컬 실행

Node.js 20 이상과 Ruby 3.2가 필요합니다.

```sh
bundle install
bundle exec jekyll serve
```

로컬 서버는 기본적으로 `http://localhost:4000`에서 확인할 수 있습니다.

## 검증

소스 구조와 데이터 계약만 빠르게 검사하려면 다음 명령을 실행합니다.

```sh
npm run test:source
```

생성된 사이트까지 포함한 전체 검증은 다음 명령으로 실행합니다.

```sh
npm test
```

생성물 검사는 공개 경로, 내부 링크, 로컬 asset, `baseurl`, canonical URL, JSON-LD, 접근성 구조를 확인합니다. `npm test`는 소스 검사, Jekyll 빌드, 생성물 검사를 순서대로 실행합니다.

## 배포

Pull request에서는 소스 검사와 미리보기 빌드가 실행됩니다. `main` 브랜치에 반영된 변경은 동일한 production 빌드와 검증을 통과한 뒤 GitHub Pages에 배포됩니다.

## 기반 템플릿과 라이선스

이 사이트는 [Lab Website Template](https://greene-lab.gitbook.io/lab-website-template-docs)을 기반으로 개발되었으며, 저장소의 [BSD 3-Clause License](LICENSE.md)를 따릅니다.
