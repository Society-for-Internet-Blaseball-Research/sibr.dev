---
title: SIBR API Directory
excerpt: The API directory for SIBR
layout: "../layouts/Page.astro"

---

\<Port this page from liquid to astro\>


<!-- 
{% assign apis = site.apis | sort_natural: 'name' %}
{% for api in apis %}
{::options parse_block_html="true" /}

<div class="project"><div class="project-title">

## {{ api.name }}

{% if api.status_slug %}
<a href="https://status.sibr.dev/services/{{ api.status_slug }}" target="_blank"><img src="https://status.sibr.dev/api/v1/badges/uptime/24h/{{ api.status_slug }}.svg" /></a>
{% endif %}

</div>

{{ api.content }}

{% if api.base_url %}
**Base URL**: [{{ api.base_url }}]({{ api.base_url }})
{% endif %}

{% if api.code %}
**Code**: [{{ api.code }}]({{ api.code }})
{% endif %}

{% if api.docs %}
**Documentation**: [{{ api.docs }}]({{ api.docs }})
{% endif %}
</div>
{% endfor %} -->
