---
title: 뉴스레터
nav:
  order: 4
  tooltip: 뉴스레터
---

# {% include icon.html icon="fa-solid fa-feather-pointed" %}뉴스레터

심리과학연구소는 연 2회 뉴스레터를 발간하여 연구소의 주요 활동, 연구 성과, 학술 행사 및 구성원 소식을 공유하고 있습니다. 뉴스레터를 통해 심리과학 연구의 최신 동향과 연구소의 학문적 성과를 지속적으로 소개합니다.

{% include section.html %}

{% assign newsletters = site.newsletters | sort: "date" | reverse %}

<div class="newsletter-list">

  {% for newsletter in newsletters %}
    <a class="newsletter-card" href="{{ newsletter.url | relative_url }}">

      <div class="newsletter-date">
        {{ newsletter.date | date: "%Y.%m.%d" }}
      </div>

      <div class="newsletter-content">
        <h3>{{ newsletter.title }}</h3>

        {% if newsletter.volume %}
          <p class="newsletter-volume">{{ newsletter.volume }}</p>
        {% endif %}

        {% if newsletter.excerpt %}
          <p class="newsletter-summary">
            {{ newsletter.excerpt | strip_html | truncate: 140 }}
          </p>
        {% endif %}
      </div>

      <div class="newsletter-arrow">→</div>

    </a>
  {% endfor %}

</div>
