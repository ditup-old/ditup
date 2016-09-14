# Development of ditup

## How to contribute

## TODO list

### To first release

The first release should be a proof of the concept. It should be simple and showing the plans

- [ ] better logged homepage
    - __Brainstorming__
    - [ ] new things, new activities, notifications, activities of people, new projects
    - the most connective & involving things
    - maybe some notifications
    - [ ] new stuff connected to my interests (tags
    - (new features)
    - [ ] activity of the people & dits i follow
- [x] add people page
    - [x] people by similar tags to me
        - filter by active for some time period (to filter inactive people out)
    - [x] new people
    - [x] random user
    - [x] last people online
    - most followed people (popular people)
    - [ ] people i follow
    - people who follow the same stuff as me
    - most active people
    - people around you (location)
    - people who recently joined projects/discussions/ideas/challenges with you
    - search
        - by tags
        - name
        - username
- [x] make a single info site /about
    - [ ] it's monotonous. fix that. make it more interesting with color, font, different content, ... (suggested by dzik)
- [ ] fix project, idea, challenge, discussion pages
    - [x] edit
        - [x] edit not only challenge, but others, too.
    - [x] follow
    - [x] unfollow
    - [ ] number of followers
    - [ ] comment/discuss
    - [x] adding tags
        - [x] create tag if nonexistent
        - [x] user
        - [x] project
        - [x] idea
        - [x] challenge
        - [x] discussion
    - voting tags
        - idea
        - challenge
        - discussion
        - they disappear when voted under zero
    - [x] inviting people to projects
- [x] follow people
- [x] merge dits of user with dits general: if logged in, both will be shown.
- [x] after login redirect always to the page which was currently on
- [x] better /tags page
  - [ ] list of my tags
  - [ ] list of the tags of the things i follow/am member of
- [x] better /tag/:tagname page
- [ ] comment the code
- [ ] write styles
    - [ ] media query
    - [ ] introduce a nice contrasting colour
    - [x] white background
- [ ] clean the code
- [x] unviewed notifications are not bold
- [x] nice error pages
- [ ] activity (it's not notifications. it's activity. you fetch activity of people & dits you follow to some feed.)
    - you should be able to filter the activity by type.
- [x] fix user profile and write tests for it
- [x] fix showing number of messages & notifications when reading messages/notifications
- [ ] the adder of a tag to crowdsourced objects should be able to remove it from the object until voted.
- [ ] the new tags should be removable by their creator when not used.
- [x] delete avatar picture when deleting user.
- [ ] inviting people to a project - better UX, the button for this should be clearly visible
  - [ ] inviting non-users by email?
  - [ ] inviting by link with a hash?
- some navigation (like how to get out of a user page)
- [ ] when starting a new discussion, the initial post is disappearing (make there a description).
- a page with all my things
  - [ ] i created
  - [ ] i follow
  - [ ] i commented
- [ ] creator of dits would be visible

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
- teams

### Things that are a mess and need to be rebuilt

- `NODE_ENV` environment (it's all mixed - test should be for tests, development for developing and production for production)
- mess with logged and not verified users

### Things that can be improved
