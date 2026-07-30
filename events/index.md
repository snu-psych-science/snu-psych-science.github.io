---
title: 학술행사
---

{% include page-hero.html
  eyebrow="ACADEMIC EVENTS"
  description="심리과학연구소는 세미나, 콜로키움, 초청강연 등 다양한 학술행사를 통해 심리과학 분야의 연구 교류와 학문적 논의를 촉진하고 있습니다."
  decorated=false
%}

{% assign events = site.events | sort: "date" | reverse %}

<div class="collection-list">

  {% for event in events %}
    <a class="collection-card list-card" href="{{ event.url | relative_url }}">
      <div class="collection-card__date">
        {{ event.date | date: "%Y.%m.%d" }}
      </div>

      <div class="collection-card__content">
        <h2>{{ event.title }}</h2>

        {% if event.speaker %}
          <p class="collection-card__meta">{{ event.speaker }}</p>
        {% endif %}

        {% if event.summary %}
          <p class="collection-card__summary">{{ event.summary }}</p>
        {% endif %}
      </div>

      <div class="collection-card__arrow">→</div>
    </a>
  {% endfor %}

</div>
