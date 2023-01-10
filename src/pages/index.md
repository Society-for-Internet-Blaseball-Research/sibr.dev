---
permalink: /
title: SIBR Homepage
layout: "../layouts/Page.astro"
redirect_from:
  - /index
---

<span class="mission">The **<span id="sibr">Society for Internet Blaseball Research</span>** is a community devoted to unravelling [Blaseball](https:/www.blaseball.com)'s deepest mysteries. We work together to make Blaseball data more accessible by creating tools, analyzing past games, and discovering new records. We are, in our own strange way, participating in the cultural event of Blaseball.</span>

## Historical

These are tools made during the past Eras of Blaseball - may or may not be functional. They remain here for prosperity.

* [![](/reference.png)][reference]
  [**Blaseball Reference**][reference] tabulates traditional baseball statistics, player leaderboards, and team schedules.
* [![](/reblase.png)][reblase]
  [**Reblase**][reblase] displays play-by-play data of live and past Blaseball games.
* [![](/before.png)][before]
  [**Before**][before] replays Blaseball from any moment recorded by the SIBR archives.
* [![](/blasebot.png)][blasebot]
  [**Blasebot**][blasebot] is a Discord bot for following games and providing information on players and teams.
* [![](/blases-loaded.png)][blases-loaded]
  [**Blases Loaded**][blases-loaded] is a mobile app for live-viewing Blaseball games, available on [iOS](https:/apps.apple.com/us/app/id1529695719) and [Android](https:/play.google.com/store/apps/details?id=com.raccoonfink.blobile).
* [![](/whichtool.png)][whichtool]
  [**whichtool**][whichtool] is an interactive tool picker that helps you find the right tools for your blaseball needs.
* [![](/research.png)][research]
  [**Research papers**][research] published by SIBR dive into data analysis and "what if?" scenarios.
* [![](/onomancer.png)][onomancer]
  [**Onomancer**][onomancer] is a webapp for people to submit and rate Blaseball names and form teams to share with friends.
</section>

[reference]: https://blaseball-reference.com
[reblase]: https://reblase.sibr.dev
[before]: https://before.sibr.dev
[blasebot]: https://github.com/BeeFox-sys/blasebot
[blases-loaded]: https://github.com/RangerRick/blobile
[research]: https://research.blaseball-reference.com
[onomancer]: https://onomancer.sibr.dev
[whichtool]: https://whichtool.sibr.dev/

<style>

  .mission {
    font-size: 1.3em;
  }

  ul {
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: .8em;
  }


  li {
    list-style-type: none;
    font-size: .8em;
  }

  li img {
    margin-bottom: .5em;
  }

</style>