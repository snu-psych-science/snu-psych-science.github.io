
  ![on-push](../../actions/workflows/on-push.yaml/badge.svg)
  ![on-pull-request](../../actions/workflows/on-pull-request.yaml/badge.svg)
  ![on-schedule](../../actions/workflows/on-schedule.yaml/badge.svg)

  # snu-psych-science's Website

  Visit **[snu-psych-science.github.io](https://snu-psych-science.github.io)** 🚀

  _Built with [Lab Website Template](https://greene-lab.gitbook.io/lab-website-template-docs)_

  ## Local checks

  Run the dependency-free source tests with Node.js:

  ```sh
  node --test tests/interactions.test.cjs tests/search.test.cjs tests/source-contract.test.cjs
  ```

  A full validation also requires Ruby/Bundler and builds the Jekyll site before
  checking the generated HTML:

  ```sh
  bundle exec jekyll build
  node --test tests/generated-site.ci.cjs
  ```
