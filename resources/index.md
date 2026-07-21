---
title: 자료실
---

<div class="resources-hero-card page-hero page-hero--decorated" style="--page-hero-image: url('{{ site.header | relative_url }}')">

  <div class="resources-hero-label page-hero__eyebrow">RESOURCES</div>

  <h1 class="page-hero__title">자료실</h1>

</div>

<div class="resources-intro-panel intro-panel">

  <div class="resources-intro-heading intro-panel__heading">
    <span>Institute Resources</span>
    <h2>연구 활동을 위한 주요 자료</h2>
  </div>

  <div class="resources-intro-text intro-panel__content">
    <p>
      자료실에서는 연구소 운영규정, 연구윤리 지침, 관련 기관 및 학술단체 링크 등 연구소 구성원과 방문자가 참고할 수 있는 자료를 제공합니다.
    </p>

    <p>
      연구소 규정과 관련 링크는 추후 자료 확정 및 검토를 거쳐 지속적으로 업데이트될 예정입니다.
    </p>
  </div>

</div>

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
