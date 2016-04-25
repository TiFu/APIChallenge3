# APIChallenge3

## Ideas

### Card Game
* PvP turn based card game
* Cards depend on champion mastery
* Cards are champions with 4 abilities (pokemon like)
	* maybe with a passive
	* maybe with a mana / energy system
* You have a deck of cards
	* up to x cards per deck (e. g. 5)
* Cards grow stronger the higher your mastery is (e. g. +4/5/7/10% dmg)
	* which stats grow maybe depend on champion tag

### 1v1 Friends
* track 1v1 stats vs. friends
* get proposals for champ to play depending on your mastery & your enemies mastery
* maybe some points ladder / elo under friends => depending on champion mastery
	* higher champion mastery vs. low champion mastery give more points
	* high vs high mastery normal points
* friends can form groups and track their 1v1s (not with the tournament api because generally you don't want to wait 15 min to finish the game)
* if time permits extend 1v1 matches to multiple games (e.g. BestOfX series)
* maybe some event stream for friends group
* membership in multiple groups eventually
* maybe use current game? => does it update the kda?
	* if not MAYBE use spectator stream to do that..
	* but the documentation of that is outdated
	
## Tech
* Node?
* Angular2
* mysql (pls no mongo..)
* Typescript or VanillaJS?
	* typescript has typing which is useful, but can be circumvented with type "any" which then refers to standard js type checking (aka none)
