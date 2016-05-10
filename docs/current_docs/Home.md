# Welcome to Make Champion Mastery Great Again!

This project was completed within one week for the [3rd Riot Games API Challenge](https://developer.riotgames.com/discussion/announcements/show/eoq3tZd1).
For a demo of this project head over to [http://championmastery-apichallenge3.rhcloud.com](http://championmastery-apichallenge3.rhcloud.com).

With our website you can visualize champion mastery statistics for both personal and global interpretation.
From the mastery gains per game we calculate an average points gain per game over the course of 1 week and used this data to rank summoners and champions according to their performance.
Because Riot is not providing mastery gains for games at the moment, we had to circumvent this limitation. We requested all recent games for each registered summoner every 20 minutes and recorded data as we found new games. If a new game was found, we requested the current champion mastery and calculated the difference between the total mastery points before and after the game. This process has one very important flaw: if we miss one game (for a champion and summoner) our calculated gains are wrong or will be wrong for 1 game in the future. A more in-depth description is provided in [Structure](Structure.md).
Based on these informations supplemented by the general stats from the champion mastery endpoint we show different statistics for each summoner and champion.
These informationals include Mastery Progression (average gains per game and total mastery points), highest grade and mastery level distribution as well as gains for the recent games.

# Examples

* [Summoner](http://championmastery-apichallenge3.rhcloud.com/#/home/Khal%20Antony)
* [Champion](http://championmastery-apichallenge3.rhcloud.com/#/home/Lucian)
* [Top10 Players](http://championmastery-apichallenge3.rhcloud.com/#/player)
* [Top10 Champions](http://championmastery-apichallenge3.rhcloud.com/#/player)
* [Progression](http://championmastery-apichallenge3.rhcloud.com/#/home/Vayne/SHA%20BI%20NA%20ADC)


# Documentation

* [Install](Install.md)
* [Structure](Structure.md): Contains information about the structure and interaction of the different modules
* [Endpoints](Endpoints.md): Documentation of endpoints and request types

# Disclaimer

Make Champion Mastery Great Again isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.
