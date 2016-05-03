
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
| id | string | |
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
