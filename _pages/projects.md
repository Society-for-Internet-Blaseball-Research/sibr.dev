---
title: SIBR Projects
permalink: /projects
excerpt: The project directory for SIBR
---
The following projects are hosted on the SIBR servers or use other resources provided by SIBR:

{% assign projects = site.projects | sort: 'name' %}
{% for project in projects %}
{::options parse_block_html="true" /}

<div class="project"><div class="project-title">

## {{ project.name }}

{% assign types = project.types | split: ', ' %}

<span class="properties">{% for type in types %}
<span class='category {% case type %}
{% when "Viewing Live Games" %}
  category-view
{% when "Games Analysis" %}
  category-analysis
{% when "Betting (#betting-and-voting)" %}
  category-betting
{% when "Miscellaneous" %}
  category-misc
{% when "Harvesting Data (#archivism)" %}
  category-archivism
{% when "Viewing Past Games" %}
  category-past-games
{% when "Datablase and Clients" %}
  category-datablase
{% when "Blaseball.com API Clients (#blaseball-api)" %}
  category-api
{% when "Papers + Paper Accessories" %}
  category-paper
{% when "Forbidden Knowledge" %}
  category-forbidden
{% when "Blaseball.com Scripts and Parsers (#site-js)" %}
  category-scripts
{% endcase %}'>{{type}}</span>{% endfor %}
</span>
</div>


{{ project.content }}

{% if project.contributors %}
* **Contributors**: {{ project.contributors }}
{% endif %}
{% if project.site %}
* **Site**: [{{ project.site }}]({{ project.site }})
{% endif %}
{% if project.code %}
* **Code**: [{{ project.code }}]({{ project.code }})
{% endif %}
{% if project.tasks %}
* **Project Board / Task Lists**: [{{ project.tasks }}]({{ project.tasks }})
{% endif %}
</div>
{% endfor %}