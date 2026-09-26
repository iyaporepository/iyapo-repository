# iyapo-repository

Website prototype for the Iyapo Repository, to live at [iyaporepository.org](https://iyaporepository.org)

## Installation

Please feel welcome to contact us for help if you encounter errors with any of the following steps that you can’t figure out!

Prerequisites:

- get to know [the basics](https://tutorials.codebar.io/command-line/introduction/tutorial.html) of using the terminal/command line on your computer, especially the `cd` command.
- have [git](https://git-scm.com/), [node, and npm](https://github.com/nvm-sh/nvm#install--update-script) installed on your computer. These programs will allow you to preview the website and make edits. 
- Also make sure you are added to the Iyapo Repository Notion workspace, where site content is managed.
- get to know [some basic git terminology](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)

Instructions:

1. Use git to [clone this repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository), either through the [github desktop app](https://desktop.github.com/), or by opening a terminal window, navigating to the location where you want to save the directory, and entering this command: `git clone git@github.com:wordandimage/iyapo-repository.git`. 

2. Once you’ve clone the repository, there will be a new folder called “iyapo-repository” in whichever location you chose to save it on your computer. In a terminal window, navigate into this folder. Also pull it up in your finder.

3. Take the `.env` file, which will have been sent to you, and drag it into the `iyapo-repository` folder. This contains the password to read data from Notion.

4. Still in the terminal, type and enter the command `npm install`. This installs all the code needed to preview and modify the site.

5. Run `npm run sync`. This will download and process the latest data and images from notion.

6. Now, you should be able to start a live preview of the website by running this command: `npm run preview`. This preview will only be accessible on your personal network. When you run the command it will give you a link for where to find this preview (usually `http://localhost:8080/`).

More info to come on how to make edits, add images, and push changes to the live website!
