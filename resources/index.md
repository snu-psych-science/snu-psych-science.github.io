---
title: 자료실
nav:
  order: 5
  tooltip: 자료실
---

<div class="resources-hero-card">

  <div class="resources-hero-label">RESOURCES</div>

  <h1>자료실</h1>

  <p class="resources-hero-subtitle">
    심리과학연구소 운영과 연구 활동에 필요한 규정, 지침, 관련 기관 정보를 제공합니다.
  </p>

</div>

<div class="resources-intro-panel">

  <div class="resources-intro-heading">
    <span>Institute Resources</span>
    <h2>연구 활동을 위한 주요 자료</h2>
  </div>

  <div class="resources-intro-text">
    <p>
      자료실에서는 연구소 운영규정, 연구윤리 지침, 관련 기관 및 학술단체 링크 등 연구소 구성원과 방문자가 참고할 수 있는 자료를 제공합니다.
    </p>

    <p>
      연구소 규정과 관련 링크는 추후 자료 확정 및 검토를 거쳐 지속적으로 업데이트될 예정입니다.
    </p>
  </div>

</div>

{% include section.html %}

<div class="resources-section-title">
  <span>RESOURCE CATEGORIES</span>
  <h2>자료실 바로가기</h2>
</div>

<div class="resources-card-grid">

  <a class="resources-card" href="{{ '/resources/rules/' | relative_url }}">
    <div class="resources-card-icon">
      {% include icon.html icon="fa-solid fa-scale-balanced" %}
    </div>
    <h3>연구소 규정</h3>
    <p>연구소 운영규정, 연구윤리 지침 등 연구 활동과 관련된 주요 규정을 확인할 수 있습니다.</p>
    <span class="resources-card-more">자세히 보기 →</span>
  </a>

  <a class="resources-card" href="{{ '/resources/links/' | relative_url }}">
    <div class="resources-card-icon">
      {% include icon.html icon="fa-solid fa-link" %}
    </div>
    <h3>관련 링크</h3>
    <p>서울대학교, 사회과학대학, 심리학과 및 주요 학술단체 관련 링크를 제공합니다.</p>
    <span class="resources-card-more">자세히 보기 →</span>
  </a>

</div>
