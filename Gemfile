source "https://rubygems.org"

# jekyll
gem "jekyll", "~> 4.3"
gem "webrick", "~> 1.7"

# Named time zones use the IANA database when building on Windows.
platforms :mingw, :x64_mingw, :mswin do
  gem "tzinfo", "~> 2.0"
  gem "tzinfo-data"
end

# plugins
group :jekyll_plugins do
  gem "jekyll-spaceship"
  gem "jekyll-sitemap"
  gem "jekyll-redirect-from"
  gem "jekyll-feed"
  gem "jekyll-last-modified-at"
end
