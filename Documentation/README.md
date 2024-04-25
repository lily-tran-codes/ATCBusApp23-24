# Requirements
- Nodejs
- npm
- SQL Server
# Setting up local SQL server for development
>[!NOTE]
> Local admin rights required on computer in order to install SQL server
## Installation
1. Install SQL Server Express [here](https://www.microsoft.com/en-us/download/details.aspx?id=55994)
2. Run the installer and choose the custom option
3. Install and choose "New SQL Server stand-alone installation"
4. Go through installer until the Instance Configuration section, rename the instance and change its ID if desired, default is SQLEXPRESS
5. For Database Engine Configuration, choose Mixed Mode and set up sa account
6. Install SQL Server Management Studio (SSMS) [here](https://learn.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms?view=sql-server-ver16)
## Setup
1. Open Sql Server Configuration Manager
2. Enable SQL Server Browser in the SQL Server Services section by Right-click to Properties, Service, and change Start Mode to Automatic. Apply changes.
![Enable SQL Server Browser](enable-sql-browser.png)
3. Right-click SQL Server Browser and select Start
4. Expand SQL Server Network Configuration and select Protocols for [Instance name] (default is SQLEXPRESS)
5. Right-click and enable TCP/IP
6. Navigate to SQL Server Services and restart SQL Server that is currently running
7. Connect to server on SQL Server Management Studio with either Windows authentication or sa credentials made during server installation
8. Select New Query and execute the script from [scripts file](scripts.txt) to create database and tables
# Setting up Node.js
1. Install nvm
    - [Windows Installer](https://github.com/coreybutler/nvm-windows/releases)
    - [macOS & Linux](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)
2. Install node with `nvm install node` and run `nvm use node`
3. Open Cmd prompt in project's directory and run `npm install -g` to install dependencies