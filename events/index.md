---
title: 학술행사
nav:
  order: 2
  tooltip: 학술행사
---

<div class="events-hero-card">

  <div class="events-hero-label">ACADEMIC EVENTS</div>

  <h1>학술행사</h1>

  <p class="events-hero-subtitle">
    심리과학연구소는 세미나, 콜로키움, 초청강연 등 다양한 학술행사를 통해 심리과학 분야의 연구 교류와 학문적 논의를 촉진하고 있습니다.
  </p>

</div>

{% assign events = site.events | sort: "date" | reverse %}

<div class="event-list">

  {% for event in events %}
    <a class="event-card" href="{{ event.url | relative_url }}">
      <div class="event-date">
        {{ event.event_date | default: event.date | date: "%Y.%m.%d" }}
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
