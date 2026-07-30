---
title: 자료실
---

{% include page-hero.html
  eyebrow="RESOURCES"
  description="연구소 운영규정, 연구윤리 지침, 관련 기관 및 학술단체 링크 등 연구소 구성원과 방문자가 참고할 수 있는 자료를 제공합니다."
%}

{% include section.html %}

<div class="resources-section-title section-heading">
  <span>RESOURCE CATEGORIES</span>
  <h2>자료실 바로가기</h2>
</div>

{% assign resources_navigation = site.data.navigation | where: "url", "/resources/" | first %}
<div class="resources-card-grid card-grid">
  {% for item in resources_navigation.children %}
    <a class="resources-card content-card" href="{{ item.url | relative_url }}">
      <div class="resources-card-icon">{% include icon.html icon=item.icon %}</div>
      <h3>{{ item.title }}</h3>
      <p>{{ item.description }}</p>
      <span class="resources-card-more action-link">자세히 보기 →</span>
    </a>
  {% endfor %}
</div>
