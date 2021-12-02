---
title: SIBR Papers
---

* [Effects of “Blaserunning” decree on shame](https://research.blaseball-reference.com/blase-running-shame.pdf) (2020)
* [Correlation between a team’s subleague/division and the series they play](https://research.blaseball-reference.com/schedule-balance.pdf) (2020)
* [Wasted Potential: Optimizing team rosters by maximizing star ratings](https://research.blaseball-reference.com./Wasted_Potential_blaseball.pdf) (2020)
* [The Fourth Strike: Red Hot or Red Herring?](https://research.blaseball-reference.com/Fourth_Strike.pdf) (2020)
* [Understanding Replacement and Incineration in Blaseball via Permutation Tests](https://research.blaseball-reference.com/Incineration_Replacement_Permutation_Paper___Final_Draft.pdf) (2020)
* [Effect of the “Double Jumps” decree on playoff seeding](https://research.blaseball-reference.com/SIBR_Double_Jump_paper.pdf) (2020)
* [Mutually Arising: Improving accessibility in Discord team role color contrast](https://research.blaseball-reference.com/Improving_Accessibility__Contrast_in_Discord_Team_Roles_1.2.pdf) (2021)
* [Blaseball Is a Mess, Fair Play Is the Future: An analysis of odds, outcomes, and accuracy in the Peace and Prosperity Era](https://research.blaseball-reference.com/Fair_Play_is_the_Future.pdf) (2021)
* [A sinking feeling: Investigating the relationship between team eDensity and Level](https://research.blaseball-reference.com/SIBR_eDensity2.pdf) (2021)


{% assign papers =  site.papers | sort_natural:"name" %}

{% for paper in papers %}
* [{{ paper.title }}](/files/{{ paper.file }}) ({{ paper.year }})
{% endfor %}