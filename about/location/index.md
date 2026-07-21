---
title: 찾아오시는 길
---

<div class="page-hero page-hero--decorated" style="--page-hero-image: url('{{ site.header | relative_url }}')">

  <div class="page-hero__eyebrow">LOCATION</div>

  <h1 class="page-hero__title">찾아오시는 길</h1>

  <p class="page-hero__description">
    서울대학교 심리과학연구소 방문 안내입니다.
  </p>

</div>

<div class="location-map-card">

  <iframe
    class="location-map"
    title="서울대학교 심리과학연구소 위치 지도"
    src="https://www.google.com/maps?q=%EC%84%9C%EC%9A%B8%EB%8C%80%ED%95%99%EA%B5%90%20%EC%82%AC%ED%9A%8C%EA%B3%BC%ED%95%99%EB%8C%80%ED%95%99%2016%EB%8F%99&output=embed"
    loading="lazy"
    referrerpolicy="no-referrer-when-downgrade"
    allowfullscreen>
  </iframe>

</div>

<div class="location-info-card">

  <div class="location-info-item">
    <h3>위치</h3>
    <p>
      {% for line in site.contact.address_lines %}
        {{ line }}{% unless forloop.last %}<br>{% endunless %}
      {% endfor %}
    </p>
  </div>

  <div class="location-info-item">
    <h3>방문 안내</h3>
    <p>
      심리과학연구소 방문 시 서울대학교 관악캠퍼스 사회과학대학을 기준으로 경로를 확인하실 수 있습니다.
    </p>
  </div>

</div>
