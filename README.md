# Welcome to Make Champion Mastery Great Again!

This project was completed within one week for the [3rd Riot Games API Challenge](https://developer.riotgames.com/discussion/announcements/show/eoq3tZd1).

For a demo of this project head over to [http://championmastery-apichallenge3.rhcloud.com](http://championmastery-apichallenge3.rhcloud.com).

With our website you can visualize champion mastery statistics for both personal and global interpretation.
From the mastery gains per game we calculate an average points gain per game over the course of 1 week and used this data to rank summoners and champions according to their performance.

Because Riot is not providing mastery gains for games at the moment, we had to circumvent this limitation. We requested all recent games for each registered summoner every 20 minutes and recorded data as we found new games. If a new game was found, we requested the current champion mastery and calculated the difference between the total mastery points before and after the game. This process has one very important flaw: if we miss one game (for a champion and summoner) our calculated gains are wrong or will be wrong for 1 game in the future. A more in-depth description is provided in [Structure](Structure.md).
Based on these informations supplemented by the general stats from the champion mastery endpoint we show different statistics for each summoner and champion.

This information includes Mastery Progression (average gains per game and total mastery points), highest grade and mastery level distribution as well as gains for the recent games.

# Examples

* [Summoner](http://championmastery-apichallenge3.rhcloud.com/#/home/Thalies)
* [Champion](http://championmastery-apichallenge3.rhcloud.com/#/home/Lucian)
* [Top10 Players](http://championmastery-apichallenge3.rhcloud.com/#/player)
* [Top10 Champions](http://championmastery-apichallenge3.rhcloud.com/#/)
* [Progression](http://championmastery-apichallenge3.rhcloud.com/#/home/Katarina/Thalies)

# Documentation

* [Structure](docs/Structure.md): Contains information about the structure and interaction of the different modules
* [Endpoints](docs/Endpoints.md): Documentation of endpoints and request types

# Installation

## Requirements

* MySQL (recommended: v.5.6.28)
* Node (recommended: v5.7.1)
* AngularJS
* Angular Materials
* ChartJS

## Install

1. Go to [default.json](config/default.json) and update the config
  * Set the database password, user, host and database name
  * Make sure the database does not exist or you don't need the content of that database anymore
  * Set your API-Key Limits
  * Adjust the port if necessary
2. Run npm install from the root directory
  * You may need to use sudo npm install on Linux
3. cd into the install directory and execute node install.js
  * optional parameter: example
    * this will install the example database (which does not contain many data points but it's better than nothing)
4. Output should be something like:
  * Finished importing sql. Your install is now ready.
  * if it says couldn't delete database additonally everything is well.
  * if it says something different you might need to check mysql is running and your settings are correct.
5. Set your API Key and region as environment variables
  * API_KEY
  * API_REGION
6. Execute node start.js
  * Parameters
    * no-collection if you want to disable data collection
      * recommended if you just want to test the project
    * no-server if you want to disable the frontend and the API

# Disclaimer

Make Champion Mastery Great Again isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.
