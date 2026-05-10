---
title: 대표논문
---

<div class="research-hero-card">

  <div class="research-hero-label">SELECTED PUBLICATIONS</div>

  <h1>대표논문</h1>

  <p class="research-hero-subtitle">
    심리과학연구소 참여 연구진의 주요 논문과 저서를 연도별로 소개합니다.
  </p>

</div>

{% assign years = "2026|2025|2024" | split: "|" %}

<div class="publication-list">

  {% for year in years %}
    {% assign pubs = site.data.psi_publications | where: "year", year %}

    {% if pubs.size > 0 %}
      <section class="publication-year-section">

        <div class="publication-year-heading">
          <span>{{ pubs.size }} items</span>
          <h2>{{ year }}</h2>
        </div>

        <div class="publication-year-list">
          {% for pub in pubs %}

            {% if pub.link %}
              <a class="publication-card" href="{{ pub.link }}" target="_blank" rel="noopener">
            {% else %}
              <div class="publication-card">
            {% endif %}

              <div class="publication-meta">
                <span class="publication-year">{{ pub.year }}</span>
                {% if pub.type %}
                  <span class="publication-type">{{ pub.type }}</span>
                {% endif %}
              </div>

              <h3>{{ pub.title }}</h3>

              <p class="publication-citation">
                {{ pub.citation }}
              </p>

              {% if pub.link %}
                <span class="publication-link">
                  {{ pub.link_label | default: "Link" }} →
                </span>
              {% endif %}

            {% if pub.link %}
              </a>
            {% else %}
              </div>
            {% endif %}

          {% endfor %}
        </div>

      </section>
    {% endif %}
  {% endfor %}

</div>
