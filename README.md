You will need to create an env.json file with following structure (a sample is provided in env_sample.json):
```json
{
	"user": "name of user",
	"host": "host (for testing just go with localhost)",
	"database": "name of db",
	"password": "password DO NOT LEAK THIS",
	"session_key": "session key for handling sessions",
	"yt_key": "__INSERT_YOUTUBE_API_KEY_HERE",
    "FACEBOOK_APP_ID":"__INSERT_APP_ID_HERE__",
    "FACEBOOK_APP_SECRET":"__INSERT_APP_SECRET_HERE__",
	"port": 5432
}
```
You must also set up a postgres database on your local machine or your VPS, and then use the provided init.sql file to set up the basic structure for the database.
