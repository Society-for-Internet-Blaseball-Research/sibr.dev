---
title: SIBR APIs
excerpt: The API directory for SIBR
permalink: /apis
---
{% for api in site.apis | sort: 'name' %}

## {{ api.name }}

{{ api.content }}

{% if api.base_url %}
**Base URL**: \[{{ api.base_url }}]({{ api.base_url }})
{% endif %}

{% if api.docs %}
**Docs Link**: \[{{ api.docs }}]({{ api.docs }})
{% endif %}

{% endfor %}