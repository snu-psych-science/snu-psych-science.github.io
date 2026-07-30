---
title: 조직 및 구성원
---

{% include page-hero.html
  eyebrow="MEMBERS"
  description="심리과학연구소는 소장을 중심으로 운영위원회, 행정실, 그리고 다양한 심리학 연구 분야의 겸임연구원 및 연구진으로 구성되어 있습니다. 본 연구소는 기초 심리학, 응용 심리학, 임상·상담 심리학 등 여러 분야의 연구자들이 참여하는 학제적 연구 플랫폼을 지향합니다."
%}

{% include section.html %}

{% assign active_members = site.data.members | where: "active", true | sort: "order" %}
{% assign directors = active_members | where: "group", "director" %}
{% assign affiliated_members = active_members | where: "group", "affiliated" %}

<div class="member-table-wrap table-scroll" tabindex="0" aria-label="심리과학연구소 구성원 표">
  <table class="member-table">
    <thead>
      <tr>
        <th scope="col">직위</th>
        <th scope="col">성명</th>
        <th scope="col">연구 분야</th>
        <th scope="col">랩 웹사이트</th>
      </tr>
    </thead>
    {% if directors.size > 0 %}
    <tbody>
      {% for member in directors %}
        <tr>
          <th class="member-role" scope="row">{{ member.role }}</th>
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
    {% endif %}
    {% if affiliated_members.size > 0 %}
    <tbody>
      {% for member in affiliated_members %}
        <tr>
          {% if forloop.first %}<th class="member-role" scope="rowgroup" rowspan="{{ affiliated_members.size }}">{{ member.role }}</th>{% endif %}
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
    {% endif %}
  </table>
</div>
