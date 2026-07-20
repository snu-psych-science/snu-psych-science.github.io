
  ![on-push](../../actions/workflows/on-push.yaml/badge.svg)
  ![on-pull-request](../../actions/workflows/on-pull-request.yaml/badge.svg)

  # snu-psych-science's Website

  Visit **[snu-psych-science.github.io](https://snu-psych-science.github.io)** 🚀

  _Built with [Lab Website Template](https://greene-lab.gitbook.io/lab-website-template-docs)_

  ## Local checks

  Node.js 20 이상과 Ruby 3.2가 필요합니다. 소스 계약 테스트는 다음 명령으로
  실행합니다.

  ```sh
  npm run test:source
  ```

  A full validation also requires Ruby/Bundler and builds the Jekyll site before
  checking the generated HTML:

  ```sh
  npm run build
  npm run test:generated
  ```

  생성물 검사는 내부 링크, 로컬 asset, baseurl, canonical URL, JSON-LD와
  접근성 구조를 직접 확인합니다. 이 계약이 중복 기능을 제공하므로
  `html-proofer`는 별도 의존성으로 유지하지 않습니다.

  Pull request 미리보기와 `main` 배포는 동일한 Jekyll production 빌드를
  사용합니다. 논문 목록은 `_data/psi_publications.yaml`에서 직접 관리합니다.
