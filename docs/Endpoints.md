# Endpoints

The website has different endpoints to retrieve statistics.

The base url for all endpoints is /api/

All endpoints are POST-Endpoints unless noted otherwise!

Optional parameters are marked with ? in the url and with \[:paramName\] in the parameters section of each endpoint.

## Top10

### top10/champions/:all?

Returns a ranking of all or the top10 champions in the last week. Ranking is done by using the average gain per game.

**Parameters**

* [:all] - Return ranking of all champs

**Output**

Returns an [Top10-Object](top10-object) containing the following fields:

### top10/players/:all?

Returns a ranking of all/top10 players using the average gains per game for the last week.

**Parameters**

* [:all] - Return all players

**Output**

[Top10-Object](top10-object)

### top10/players/champion/:championId/:all?

Limits the top10 search of top10/players to one specific champion with the ranking parameter being the average mastery points gain in the last week.

**Parameters**

* :championId - valid champion id
* [:all] - Return all players which have a points gain associated with the champion with the given id

**Output**

[Top10-Object](top10-object)


## Static

This endpoints contain information about champions - either a complet list, by id or by name.

### [GET] static/champions

Returns all the info given by the other two endpoints in this category for all champions.

**Parameters**

* None

**Output**

Returns an Array<[Champion](champion)>

### [GET] static/champions/:id

Returns information about a champion by id.

**Parameters**

* :id - valid champion id (e. g. 1 for Annie)

**Output**

Returns a [Champion-Object](champion).

### [GET] static/champions/by-name/:name

Same as static/champions/:id but with the champion name instead.
An invalid name leads to undefined behavior.

**Parameters**

* :name - a valid champion name

**Output**

Returns a [Champion-Object](champion)


## Player

### player/list

This endpoint returns a lits of all registered summoners.

**Parameters**

* None

**Output**

Returns an Array<[Summoner](summoner)>


### player/info/:summonerId

Returns infos regarding mastery statistics for the given summoner.

**Parameters**

* :summonerId - valid summoner id

**Output**

Returns a [SummonerInfo-Object](summonerinfo).

### player/info/by-name/:summonerName

Same as player/info:summonerId only with the summoner name.
If the summoner does not exist in the db yet he's added to the summoner list and some basic informations are retrieved. If retrieving the summoner fails either 500 is returned OR the success flag is set to false.

**Parameters**

* :summonerName - summoner name

**Output**

Returns a [SummonerInfo-Object](summonerinfo)

### player/progression/:summonerId/:championId

This endpoint returns an Array containing information about the gains of a player for the given champion in chronological, ascending order.
If no data is available an empty array is returned.

**Parameters**

* :summonerId - valid summoner id
* :championId - valid champion id

**Output**

Array<[LastGame](lastgame)>

## Champion

### champion/:championId

**Parameters**

* :championId - valid champion id

**Output**

| Name | Type     | Description |
| :------------- | :------------- | :---- |
| data      | [Champion](champion) | |
| stats      | [ChampionStats](championstats) | |
| masterydistribution      | [MasteryDistribution](masterydistribution) | |
| gradedistribution      | Array<[HighestGrade](highestgrade)> | |
| percent_chest_granted      | [PercentChestGranted](percentchestgranted) | |
| top10players      | [Top10](top10-object) | without icon property in Change |
| rank | [ChampionRank](championrank) |
| totalptsstats | [ChampionPtsStats](championptsstats) | contains information like max number of total points etc. |
| top10HighestMastery      | [HighestMasterySummoner](highestmasterysummoner) | |


## Top10-Object

| Name | Type     | Description |
| :------------- | :------------- | :---- |
| max       | double       | Maximum gain last week |
| min       | double       | Minimum gain last week |
| avg       | double       | Average gain last week |
| data | Array<Change> | Array containing data for 10 or all champions |
| maxChange       | double       | max change to week before |
| minChange       | double       |  |
| avgChange       | double       |  |

## Change

| Name | Type     | Description |
| :------------- | :------------- | :---- |
| rank       | int | Rank of the champion in the standings of last week. Calculated with points |
| id       | int | Champion Id |
| name       | string       | Champion Name |
| icon       | string       | picture name  |
| points       | double       | Average gain last week per game |
| rankChange       | int       | change in rank compared to the week before |
| pointsChange       | double       | change of points compared to the week before |

## Champion-Object

