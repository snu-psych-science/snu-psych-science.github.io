---
title: 뉴스레터
---

{% include page-hero.html
  eyebrow="NEWSLETTER"
  description="심리과학연구소는 연 2회 뉴스레터를 발간하여 주요 활동, 연구 성과, 학술행사 및 구성원 소식을 공유합니다."
%}

{% include section.html %}

{% assign newsletters = site.newsletters | sort: "date" | reverse %}

<div class="collection-list">

  {% for newsletter in newsletters %}
    <a class="collection-card list-card" href="{{ newsletter.url | relative_url }}">

      <div class="collection-card__date">
        {{ newsletter.date | date: "%Y.%m.%d" }}
      </div>

      <div class="collection-card__content">
        <h2>{{ newsletter.title }}</h2>

        {% if newsletter.volume %}
          <p class="collection-card__meta">{{ newsletter.volume }}</p>
        {% endif %}

        {% if newsletter.summary %}
          <p class="collection-card__summary">
            {{ newsletter.summary | truncate: 140 }}
          </p>
        {% endif %}
      </div>

      <div class="collection-card__arrow">→</div>

    </a>
  {% endfor %}

</div>
