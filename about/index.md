---
title: 연구소 소개
---

<div class="about-hero-card page-hero page-hero--decorated" style="--page-hero-image: url('{{ site.header | relative_url }}')">

  <div class="about-hero-label page-hero__eyebrow">ABOUT THE INSTITUTE</div>

  <h1 class="page-hero__title">심리과학연구소</h1>

  <p class="about-hero-subtitle page-hero__description">
    인간의 마음과 행동을 과학적으로 이해하고, 심리과학의 학문적 발전과 사회적 기여를 함께 추구합니다.
  </p>

</div>

<div class="about-intro-panel intro-panel">

  <div class="about-intro-heading intro-panel__heading">
    <span>Institute of Psychological Science</span>
    <h2>연구소 소개</h2>
  </div>

  <div class="about-intro-text intro-panel__content">
    <p>
      심리과학연구소는 심리학의 과학주의적 경향과 인간 중심적 접근방식에 기반하여 인간의 마음과 행동을 과학적으로 탐구하고, 한국 사회의 현실 문제에 대한 심리학적 접근과 실용적 해결 방안을 모색하는 연구기관입니다.
    </p>

    <p>
      본 연구소는 기초 심리학과 응용 심리학을 아우르는 학제적 연구를 촉진하며, 학술행사, 연구 교류, 대외 자문 및 연구용역 등을 통해 심리과학의 학문적 발전과 사회적 기여를 함께 추구하고 있습니다.
    </p>
  </div>

</div>

{% include section.html %}

<div class="about-section-title section-heading">
  <span>QUICK LINKS</span>
  <h2>연구소 소개 바로가기</h2>
</div>

{% assign about_navigation = site.data.navigation | where: "url", "/about/" | first %}
<div class="about-card-grid card-grid">
  {% for item in about_navigation.children %}
    <a class="about-card content-card" href="{{ item.url | relative_url }}">
      <div class="about-card-icon">{% include icon.html icon=item.icon %}</div>
      <h3>{{ item.title }}</h3>
      <p>{{ item.description }}</p>
      <span class="about-card-more action-link">자세히 보기 →</span>
    </a>
  {% endfor %}
</div>
