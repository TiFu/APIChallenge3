# Structure

Our server spawns one process for data server and another instance for delivering the website and running the API.

## Data Server

Data Server consists of four modules, each fulfilling one step of the analysis process.
These modules need access to the API provided by Riot Games and is the only part of our application actively sending requests to the API.

### Static Data
The static data modules updates the static data we hold in our database. This currently includes an update to the available champions which is run one time per day.

### Data Collection
Data Collection is the heart of our application. It monitors the games each summoner plays and saves the new mastery points after the game.

This module executes its routine every 20 minutes - this is the minimum amount of time in which a summoner can finish a normal/ranked game.
In each iteration we request the recent games for each summoner and check if there is a new game. If there is one, we save the new state of the summoner's champion mastery for the champ in that game. This can be used to calculate the mastery gains in each game, which is done in the analysis module.
This needs two requests per summoner every 20 minutes.

### Analysis Module

The analysis module is responsible for calculating the mastery gains for each new game added by data collection.
This is simply done by comparing the scores between the newest game and the game before that and subtracting the total mastery points after each game.
These gains are then used to display different statistics like gains/game, average gains per week and champion rankings based on mastery performance to summoners visiting our website.

### Current Mastery

The current mastery module updates mastery scores for each summoner each day so we can show the users some static statistics about their total mastery of champions such as grade distribution, level distribution etc.

## Website

The website hosts the actual page visible to people visiting our site.
It is based on a REST-API in the backend (which is documented in [Endpoints](Endpoints.md). The frontend is based on angular and uses chart.j to visualize our statistics.
