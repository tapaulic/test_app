Notes on using and developing corejs:
=====================================
Doing a new release
-------------------
1. Choose a new version number. Follow [semantic versioning](http://semver.org/) rules.

2. Checkout the develop branch and pull the latest:

 `git checkout develop && git pull`

3. Update the version number in bower.json

4. Update the version number in package.json

5. Update the version number image at the top of readme.md

6. Update the version number hashtag in sample_bower.json

7. Commit and push to develop:

`git commit -am "Update to version x.x.x" && git push`

8. Checkout master and pull latest:

`git checkout master && git pull`

9. Merge develop into master:

`git merge develop`

10. Tag the release:

`git tag -a -m "version x.x.x" x.x.x`

11. Push the merge and tag to origin:

`git push && git push --tags`

11. Go to the [github release page](https://github.com/CityofToronto/corejs/releases) and add release notes.

