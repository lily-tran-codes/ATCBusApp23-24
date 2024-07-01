# Requirements
- Nodejs
- npm
- SQL Server
# Install bus app on server with Docker (skip if you're developing and not deploying the application)
## Section 1: Database
>[!NOTE]
>Create a table called Accounts (drop table first if Accounts already exists) with username and password columns with the script below:
```sql
USE [BusDismissal]
GO

/****** Object:  Table [dbo].[Accounts]    Script Date: 4/23/2024 5:45:35 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO
/* Uncomment the DROP TABLE below if Accounts already exist */
/* DROP TABLE Accounts; */
CREATE TABLE [dbo].[Accounts](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[username] [varchar](255) NULL,
	[password] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
```
## Section 2: Required files
1. Download [compose.yaml](compose.yaml)
2. .env file (from email)
3. Put them in a folder together
## Section 3: Docker
1. Launch Docker Desktop app on computer to make sure it's running
2. Launch Cmd Prompt/Terminal and navigate to where the folder from Section 2 Step 3 is located
3. Type in:
```batch
docker-compose pull
```
1. Enter to let it pull from the Docker Hub
2. Once it's done pulling and 'Pull complete' is displayed, run this to start the app:
```batch
docker-compose up
```
1. Verify 'Server listening on PORT 80' is displayed on terminal
2. Navigate to localhost:80/admin from the browser to get to the Admin page of the app
3. Default login:
        username: busAdmin
        password: busAdmin
4. Change credentials after logging in by going to the Accounts tab on the navigation bar up top.
![Account](Documentation/account.png)
# Setting up local SQL server for development
>[!NOTE]
> Local admin rights required on computer in order to install SQL server
## Installation
>[!NOTE]
>If you're using MacOS, you will have to install SQL Server with Docker, go to [this section](##-Setup-SQL-Server-for-MacOS-with-Docker)
## hi
1. Install SQL Server Express [here](https://www.microsoft.com/en-us/download/details.aspx?id=55994)
2. Run the installer and choose the custom option
3. Install and choose "New SQL Server stand-alone installation"
4. Go through installer until the Instance Configuration section, rename the instance and change its ID if desired, default is SQLEXPRESS
5. For Database Engine Configuration, choose Mixed Mode and set up sa account
6. Install [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms?view=sql-server-ver16) (MacOS not supported), [Beekeeper Studio (Community Edition)](https://www.beekeeperstudio.io/get-community), or [Azure Data Studio](https://learn.microsoft.com/en-us/azure-data-studio/download-azure-data-studio?tabs=win-install%2Cwin-user-install%2Credhat-install%2Cwindows-uninstall%2Credhat-uninstall), or any other DBMS interface of your liking that supports SQL Server
>[!IMPORTANT]
>On SSMS, the hostname is localhost\SQLEXPRESS, but on other DBMS interfaces, the hostname might be only localhost instead.
## Setup
1. Open Sql Server Configuration Manager
>[!NOTE]
>If SQL Server Configuration Manager is not found, follow the steps in this [link](https://learn.microsoft.com/en-us/answers/questions/166724/sql-server-configuration-manager-not-showing-in-wi)
2. Enable SQL Server Browser in the SQL Server Services section by Right-click to Properties, Service, and change Start Mode to Automatic. Apply changes.
![Enable SQL Server Browser](Documentation/enable-sql-browser.png)
3. Right-click SQL Server Browser and select Start
4. Expand SQL Server Network Configuration and select Protocols for [Instance name] (default is SQLEXPRESS)
5. Right-click and enable TCP/IP
6. Navigate to SQL Server Services and restart SQL Server that is currently running
7. Connect to server on SQL Server Management Studio with either Windows authentication or sa credentials made during server installation
8. Select New Query and execute the script from [scripts file](scripts.txt) to create database and tables
## Setup SQL Server for MacOS with Docker
# Setup project's folder
1. Install git [here](https://git-scm.com/downloads) or Github Desktop [here](https://docs.github.com/en/desktop/installing-and-authenticating-to-github-desktop/installing-github-desktop) if you want to use the interface instead
2. Clone the repo
    - If you use git, open Cmd Prompt/Terminal in the folder that you want to store the project, run `git clone https://github.com/lily10806/ATCBusApp.git`.
    - If you use Github Desktop, go to File, and choose Clone Repository
    ![Clone Repo](Documentation/Github-clone.png)
    Paste the link https://github.com/lily10806/ATCBusApp.git into the URL for the repository, and choose which local path you want it cloned to and clone the repo.
    ![Clone options](Documentation/clone-options.png)
# Setting up Node.js
1. Install nvm
    - [Windows Installer](https://github.com/coreybutler/nvm-windows/releases)
    - [macOS & Linux](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)
2. Install node with `nvm install node` and run `nvm use node`
3. Open Cmd Prompt/Terminal in project's directory and run `npm install` to install dependencies
4. [Optional] Once all packages are installed, run `npm install nodemon` to install nodemon (it refreshes the server automatically upon changes so you don't have to manually restart the server everytime)
# How to get the app running
1. Navigate to the project's folder in Cmd Prompt/Terminal
2. Run `node server.js` to start the app OR `nodemon server.js` if you have nodemon installed (if nodemon is not recognized right after installing it, try restarting Cmd Prompt/Terminal)
# Making changes to the repo (upload changes and getting changes from GitHub)
- Create a new branch
  - git: `git branch new-branch-name`
  - GitHub Desktop: Select branch > New branch, name the new branch and Create branch. If you've made changes to the files and want to have them on the new branch, choose 'Bring my changes to [new-branch]' and switch branch
  ![github branch](Documentation/branch.png)
- Change to another branch (Be sure to work in a new branch so any unchecked changes won't be committed to the main branch)
>[!IMPORTANT]
>Always commit changes to current branch if you don't intend on bringing the uncommitted changes to the new branch to avoid any work loss. Checkout git stash to learn more about putting away local changes.
  ![New branch changes](Documentation/new-branch.png)
  - git: `git checkout branch-name`
  - GitHub Desktop: Select Current branch tab and change to another branch. Choose whether you want to move uncommitted changes to the new branch or not if prompted.
  ![change branch](Documentation/change-branch.png)
- Push changes to remote repo
  - git:
    1. `git add .` to add all files with changes
    2. `git commit -m "describe the changes you make here"`
    3. `git push origin` to push the changes to repo
  - GitHub Desktop:
    ![Github Desktop push](Documentation/github-push.png)
    1. Check the boxes for files you want to upload (on left sidebar)
    2. Write a summary for the changes you made
    3. Commit to branch
- Get remote changes from branch to local repo (For when you make changes to a branch from another device and want to get that change on this device)
  - git: `git pull origin branch-name-you-want-to-pull-from`
  - GitHub Desktop: 
    - Fetch origin to check for commits
    ![fetch origin](Documentation/fetch-origin.png)
    - Pull origin to get changes from remote branch to local branch
    ![pull origin](Documentation/pull-origin.png)