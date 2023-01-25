---
layout: "../../layouts/BlogPage.astro"
title: "Whytool: Process and Design Choices for Whichtool"
authors: 
- name: "Kawa Teaño, @ProcGenKawa"
date: "January 24, 2023"
description: "Tell me about the toolkit and design thoughts behind whichtool, the interactive Blaseball tool directory."
tags: [Meta]
---

In the early times of the Expansion Era, I began development of a tool in Twine called [*whichtool*][1]. This is a post about what it is and the design considerations that went into its creation, targeted to fellow Blaseball fans, with the hope that it will encourage contributions to it. 

[1]: https://whichtool.sibr.dev

SIBR is a great community! Many of its members are inspired to make tools using the Blaseball API, ranging from [ways to compare player info][2] to [team comparison scatter charts][3] to [entire Python wrappers for people to roll their own analyses][4]. And of course, since we're talking about the fandom of an absurd video game, there's also a bunch of things about salmon, both [clearly blaseball relevant][5], to uh, [being nerd sniped by 1990s research software][6].

[2]: https://astrology.sibr.dev
[3]: https://chartographer.sibr.dev/ 
[4]: https://jmaliksi.github.io/blaseball-mike/ 
[5]: https://hora.github.io/blaseball-scoreboard/ 
[6]: https://salmon.sibr.dev/steve.html 

But as you can see, all of these tools are scattered across people's individual servers, or tucked away in some corner of the SIBR discord, often with less than obvious names. (This was even more true in the past, before the organization offered URL redirection and dedicated hosting on Emily Dogbone and Carol Revenant, our [big beefy bare metal bois that we love dearly.][7]) 

[7]: https://www.patreon.com/posts/update-hackathon-57479652 

So SIBR's help desk was always inundated with requests to help people find that one tool they knew existed somewhere. While we were generally fine with this - it was a way for newer players to engage with the community, and learn what was out there - it was repetitive, and took energy that I felt could be better spent with the *results* of utilizing these tools. If people spent less time answering the same questions, maybe we'd get different questions, that would lead to more robust analysis, or at least funnier data crimes.

I knew any semi-automated tool to collect that information would need to be something that: 

- I could edit easily.
- Would feel 'friendly', like going to the #help-desk channel in the SIBR Discord and asking someone a question.

## Twine is my best friend, reply if Twine is your best friend too

Twine is, at its most basic form, a web based tool, originally designed to be a game engine for [choice based interactive fiction][8]. It's a pretty intuitive way to build a branching tree of text options. I'd previously used Twine to write interactive fan fiction[^1], so i was intimately familiar with how it worked! So I set up a new 'story' with similar settings to my last project, nice and easy.

[8]: https://iftechfoundation.org/frequently-asked-questions/#:~:text=Compared%20to%20parser%20IF%2C%20choice,Choose%20Your%20Own%20Adventure%20book
[^1]: That project is Not Safe For Blaseball Audiences in a way that you won't get the link here. However, I'll allude to it in this footnote like so: it used [macros](https://github.com/apepers/DiscoElysiumTwineMacros) made by Alexei Pepers to get Twine to use the UI of *Disco Elysium*. 

One part of that was bringing in tools from Emilia Lazer-Walker's work [turning Twine into something more "modern developer" friendly][9]. Emilia’s post goes into the details of how this all works, but in this case, all you need to know is that it let me:

[9]: https://blog.lazerwalker.com/azure,/game/dev/2020/01/16/a-modern-developers-workflow-for-twine.html

- Work in a development environment (I use Visual Studio Code) which gave me syntax highlighting, robust search/replace, and other tools
- Keep all my progress in Github instead of my local machine, and use Github Desktop for push/pull functions, version control, taking on other people’s contribution, automatically publish updates, and all other features Git provides.
- Split the text into multiple files, separating out the main help desk flow and the text for each individual tool (I intended this to mean that project maintainers could focus on their project's text, but it didn't work out that way).

## Automated help line function, friendly tone

I made an incidental decision that turned out to be really important to whichtool's success: I tried, as best as possible, to replicate the experience of asking in help-desk what a person was looking for. 

This meant a conversational tone, with extensive usage of second person and follow up questions. This also meant including silly projects (like "How to imitate a squid") and trying to guess what people were looking for, more than throw at them the names of projects (so asking if you wanted  "Schedules and derived statistics like batting averages" before telling you it was named blaseball-reference, for instance.) 

It made something that could have felt like an impersonal automated help line into something that was friendly and kind, helping you to navigate the tangled webs of the fandom of this game.

In retrospect, I took a lot of inspiration from *A Hindren's Guide to Qud*, by Caelyn Sandel. That no longer exists in its original form - it's now a set of mods within Caves of Qud itself, after Freehold Games hired Caelyn to write for them officially[^2] - but in either case, it was an "in-unverse" guide helping you survive in that legendarily difficult game. And since it's narrated by in-universe entities, it allowed for that conversational tone, instead of purely being a list of tips and resources. 
[^2] More info on its current form, *The Qud Survival Guide*, [here on her itch.io](https://inurashii.itch.io/the-qud-survival-guide).

I think it's paid off! People have called out this tone as being a big part of its appeal, and that's been lovely to see. 

## Whichtool needs you!

The thing that's both good and bad about whichtool's unique approach is that it relies on not just project names and locations, but an understanding what each project is and what it's designed to accomplish. In Expansion, I did a reasonable job of this, partially by being willing and able to ask around SIBR for details on things I didn't understand. 

But now in Coronation, I've hit an inflection point - keeping track of blaseball as a community is a really significant task, and meanwhile my own life has gone in different directions[^3]. I want to keep whichtool useful for the community, and I'd really appreciate any contributions to keep it up to date as blaseball keeps shifting and tools keep getting refined. 
[^3] Notably, between Expansion and Coronation I've done a complete industry/professional swap, spurred partly by doing documentation work like whichtool; but also I've gotten into other games and fandoms, too! 

I hope I've done a decent job of writing [documentation](https://github.com/kawa-kitsuragi/whichtool) for how to contribute to the tool - if you're a bit comfortable with Github I think it's pretty straightforward - and am happy to answer questions. Please let me know, and let's keep whichtool answering questions for many data witches for the eras to come.