| Name | Type     | Description |
| :------------- | :------------- | :---- |
| id       | int     | champion id |
| name       | string       | champion name |
| full      | string    | full image name |
| sprite      | string | sprite image name |

## ChampionStats

| Name | Type     | Description |
| :------------- | :------------- | :---- |
| avg_gains       | double     |  |
| games_played       | int     | total number of games played and recorded |
| avg_games_summoner       | double     | average games played per summoner |
| summoners_played       | int     | number of summoners who played this champion |

## Summoner

| Name | Type     | Description |
| :------------- | :------------- | :---- |
| summoner_id       | int |  |
| summoner_name       | string    |  |
| summoner_icon       | int     | icon id |

## SummonerInfo
| Name | Type     | Description |
| :------------- | :------------- | :---- |
| name       | string |  |
| summoner_id | int |  |
| profile_icon       | int |  |
| masterydistribution| [Masterydistribution](masterydistribution) | Description of a summoners mastery distribution |
| champions       | Array<[TotalMasteryChampion](totalmasterychampion)> | Returns all champions sorted by total mastery points  |
| lastgames       | Array<[LastGame](lastgame)> | Overview over the last played games including mastery points gain if available |
| highestgradedistribution       | Array<[HighestGrade](highestgrade)> | Distribution of the highest grade achieved this season  |
| top10gainslastweek       | Array<[Top10Gains](top10gains)> | Top10 Gains over the last weeks |
| globalRank       | [GlobalRank](globalrank) | Global Rank including information used to calculate that rank |
| percent_chest_granted       | [PercentChestGranted](percentchestgranted) | Shows the percentages for granted chests |
| success       | boolean | true if no error appeared (e. g. false if a new summoner could not be found)  |


## MasteryDistribution
| Name | Type     | Description |
| :------------- | :------------- | :---- |
| avg       | double | average mastery level |
| distribution      | Array<Int> | containing information about the number of occurrences of each level. Index 0 stands for Mastery Level 1! |


## TotalMasteryChampion
| Name | Type     | Description |
| :------------- | :------------- | :---- |
| id       | int | champion id |
| name       | string | champion name |
| mastery_level       | int | [1,5] |
| pts_total       | int |  |
| pts_since       | int | points since last level |
| pts_next       | int | points until next level |
| highest_grade       | string |  |
| chest_granted       | boolean | this season! |

## LastGame
| Name | Type     | Description |
| :------------- | :------------- | :---- |
| champion_name       | string | |
| game_timestamp       | string | timestamp shortened too yyyy-mm-dd |
| mastery_level       | int |  |
| pts_gained       | int | pts gained in this game, null if unknown |
| pts_total       | int |  |
| pts_since       | int |  |
| pts_next       | int |  |

## HighestGrade
| Name | Type     | Description |
| :------------- | :------------- | :---- |
| highest_grade       | string | |
| cnt       | int | number of occurrences of highest_grade |

## Top10Gains
| Name | Type     | Description |
| :------------- | :------------- | :---- |
| champion_id       | int | |
| name       | string | |
| games       | int | games played with that champion last week |
| avg_pts_gained       | double | avg gain over the number of games given in games|
| mastery_level       | int | level from 1 to 5 |
| rank       | int | global rank |


## GlobalRank
| Name | Type     | Description |
| :------------- | :------------- | :---- |
| rank       | int | global rank calculated with avg_gain |
| avg_gain       | double | avg gain last week |
| games       | int | games played last week |
| week       | int | week indicator. 0 stands for this week |

## PercentChestGranted
| Name | Type     | Description |
| :------------- | :------------- | :---- |
| yes       | int | champion count for which a chest was already granted |
| no      | int | |

## ChampionRank
| Name | Type     | Description |
| :------------- | :------------- | :---- |
| rank      | int | rank compared to all other champions (last week) |
| avg_gain      | double | average gain last week |
| games      | int | number of games |

## ChampionPtsStats
| Name | Type     | Description |
| :------------- | :------------- | :---- |
| max_pts      | int | total max points |
| min_pts      | int |  |
| standard_deviation      | int |  |
| avg_pts      | double | average total points over all summoners |

## HighestMasterySummoner
| Name | Type     | Description |
| :------------- | :------------- | :---- |
| summoner_name      | string |  |
| pts_total      | int |  |
| mastery_level      | int |  |
| pts_next      | string |  |
| pts_since      | string |  |
