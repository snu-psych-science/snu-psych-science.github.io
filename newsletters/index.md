---
title: 뉴스레터
---

<div class="page-hero page-hero--decorated" style="--page-hero-image: url('{{ site.header | relative_url }}')">
  <div class="page-hero__eyebrow">NEWSLETTER</div>
  <h1 class="page-hero__title">뉴스레터</h1>
  <p class="page-hero__description">심리과학연구소는 연 2회 뉴스레터를 발간하여 주요 활동, 연구 성과, 학술행사 및 구성원 소식을 공유합니다.</p>
</div>

{% include section.html %}

{% assign newsletters = site.newsletters | sort: "date" | reverse %}

<div class="newsletter-list">

  {% for newsletter in newsletters %}
    <a class="newsletter-card list-card" href="{{ newsletter.url | relative_url }}">

      <div class="newsletter-date">
        {{ newsletter.date | date: "%Y.%m.%d" }}
      </div>

      <div class="newsletter-content">
        <h3>{{ newsletter.title }}</h3>

        {% if newsletter.volume %}
          <p class="newsletter-volume">{{ newsletter.volume }}</p>
        {% endif %}

        {% if newsletter.summary %}
          <p class="newsletter-summary">
            {{ newsletter.summary | truncate: 140 }}
          </p>
        {% endif %}
      </div>

      <div class="newsletter-arrow">→</div>

    </a>
  {% endfor %}

</div>
