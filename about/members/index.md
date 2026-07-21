---
title: 조직 및 구성원
---

<div class="page-hero page-hero--decorated" style="--page-hero-image: url('{{ site.header | relative_url }}')">
  <div class="page-hero__eyebrow">MEMBERS</div>
  <h1 class="page-hero__title">조직 및 구성원</h1>
  <p class="page-hero__description">심리과학연구소는 소장, 운영위원회, 행정실, 겸임연구원 및 연구진으로 구성되어 있습니다.</p>
</div>

{% include section.html %}

## 겸임연구원

{% assign active_members = site.data.members | where: "active", true | sort: "order" %}
{% assign directors = active_members | where: "group", "director" %}
{% assign affiliated_members = active_members | where: "group", "affiliated" %}

<div class="member-table-wrap table-scroll" tabindex="0" aria-label="심리과학연구소 구성원 표">
  <table class="member-table">
    <thead>
      <tr>
        <th>직위</th>
        <th>성명</th>
        <th>연구 분야</th>
        <th>랩 웹사이트</th>
      </tr>
    </thead>
    <tbody>
      {% for member in directors %}
        <tr>
          <td class="member-role">{{ member.role }}</td>
          <td>
            {% if member.faculty_url %}<a href="{{ member.faculty_url }}" target="_blank" rel="noopener noreferrer">{% endif %}
              {{ member.name }}
            {% if member.faculty_url %}</a>{% endif %}
          </td>
          <td>{{ member.research_area }}</td>
          <td>
            {% if member.lab_url %}
              <a href="{{ member.lab_url }}" target="_blank" rel="noopener noreferrer">{{ member.lab_label }}</a>
            {% else %}
              {{ member.lab_label }}
            {% endif %}
          </td>
        </tr>
      {% endfor %}
      {% for member in affiliated_members %}
        <tr>
          {% if forloop.first %}<td class="member-role" rowspan="{{ affiliated_members.size }}">{{ member.role }}</td>{% endif %}
          <td>
            {% if member.faculty_url %}<a href="{{ member.faculty_url }}" target="_blank" rel="noopener noreferrer">{% endif %}
              {{ member.name }}
            {% if member.faculty_url %}</a>{% endif %}
          </td>
          <td>{{ member.research_area }}</td>
          <td>
            {% if member.lab_url %}
              <a href="{{ member.lab_url }}" target="_blank" rel="noopener noreferrer">{{ member.lab_label }}</a>
            {% else %}
              {{ member.lab_label }}
            {% endif %}
          </td>
        </tr>
      {% endfor %}
    </tbody>
  </table>
</div>
