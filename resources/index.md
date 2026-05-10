---
title: 자료실
nav:
  order: 5
  tooltip: 자료실
---

# 공지사항

{% assign notices = site.posts | where_exp: "post", "post.categories contains 'notice'" %}

<div class="board-list">
  {% for post in notices %}
    <div class="board-row">
      <a class="board-title" href="{{ post.url | relative_url }}">
        {{ post.title }}
      </a>
      <span class="board-date">
        {{ post.date | date: "%Y.%m.%d" }}
      </span>
    </div>
  {% endfor %}
</div>
