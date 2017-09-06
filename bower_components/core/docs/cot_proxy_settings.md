City of Toronto Proxy Workarounds
=================================

You will need to do proxy settings when on the COT network. You can use these commands in your terminal.

npm
---
Set up all npm projects to use a proxy:

`npm config set proxy "http://proxy.toronto.ca:8080" --global`

`npm config set https-proxy "http://proxy.toronto.ca:8080" --global`

git
---
Set up all git projects to use a proxy:

`git config http.proxy http://proxy.toronto.ca:8080 --global`

environment variables
---------------------
Set up ENV variables within your command line. These are used by various tools, including bower.

**On a Mac:**

`export HTTP_PROXY=http://proxy.toronto.ca:8080 #mac`

`export http_proxy=http://proxy.toronto.ca:8080 #mac`

`export HTTPS_PROXY=http://proxy.toronto.ca:8080 #mac`

`export https_proxy=http://proxy.toronto.ca:8080 #mac`

**On a PC:**

`set http_proxy=http://proxy.toronto.ca:8080 #windows`

`set https_proxy=http://proxy.toronto.ca:8080 #windows`

You can also set these permanently on a PC using Control Panel > System > Advanced System Settings > Environment Variables...
Otherwise you will have to execute the above lines every time you open your command prompt.

> **Important!**
> A note about these proxy settings: sometimes the proxy stops working or doesn't work because your username and password isn't in the  proxy URL.
> * Steve has solved this issue by keeping a web browser open on your system, and navigating to an external website (something not in your browser cache is probably best) when you run into issues. This seems to 'reset' how the proxy server allows your machine on to the proxy without a username/password in the URL.
> * Jason has also solved this issue by temporarily setting the above proxy settings to include a username and password, and then switching back to the non-username/password version after things are working.
