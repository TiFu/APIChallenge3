
# Endpoints

## Table of Contents
* [top10](#top10)
  * [/api/top10/champions](#apitop10champions)
  * [/api/top10/players](#apitop10players)
  * [/api/top10/players/:champId](#apitop10playerschampid)
  * [Top10Object](#top10object)
* [static](#static)
  * [/static/champions](#staticchampions)
  * [/static/champions/:id](#staticchampionsid)
  * [ChampionObject](#championobject)
* [player](#player)
  * [/player/info/:summonerId](#playerinfosummonerid)
  * [/player/progression/:summonerId/:championId](#playerprogressionsummoneridchampionid)

## top10

All endpoints retrieve the Top10 regarding average champion mastery gain per game in the last week.

### /api/top10/champions

Retrieves the top10 champions for last week.

**Parameters**

None.

**Output**

Returns an Array<Top10Object> where id represents the champion name.

### /api/top10/players

Retrieves the Top10 players for the last week.

**Parameters**

None.

**Output**

Array<Top10Object> where id represents the summoner name.

### /api/top10/players/:champId

Retrieves the top10 players for the given champ.

**Parameters**

:champId - valid champion id

**Output**

Returns an Array<Top10Object> where id represents the summoner name.

### Top10Object

| Name | Type | Description |
| --- | --- | --- |
| rank | int | rank, starting at 1 |
| id | int | |
| name | string | name |
| change | double | average mastery points gained per game |

## static

### /static/champions

Retrieves a list of all champions containing id, name, full and sprite image.

**Parameters**

None.

**Output**

Array<ChampionObject>

### /static/champions/:id

Retrieves the champion with the given id.

**Parameters**

:id - champion id

**Output**

Array<ChampionObject> containing exactly one element.

### ChampionObject

| Name | Type | Description |
| --- | --- | --- |
| id | int | champion id |
| name | string | |
| full | string | full image name |
| sprite | string | sprite image name |

# Player

This endpoint exposes different stats regarding one specific player.
## /player/info/:summonerId

This endpoint retrieves the following informations about a summoner:
  - name
  - mastery distribution
  - top10 champions overall
  - highest grade distribution

**Parameters**

:summonerId - summoner id

**Output**

| Name | Type | Description |
| --- | --- | --- |
| name | string | summoner name |
| masterydistribution | Array<Int> | Array with 6 entries (0 - 5) giving the number of champions with which this player has reached the corresponding mastery level |
| top10champions | Array<ChampionEntry> | Top10 champions with most points for this player |
| highestgradedistribution | Array<HighestGradeEntry> | same as masterydistribution only for maximum grades |
| top10gainslastweek | Array<GainsEntry> | array containing up to 10 champions with their avg gains per game for last week |

## /player/progression/:summonerId/:championId

This endpoint retrives progression values for the mastery of one champion for a summoner.

**Parameters**

:summonerId - summoner id

:championId - champion id

**Output**

Returns an Array<ChampionProgression> ordered by timestamp ASC.

## ChampionEntry

| Name | Type | Description |
| --- | --- | --- |
| name | string | |
| mastery_level | int | |
| pts_total | int | |
| pts_next | int | |
| pts_since | int | |
| highest_grade | string | |
| chest_granted | boolean | |

## HighestGradeEntry

| Name | Type | Description |
| --- | --- | --- |
| grade | string | |
| cnt | int | number of occurences in the champion mastery |

## GainsEntry

| Name | Type | Description |
| --- | --- | --- |
| name | string | champion name |
| avg_pts_gained | double | avg pts gained per game |
| mastery_level | maximum mastery level |

## ChampionProgression

| Name | Type | Description |
| --- | --- | --- |
| champion_name | string | |
| pts_gained | int | NULL if first entry |
| pts_total | int | |
| mastery_level | int | |
| game_timestamp | timestamp | |
