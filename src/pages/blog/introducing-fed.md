---
layout: "../../layouts/BlogPage.astro"
title: "Fed, Solving the Stout Schmitt Problem"
authors: ["beiju"]
date: "January 11, 2023"
description: "The Feed is an extremely useful addition to blaseball, but dealing with it can be… frustrating."
tags: ["Beta", "Project"]
---

## what

Fed is a new feed parsing service under development. It acts as a middleman between your app and Eventually, Emily’s excellent Feed service. Fed forwards requests to Eventually almost verbatim (it requires a few specific parameters, which it will add if they’re not present). The events that Eventually returns in response are transformed into a machine-readable format before they’re returned to your app.

For now Fed is, by necessity, focused on archived data. If something like the Feed exists in 1.0, and I decide there’s still a need for this tool, I hope to carry it forward into the new Era. Even then it will likely not be available until at least the first full season has finished and possibly longer.

## why

The Feed is an extremely useful addition to blaseball, but dealing with it can be… frustrating. Player and team IDs being there is great, but they’re just in a list with no information about what role each of those players played in the event. Some event types, like ground out or mod added, are used for multiple different logical events (ground out, fielder’s choice, and double play for the former; party time, free will, and MVP for the latter). But by far the most annoying thing to do is parse information from the event text

There’s a lot of information that’s only available through event text: player names, hit type, steal success/failure, ground out subtype, siphon blooddrain action, charm and psychic walks/strikeouts, flooding results, and about a thousand others. If you need any information that’s only available in the text — and most applications do — the obvious thing to do is look for keywords in the text. Which, unfortunately, leads to

### The Stout Schmitt Problem

In season 19 it was discovered that, for 5 seasons, stout schmitt hadn’t gotten another walk — according to blaseball-reference.com. However, investigation on reblase showed that Stout was walking just fine. The Datablase, which powers blaseball-reference, used the presence of “out” in the update text to distinguish outs from walks. And since “Stout” has “out” in it, all their walks were counted as outs. The datablase is built on pre-Feed architecture, giving it compatibility with the Discipline era, but Stout has caused similar problems in Feed-based programs like resim.

The solution to this specific problem is simple — look for “ out “, with the spaces — but the problem of false positives for string keywords still applies. A solution, though not a perfect one, is to employ a parser. Designed to parse structured languages like source code, a partner can extract meaning from rigidly structured text. When the text is structured appropriately, parsers can unambiguously extract information from it. The blaseball event text is highly structured but unfortunately not completely ambiguous because there’s no way to know for sure when a player’s name has ended. Still, it eliminates a lot of sources of parsing error.

Fed parses event text, extracts player IDs, gathers data from sub-events, collates event metadata, and presents it all in a well-documented JSON format. My goal is for nobody to need to parse the feed ever again.

## when

A preview is out now at https://fed.sibr.dev/v1/events (you’ll need to add some parameters to limit it to events between season 12 and 15, otherwise you’ll get an error for now). Documentation is available at https://beiju.stoplight.io/docs/fed/branches/main/c856aaa92016b-fed-event, but it’s manually updated so it may not always reflect the latest deployed version. It’s currently complete from season 12 to season 15, but the existing schema will likely change to accommodate the additions of the mid and late Expansion era. This preview will be updated as I add new seasons.

## where

https://fed.sibr.dev/v1/events. Weren’t you listening?

## who

Hi! I’m beiju, I’m writing Fed and this article. I want this to become a community tool, and to that end, it would be great to get more people contributing. Check it out at https://github.com/beiju/fed. Contributions are welcome, especially ones that make getting on board more approachable!

## how

We’re done here.