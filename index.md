---
title: 홈
---

{% assign events = site.events | sort: "date" | reverse | slice: 0, 3 %}
{% assign newsletters = site.newsletters | sort: "date" | reverse %}
{% assign latest_newsletter = newsletters | first %}

<div class="home-section-title">
  <span>ACADEMIC EVENTS</span>
  <h2>학술행사</h2>
</div>

<div class="home-preview-grid">

{% if events.size > 0 %}
{% for event in events %}
  <a class="home-preview-card" href="{{ event.url | relative_url }}">
    <div class="home-preview-date">
      {{ event.event_date | default: event.date | date: "%Y.%m.%d" }}
    </div>

    <h3>{{ event.title }}</h3>

    {% if event.speaker %}
      <p class="home-preview-meta">{{ event.speaker }}</p>
    {% endif %}

    {% if event.summary %}
      <p>{{ event.summary }}</p>
    {% endif %}

    <span>자세히 보기 →</span>
  </a>
{% endfor %}
{% else %}
  <div class="home-empty-card">
    등록된 학술행사가 없습니다.
  </div>
{% endif %}

</div>

<div class="home-more-wrap">
  <a class="home-more-button" href="{{ '/events/' | relative_url }}">학술행사 더보기</a>
</div>

{% include section.html %}

<div class="home-section-title">
  <span>NEWSLETTER</span>
  <h2>뉴스레터</h2>
</div>

{% if latest_newsletter %}

<div class="home-newsletter-card">

  <div class="home-newsletter-image">
    {% if latest_newsletter.image %}
      <img
        src="{{ latest_newsletter.image | relative_url }}"
        alt="{{ latest_newsletter.title }}"
      >
    {% else %}
      {% include icon.html icon="fa-solid fa-newspaper" %}
    {% endif %}
  </div>

  <div class="home-newsletter-content">
    <div class="home-preview-date">
      {{ latest_newsletter.date | date: "%Y.%m.%d" }}
    </div>

    <h3>{{ latest_newsletter.title }}</h3>

    {% if latest_newsletter.volume %}
      <p class="home-preview-meta">{{ latest_newsletter.volume }}</p>
    {% endif %}

    {% if latest_newsletter.summary %}
      <p>{{ latest_newsletter.summary }}</p>
    {% else %}
      <p>{{ latest_newsletter.excerpt | strip_html | truncate: 150 }}</p>
    {% endif %}

    <a class="home-newsletter-button" href="{{ latest_newsletter.url | relative_url }}">
      뉴스레터 보기 →
    </a>
  </div>

</div>

{% else %}

<div class="home-empty-card">
  등록된 뉴스레터가 없습니다.
</div>

{% endif %}
