# Installation

## Prerequisites

* Install Node, v5.7.1 is highly recommended
* Install mysql: 14.14 Distrib5.6.28

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
