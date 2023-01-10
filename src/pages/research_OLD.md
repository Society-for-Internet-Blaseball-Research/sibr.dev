---
title: SIBR Papers
layout: "../layouts/Page.astro"

---

{% assign papers =  site.papers | sort:"date" %}

{% for paper in papers %}
* [{{ paper.title }}](/papers/{{ paper.file }}) ({{ paper.date | date: "%Y" }})
{% endfor %}