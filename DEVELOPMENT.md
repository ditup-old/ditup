# Development of ditup

## How to contribute

## TODO list

### To first release

The first release should be a proof of the concept. It should be simple and showing the plans

- [ ] better logged homepage
- [ ] add people page to search people
    - [x] search people by similar tags to me
        - [ ] filter by active for some time period (to filter inactive people out)
    - [x] new people
    - [x] random user
    - [x] last people online
    - [ ] most followed people (popular people)
    - people i follow
    - [ ] people who follow the same stuff as me
    - most active people
    - people around you (location)
    - people who recently joined projects/discussions/ideas/challenges with you
    - [ ] search
        - [ ] by tags
        - [ ] name
        - [ ] username
- [ ] make a single info site /about
- [ ] fix project, idea, challenge, discussion pages
    - [x] edit
        - [x] edit not only challenge, but others, too.
    - [ ] follow
    - [ ] unfollow
    - [ ] comment/discuss
    - [ ] add tag
    - [ ] vote tags
- [ ] merge projects of user with project general: if logged in, both will be shown.
- [ ] after login redirect always to the page which was currently on
- [ ] better /tags page
- [ ] comment the code
- [ ] write styles
- [ ] clean the code

### Future goals and ideas

- API (not necessarily REST)
- version control of crowdsourced stuff
- voting often - for crowdsourcing
- dit bases - places for collaboration
- search
- graph search: search visually in the graph of relations with basic objects
- map with people & projects & bases
- show pictures of contributors
- copy good ideas from github & workflow of commenting etc.
- it has to be nice and easy to use

### Things that are a mess and need to be rebuilt

- `NODE_ENV` environment (it's all mixed - test should be for tests, development for developing and production for production)
- mess with logged and not verified users

### Things that can be improved
