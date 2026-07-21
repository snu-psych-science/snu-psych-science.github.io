---
title: 학술행사
---

<div class="events-hero-card page-hero" style="--page-hero-image: url('{{ site.header | relative_url }}')">

  <div class="events-hero-label page-hero__eyebrow">ACADEMIC EVENTS</div>

  <h1 class="page-hero__title">학술행사</h1>

</div>

{% assign events = site.events | sort: "date" | reverse %}

<div class="event-list">

  {% for event in events %}
    <a class="event-card list-card" href="{{ event.url | relative_url }}">
      <div class="event-date">
        {{ event.date | date: "%Y.%m.%d" }}
      </div>

      <div class="event-content">
        <h3>{{ event.title }}</h3>

        {% if event.speaker %}
          <p class="event-speaker">{{ event.speaker }}</p>
        {% endif %}

        {% if event.summary %}
          <p class="event-summary">{{ event.summary }}</p>
        {% endif %}
      </div>

      <div class="event-arrow">→</div>
    </a>
  {% endfor %}

</div>
