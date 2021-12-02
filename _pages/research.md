---
title: SIBR Papers
---

{% assign papers =  site.papers | sort:"date" %}

{% for paper in papers %}
* [{{ paper.title }}](/papers/{{ paper.file }}) ({{ paper.date | date: "%Y" }})
{% endfor %}