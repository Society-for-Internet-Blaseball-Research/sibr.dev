---
layout: "../../layouts/BlogPage.astro"
title: "Reaching Insights about Stuff: Getting A Broad Picture With Linear Modeling"
authors: 
- name: "glumbaron"
date: "January 22, 2023"
description: "Let's use basic linear modeling to get a sense of how player attributes affect performance!"
tags: []
---
# Reaching Insights about Stuff: Getting A Broad Picture With Linear Modeling

The new era of Blaseball has come with a completely rewritten simulation with completely new attributes. Many of us in SIBR want to figure out what these attributes do! But it's hard to know where to look first, or how to study them. And it's tempting to want to figure out "the whole picture" for a given interaction or attribute. But I want to take a simpler approach. Rather than try to solve a question like "what does thwack do," I want to get a broad sense of what attributes are *related to* various performance stats. To do this, let's just use one of the simplest tools available to a statistician: [linear regression](https://en.wikipedia.org/wiki/Linear_regression).

I'm using R (through RStudio and the tidyverse ecosystem) for this post, because it's designed for statistical analysis, it's elegant at it, and I wanted to learn how to use it better. Plus it lets me write pretty reports like this using RMarkdown!

If you want to skip around, here are some heading links:

-   [Summary](#summary)
-   [Data Loading & Cleaning](#loading)
-   [Batting](#batting)
-   [Pitching](#pitching)
-   [Fielding](#fielding)

## Summary {#summary}

Maybe you're thinking, "why do you want me to look at all those numbers? Just tell me what does what." Well, I can't *really* tell you what does what, because correlation does not equal causation. But I can at least summarize the findings at the top. Here I have grouped the results by category "+Stat" means "this attribute is positively correlated with this statistic," and "-Stat" means "this attribute is negatively correlated with this statistic."

-   Batting
    -   Sight: +BA, +OBP, +SLG. +BB/PA, -SO/PA.
    -   Thwack: +BA, +OBP, +SLG. +BB/PA, -SO/PA.
    -   Ferocity: +BA, +OBP, +SLG, strongly. +HR/H, -1B/H
-   Pitching
    -   Control: -ERA, +SO9, -BB9
    -   Stuff: -ERA, +SO9, -H9, -HR9, (-BABIP??)
    -   Guile: -ERA, +SO9, -H9, -HR9, (-BABIP???)
-   Running
    -   Dodge: didn't find anything! ¯\\\_(ツ)\_/¯
    -   Hustle: didn't find anything! ¯\\\_(ツ)\_/¯
    -   Stealth: +BA, +OBP, +SLG, somehow. +3B/H, +2B/H, -1B/H, somehow.
-   Fielding
    -   Reach: +Plays Fielded
    -   Magnet: +Outs/Plays Fielded
    -   Reflex: -Advances Allowed, +Double Plays
-   Vibes
    -   Thrive: it's vibes lol
    -   Survive: it's vibes lol. Saw a weak signal in HR/H, but have no idea what that means.
    -   Drama: it's vibes lol

## Data Loading & Cleaning {#loading}

First, of course, we load the data. I've already done the work of joining the player stats from [Abyline's Season N1 stats spreadsheet](https://docs.google.com/spreadsheets/d/18_FR5DaN3w4PrxawNHbUXgeBum6ia0X-PF5jHmIRAtY/edit#gid=394555595) to player attributes gathered from our `https://api2.sibr.dev/mirror/players` endpoint, and saved it as a CSV file. You can find a copy of this CSV file [here](https://faculty.sibr.dev/~glumbaron/player_stats_attrs_day90.csv).


```r
library(tidyverse)
library(janitor)
library(sjPlot)

players_stats <- read_csv("player_stats_attrs_day90.csv")

# Clean column names and calculate columns we'll want later
players_stats <- players_stats %>%
  clean_names() %>%
  select(-heatmap) %>%
  mutate(
    # batting: walk rate and strikeout rate
    bb_pa = bb / pa,
    k_pa = k / pa,
    # batting: rate of types of hit
    x1b_h = x1b / hit,
    x2b_h = x2b / hit,
    x3b_h = x3b / hit,
    hr_h = hr / hit,
    xbh_h = (x2b + x3b) / hit,
    # fielding: rate of hit types allowed per hits, or per BIP
    x1b_h_f= x1b_alwd / hits_alwd,
    x1b_bip_f= x1b_alwd / totl_fields,
    x2b_bip_f= x2b_alwd / totl_fields,
    x3b_bip_f= x3b_alwd / totl_fields,
    adv_fields = adv_alwd / totl_fields,
    # fielder Manhattan distances from bases
    home_dist = abs(posx - 0) + abs(posy - 0),
    first_dist = abs(posx - 2) + abs(posy - 0),
    second_dist = abs(posx - 2) + abs(posy - 2),
    third_dist = abs(posx - 0) + abs(posy - 2),
    fifth_dist = abs(posx - 0) + abs(posy - 4),
    zeroth_dist = abs(posx - 4) + abs(posy - 0),
  )
```

Now we have a data frame with attributes, batting stats, pitching stats, and fielding stats all together. It's much too wide to display usefully here, sorry.


```r
head(players_stats)
```

```
## # A tibble: 6 × 102
##   id       name  team_…¹ locat…² locat…³ posit…⁴ modif…⁵ overa…⁶ batti…⁷ pitch…⁸
##   <chr>    <chr> <chr>   <chr>     <dbl> <chr>   <chr>     <dbl>   <dbl>   <dbl>
## 1 df94a33… Pang… Moab H… LINEUP        0 [(3, 2… <NA>       2.45    3.89    1.60
## 2 ceb5606… Lond… Moab H… ROTATI…       1 [(0, 2… <NA>       2.95    3.03    3.15
## 3 9ba361a… Moon… Moab H… ROTATI…       4 [(5, 0… <NA>       2.38    2.53    3.67
## 4 ff5a37d… Dunn… Moab H… ROTATI…       3 [(0, 5… <NA>       2.53    1.17    4.64
## 5 51dab86… Crav… Moab H… LINEUP        7 [(0, 1… <NA>       2.35    3.48    2.88
## 6 8c02857… Will… Moab H… LINEUP        8 [(4, 1… <NA>       1.99    3.97    2.12
## # … with 92 more variables: defense_rating <dbl>, running_rating <dbl>,
## #   vibes_rating <dbl>, sight <dbl>, thwack <dbl>, ferocity <dbl>,
## #   control <dbl>, stuff <dbl>, guile <dbl>, reach <dbl>, magnet <dbl>,
## #   reflex <dbl>, hustle <dbl>, stealth <dbl>, dodge <dbl>, thrive <dbl>,
## #   survive <dbl>, drama <dbl>, posx <dbl>, posy <dbl>, pa <dbl>, ab <dbl>,
## #   hit <dbl>, k <dbl>, bb <dbl>, x1b <dbl>, x2b <dbl>, x3b <dbl>, hr <dbl>,
## #   fc <dbl>, dp <dbl>, tp <dbl>, sac <dbl>, rbi <dbl>, ba <dbl>, obp <dbl>, …
```

## Batting {#batting}

From here, we can look at whatever we want. Let's start simple: what attributes of the batter are related to their batting average?


```r
s_ba <- summary(lm(ba ~ sight + thwack + ferocity + control + stuff + guile + dodge + hustle + stealth + reach + magnet + reflex + thrive + survive + drama, data = players_stats))
tab_model(s_ba, show.ci = FALSE, show.se = TRUE, digits=4, digits.p=2, p.style="scientific_stars")
```

<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">ba</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0167 <sup></sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0124</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">1.81e&#45;01</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">sight</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0387 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0068</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>4.19e&#45;08</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">thwack</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.1064 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0069</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>4.40e&#45;36</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">ferocity</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.1715 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0067</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.56e&#45;66</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">control</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.0158 <sup>*</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0061</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.07e&#45;02</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">stuff</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.0045 <sup></sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0062</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">4.70e&#45;01</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">guile</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.0148 <sup>*</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0057</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.04e&#45;02</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">dodge</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.0017 <sup></sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0060</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">7.74e&#45;01</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">hustle</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0088 <sup></sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0067</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">1.93e&#45;01</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">stealth</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0521 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0068</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>8.04e&#45;13</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">reach</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0063 <sup></sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0063</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">3.16e&#45;01</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">magnet</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0126 <sup>*</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0061</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>3.92e&#45;02</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">reflex</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0055 <sup></sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0059</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">3.50e&#45;01</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">thrive</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.0017 <sup></sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0065</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">7.99e&#45;01</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">survive</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0060 <sup></sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0065</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">3.54e&#45;01</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">drama</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0082 <sup></sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0064</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">2.00e&#45;01</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">224</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.854 / 0.843</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>

This looks over-fit to me, but there are several very strong dependencies. Let's drop all but the most significant ones:


```r
s_ba <- summary(lm(ba ~ sight + thwack + ferocity + stealth, data = players_stats))
tab_model(s_ba, show.ci = FALSE, show.se = TRUE, digits=4, digits.p=2, p.style="scientific_stars")
```

<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">ba</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0225 <sup>**</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0070</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.40e&#45;03</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">sight</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0369 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0069</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>2.10e&#45;07</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">thwack</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.1065 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0070</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>2.45e&#45;36</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">ferocity</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.1725 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0068</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.50e&#45;67</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">stealth</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0533 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0067</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.05e&#45;13</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">224</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.838 / 0.835</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>

The fit quality is almost identical with just four factors, so I think we're justified dropping the others. My conclusion: Batting average is positively correlated with **ferocity**, **thwack**, **stealth**, and **sight** (in roughly that order). Stealth's presence here is weird; I expected hustle might matter just from the plain meaning of the word, but not stealth.

For the rest of this post I'll skip to the "best" fit I have, but this is in general how I do these. I am not trying to make strong claims, so I am not worrying about whether my statistical practice is optimal. I'm also skipping showing the code; it all looks pretty much identical to the previous block, just with different variables, and different formatting arguments.

Onward to on-base percentage and slugging percentage:

<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">obp</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0785 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0072</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>2.16e&#45;22</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">sight</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0473 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0071</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>2.44e&#45;10</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">thwack</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0780 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0072</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>3.93e&#45;22</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">ferocity</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.1644 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0070</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>6.54e&#45;62</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">stealth</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0508 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0069</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>4.73e&#45;12</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">224</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.803 / 0.799</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>
<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">slg</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.0753 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0170</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.53e&#45;05</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">sight</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0853 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0168</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>8.74e&#45;07</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">thwack</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.2156 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0171</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>7.35e&#45;28</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">ferocity</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.3801 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0165</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>2.44e&#45;60</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">stealth</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.2203 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0164</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>2.34e&#45;30</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">224</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.825 / 0.822</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>

Wow, it's the same four attributes! For OBP, it's **ferocity**, **thwack**, **stealth**, and **sight** (sight is a bit stronger here than for BA). For SLG, it's **ferocity**, **stealth**, **thwack**, and **sight**, with ferocity being almost twice as strong as stealth and thwack, which are on par with each other. Interesting. Let's do walk rate and strikeout rate next:

<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">bb/pa</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0592 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0026</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.39e&#45;58</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">sight</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0159 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0033</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>2.54e&#45;06</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">thwack</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.0297 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0033</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.44e&#45;16</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">224</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.305 / 0.298</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>
<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">k/pa</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.3534 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0055</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>6.59e&#45;145</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">sight</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.0863 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0068</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>8.26e&#45;28</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">thwack</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.2095 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0069</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>7.78e&#45;81</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">224</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.840 / 0.838</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>

They're both just **sight** and **thwack**! Perhaps sight helps you draw walks and avoid strikeouts, while thwack makes both less likely. My guess is that higher thwack batters put the ball into play more, which would make both these outcomes less frequent. Important note, though: The R^2^ for BB/PA is *much lower* than the other fits we've done so far, which suggests that most of the variation is not being captured by our variables. Which makes sense; I'm not considering pitcher attributes at all (I can't, with this dependent variable).

So what's up with stealth from earlier? Stealth is important for "power"? That's weird. Let's look at the rates of types of hit relative to total hits, so HR/H, 3B/H, etc:

<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">hr/h</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0611 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0092</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>2.09e&#45;10</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">ferocity</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.1156 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0115</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>9.23e&#45;20</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">survive</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.0369 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0110</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>9.53e&#45;04</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">224</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.335 / 0.329</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>
<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">3b/h</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0044 <sup></sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0040</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">2.71e&#45;01</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">stealth</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.1049 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0075</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>3.12e&#45;32</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">224</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.468 / 0.465</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>
<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">2b/h</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.1719 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0088</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>7.81e&#45;50</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">stealth</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.4005 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0165</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.41e&#45;64</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">224</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.727 / 0.726</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>
<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">1b/h</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.7568 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0138</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.69e&#45;130</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">ferocity</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.0905 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0175</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>5.31e&#45;07</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">stealth</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.4840 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0175</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>8.21e&#45;74</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">224</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.782 / 0.780</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>

I've cut down variables pretty aggressively here. The R^2^ values aren't all that high for some of these, no matter how many batter attributes I include. Clearly, it's not just up to the batter---the pitcher and defense should matter for these! The best I've got is the observation that **ferocity** increases home run rate, **stealth** increases double and triple rate, and both of those, in turn, decrease single rate the same amount that they increase the other outcomes. There is also my first trace of a vibes attribute, as **survive** seems to be showing up in the home run rate. It's a negative factor, though, which I don't understand. I have no current model for how vibes might work, though, so I'm just glad to see one of the vibes attributes stick around in anything, even if it's barely below the 0.001 significance threshold for the weakest fit in this set. As another friend put it, "someone in the data set hits home runs, and we think they might have less survive, but we're not sure" is probably the most you can conclude from that relationship.

## Pitching {#pitching}

Now let's move on to pitching stats! First, perhaps the most general pitching stat, ERA:

<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">era</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">6.4636 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.2177</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>9.27e&#45;56</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">control</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;1.6023 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.2322</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>3.00e&#45;10</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">stuff</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;2.3187 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.2174</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>6.99e&#45;19</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">guile</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;1.3332 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.2373</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.37e&#45;07</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">119</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.657 / 0.648</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>

ERA has a strong relationship with all 3 pitching attributes. In order of importance, **stuff** \> **control** \> **guile**, though it's fairly balanced. The R^2^ of 0.65 suggests that there is a lot more going on than just this, which is good, because of course there is.

Now, let's look at rate stats for outcomes. Strikeouts per 9 innings:

<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">so 9</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">1.5499 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.2293</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>6.03e&#45;10</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">control</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">1.6609 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.2446</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>5.18e&#45;10</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">stuff</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">4.8418 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.2290</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.99e&#45;41</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">guile</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">2.5841 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.2500</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>4.13e&#45;18</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">119</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.857 / 0.853</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>

Strikeouts seem to be **stuff** \> **guile** \> **control**. Plausibly, "better stuff" is harder to hit, and "trickier pitches" are as well. To look deeper at this, if I had a per-pitch data set I would want to investigate swinging strikes with a logistic regression.

Now, walks per 9 innings:

<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">bb 9</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">4.5057 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.2168</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>9.51e&#45;41</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">control</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;5.0199 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.2313</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.76e&#45;42</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">stuff</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.5268 <sup>*</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.2165</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.65e&#45;02</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">guile</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.3886 <sup></sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.2363</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">1.03e&#45;01</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">119</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.812 / 0.808</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>

~~You heard it here, folks; stuff increases walks.~~ Seriously though, it's really just **control**. If you can throw strikes, you won't walk people. Remarkable! If you plot the relationship, it's quite clear, and also not actually linear (I should do another post that just has a bunch of plots, honestly).

![Scatter plot of BB/9 versus Control. Walk rate appears to be inversely related to Control, in some fashion.](/blog/basic-linear-modeling/bb9.png)

Let's look at hits per 9 innings next:

<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">h 9</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">11.0716 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.3107</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>2.52e&#45;64</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">stuff</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;3.3510 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.3629</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.48e&#45;15</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">guile</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;2.0845 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.3934</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>5.62e&#45;07</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">119</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.527 / 0.519</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>

Hits depend on **stuff** and **guile**, it seems. We're barely above 0.5 R^2^, though, so clearly the pitcher is not the only determinant of this; the batter and defense factors will matter a lot too.

Now, how about home runs per 9? Those probably don't depend on the defense.

<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">hr 9</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">1.4010 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0601</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.45e&#45;45</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">stuff</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.5736 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0702</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>4.39e&#45;13</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">guile</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.2750 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0761</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>4.50e&#45;04</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">119</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.436 / 0.426</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>

Home run rate also depends on **stuff** and **guile**, but less strongly: only about 0.425 R^2^. I could be glib and say that 40% of home runs is the pitcher, 40% is the batter, and 20% is, I don't know, the pitcher and batter heatmaps. But I won't say that. You can't pin that on me!

Last fit for this section: batting average on balls in play (BABIP). In the Beta-era simulation, pitchers had a pretty significant impact on this, through Unthwackability. Do we still see that sort of impact in the new simulation?

<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">babip</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.3301 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0103</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>3.46e&#45;59</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">control</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0043 <sup></sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0110</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">6.96e&#45;01</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">stuff</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.0410 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0103</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.19e&#45;04</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">guile</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.0307 <sup>**</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0112</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>7.22e&#45;03</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">119</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.190 / 0.169</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>

This fit is quite rough. **Stuff** has the strongest relationship to BABIP of the three pitching attributes, but...just look at it. It's not strong. But maybe it's not nothing? It's definitely nowhere near as strong as Unthwackability used to be, though.

![Scatter plot of BABIP versus a linear combination of Stuff and Guile. The relationship seems very weak; there is a possible hint of a negative slope, but tons of scatter.](/blog/basic-linear-modeling/babip.png)

## Fielding {#fielding}

The fielding stats that we have in this data set aren't very sophisticated, so we can only do so much with them. But we can at least get a start, here. Besides, it's much harder to interpret a complicated derived stat regressed against attributes, because there is so much more going on. Let's start with a super basic one: how many plays will a fielder actually get?

<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">totl fields</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">108.6787 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">17.2095</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.47e&#45;09</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">reach</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">302.2577 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">19.3756</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.92e&#45;37</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">magnet</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">8.6891 <sup></sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">18.8928</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">6.46e&#45;01</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">reflex</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">11.5943 <sup></sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">18.1542</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">5.24e&#45;01</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">224</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.527 / 0.521</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>

It seems that total balls fielded only depends on **reach**. And this is obviously quite incomplete; R^2^ of 0.5 is Not So Great.

The next natural question to ask is, what about the fielder's rate of getting outs from balls in play (i.e, `outs/plays)`?

<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">outs/plays</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.6437 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0045</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.12e&#45;219</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">magnet</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.1921 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0077</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.52e&#45;66</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">224</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.738 / 0.737</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>

This seems to just be related to **magnet**. This at least has more explanatory power than reach did above (I guess, if you're willing to interpret R^2^ that way, which is probably wrong in some way that I can't explain properly?).

Beyond this, the stats I have here stop being very amenable to this kind of analysis. The problem is, they're mostly all the same. The more reach you have, the more plays you're involved in, so the more outs you get, but also the more "hits you give up", the more "runs you allow", etc. Having more magnet seems to increase the "good" defensive outcomes and decrease the "bad" ones. None of that adds any insight.

But there is one more thing I want to try. Let's get bold and look at double plays started for each fielder. Thanks to my buddy Nate (GraveError on discord), who saw these trends when looking at high-double-play fielders and suggested them to me.

<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">double plays</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">8.3421 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">1.0772</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>3.44e&#45;13</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">reflex</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">6.1571 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">1.2423</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.43e&#45;06</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">first dist</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;1.9730 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.1893</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>5.94e&#45;21</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">224</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.383 / 0.378</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>

**Reflex** is the only defense attribute that contributes here. The other factor I've included, `first_dist`, is "[Manhattan distance](https://xlinux.nist.gov/dads/HTML/manhattanDistance.html) from the fielder's position to first base." Fielders with higher reflex turn more double plays, and fielders closer to first base turn *fewer*---perhaps they choose to take the out at first more often. This fit only captures \~40% of the variance, so it's sketchy, but I'm honestly impressed it even does that well. I tested the distance to every other base as well (yes, including 0th and 5th), and distance to first is by far the best predictor of the set.

By the way, I didn't find even a hint of a relationship between batter attributes and *grounding into* double plays. It's probably mostly on the defense, I guess?

Let's finish up by looking at runner advances allowed, divided by balls fielded:

<table style="border-collapse:collapse; border:none;">
<tr>
<th style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm;  text-align:left; ">&nbsp;</th>
<th colspan="3" style="border-top: double; text-align:center; font-style:normal; font-weight:bold; padding:0.2cm; ">advances/fields</th>
</tr>
<tr>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  text-align:left; ">Predictors</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">Estimates</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">std. Error</td>
<td style=" text-align:center; border-bottom:1px solid; font-style:italic; font-weight:normal;  ">p</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">(Intercept)</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0714 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0041</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>9.35e&#45;44</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">reflex</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.0500 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0068</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>3.27e&#45;12</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">home dist</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">&#45;0.0065 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0007</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>6.15e&#45;17</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; ">reflex × home dist</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0060 <sup>***</sup></td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  ">0.0012</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:center;  "><strong>1.03e&#45;06</strong></td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm; border-top:1px solid;">Observations</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left; border-top:1px solid;" colspan="3">224</td>
</tr>
<tr>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; text-align:left; padding-top:0.1cm; padding-bottom:0.1cm;">R<sup>2</sup> / R<sup>2</sup> adjusted</td>
<td style=" padding:0.2cm; text-align:left; vertical-align:top; padding-top:0.1cm; padding-bottom:0.1cm; text-align:left;" colspan="3">0.397 / 0.389</td>
</tr>
<tr>
<td colspan="4" style="font-style:italic; border-top:double black; text-align:right;">* p&lt;0.05&nbsp;&nbsp;&nbsp;** p&lt;0.01&nbsp;&nbsp;&nbsp;*** p&lt;0.001</td>
</tr>

</table>

This is not independent of double plays, of course; if you successfully turn double plays you prevent runners from advancing. But it might also include ability to "hold the runners," though that is very speculative. I need to stress: this is probably the sketchiest fit in this entire post. Including the distance from home plate increases the R^2^ from 0.1 to 0.3, which is kind of wild given how small that coefficient is. But regardless, the *hint* of a signal here is something like this: **reflex** might be involved in handling baserunners, and infielders might have a better shot at holding runners than outfielders.
