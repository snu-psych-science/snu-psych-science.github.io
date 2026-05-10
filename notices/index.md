---
title: 공지사항
nav:
  order: 6
  tooltip: 공지사항
---

<div class="notices-hero-card">

  <div class="notices-hero-label">NOTICE</div>

  <h1>공지사항</h1>

  <p class="notices-hero-subtitle">
    심리과학연구소의 주요 공지, 안내사항, 자료 업데이트 소식을 확인할 수 있습니다.
  </p>

</div>

{% assign notices = site.notices | sort: "date" | reverse %}

<div class="notice-board">

  <div class="notice-board-header">
    <span class="notice-board-title">제목</span>
    <span class="notice-board-date">날짜</span>
  </div>

  {% if notices.size > 0 %}

    {% for notice in notices %}
      <a class="notice-row" href="{{ notice.url | relative_url }}">

        <div class="notice-row-main">
          {% if notice.category %}
            <span class="notice-badge">{{ notice.category }}</span>
          {% else %}
            <span class="notice-badge">공지</span>
          {% endif %}

          <span class="notice-title">{{ notice.title }}</span>

          {% if notice.attachments %}
            <span class="notice-attachment-mark">
              {% include icon.html icon="fa-solid fa-paperclip" %}
            </span>
          {% endif %}
        </div>

        <time class="notice-date" datetime="{{ notice.date | date: '%Y-%m-%d' }}">
          {{ notice.date | date: "%Y.%m.%d" }}
        </time>

      </a>
    {% endfor %}

  {% else %}

    <div class="notice-empty">
      등록된 공지사항이 없습니다.
    </div>

  {% endif %}

</div>
