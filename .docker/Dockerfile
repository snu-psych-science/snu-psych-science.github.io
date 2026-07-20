# Keep local development aligned with CI and .ruby-version.
FROM ruby:3.2

# set working directory within container
WORKDIR /usr/src/app

# Install only the Ruby packages required to render the Jekyll site.
COPY Gemfile Gemfile.lock ./

# install ruby packages
RUN VERSION=$(grep -A 1 'BUNDLED WITH' Gemfile.lock | tail -n 1 | xargs); \
    gem install bundler --version ${VERSION} && \
    bundle _${VERSION}_ install

# ports used by jekyll
EXPOSE 4000
EXPOSE 35729

# Run the local Jekyll development server.
COPY .docker/entrypoint.sh /var
CMD [ "/var/entrypoint.sh" ]
