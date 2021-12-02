---
title: SIBR Papers
---

{% assign papers =  site.papers | sort_natural:"name" %}

{% for paper in papers %}
* [{{ paper.title }}](/papers/{{ paper.file }}) ({{ paper.date | date: "%Y" }})
{% endfor %}