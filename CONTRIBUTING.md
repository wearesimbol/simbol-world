# Contributing

We're an open project and really appreciate contributions of any kind

## Join the community

We're on Spectrum for any questions and discussions. Join [here	](http://spectrum.chat/simbol)!

## File an issue

If there's something not working for you, please file an issue [here](https://github.com/wearesimbol/simbol/issues)

1. Search the issue track to check that your issue has not been filed before
2. Specify the Simbol version you are using
3. Specify browser version and OS
4. Describe the issue
5. If it applies to the issue, please provide code and/or screenshots. A Glitch based on [this example](https://glitch.com/edit/#!/a-simbol-example) would be great

## Raising Pull Requests

1. Have a [GitHub account](https://github.com/join) with [SSH keys](https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/) set up
2. [Fork](https://github.com/wearesimbol/simbol/fork) the repository on GitHub
3. Clone your fork of the repository locally (i.e., `git clone git@github.com:yourusername/simbol`)
4. Run `npm install` to get dependencies
5. Run `npm run js` when you make changes to compile it. The compiled version will be in `build/simbol.js`
6. If necessary, write [unit tests](https://github.com/wearesimbol/simbol/tree/master/test) and run with `npm run test`
7. Check it still passes the Simbol's linting rules by running `rnpm run lint`
6. Make changes to your fork of the repository, commit them, and push them (i.e., `git add -A . && git commit -m 'Fixes #25 by adding these changes' && git push origin master`)
8. [Submit a pull request](https://www.digitalocean.com/community/tutorials/how-to-create-a-pull-request-on-github) to the master branch
9. If peers make any comments, address them
