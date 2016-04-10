describe('visit /challenge/:id/:name', function () {
  context('challenge with :id exists', function () {
    context(':id not fitting to :name', function () {
      it('should redirect to the correct name');
    });

    context(':id without :name', function () {
      it('should redirect to the correct name');
    });

    context(':id and :name are valid', function () {
      it('should show the challenge name and description');
      it('should show activity log');
      it('should show the discussions, tags, followers, stars, etc.');
      it('should show link for sharing the challenge');
      it('should show social networking links for sharing');
      /**how does social networking work???*/

      context('not logged in', function () {
        it('should suggest logging in or signing up with proper redirect in link');
      });

      context('logged in', function () {
        it('should show link or field for adding a tag'); //challenge/id/name/add-tag
        it('may be possible to remove tags which user added and have 0 or negative voting');
        it('should show the tags to be votable (whether the tag is fitting or not)');
        it('should show a field for adding a comment to discussion');
        it('should show links to reacting to comments');
        it('should show buttons for launching idea, project, discussion, challenge...');
        it('may make it possible to link existent ideas, projects, discussions, challenges');
        it('may be possible to edit the challenge topic and description in wikipedia or etherpad style');

        context('user is creator', function () {
          it('may be possible to delete the challenge if not embraced'); //challenge/id/name/delete //discourage!
          it('may be possible for the creator to remove their name (anonymization)');
          it('may edit the challenge topic');
          it('may edit the challenge description');
        });
        
        context('user is not a creator', function () {});
      });
    });
  });

  context('challenge with :id doesn\'t exist', function () {
    it('should show 404 error page');
  });
});
