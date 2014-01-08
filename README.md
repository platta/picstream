#picStream

A Node.js application built to run on Azure Web Services to stream pictures in real time from social media services.
Currently __Twitter&copy;__ and __Instagram&copy;__ are supported.

---

##Requires
- __[Node.js](http://nodejs.org/)__ version 0.10.23 or newer.

- Run __npm install__ from the main directory to pull down packages outlined in package.json.

- A config.json populated with correct values for Microsoft Azure(contents withheld).

##Additional Steps to Run Locally
1. Download and run __[nGrok](https://ngrok.com/)__ from the shell or command prompt with the parameter 3000 to allow the Instagram API to push updates down to your local node instace.

2. Copy the http url from nGrok and paste it into your config.json for the "INSTAGRAM_CALLBACK" key.

3. Run __Node app__ to start the sevice.


---