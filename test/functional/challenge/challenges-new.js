describe('visiting /challenges/new', function () {
  context('not logged', function () {
    context('GET', function () {
      it('should offer logging in');
    });
    context('POST', function () {
      it('should show an error: you are not logged in');
    });
  });

  context('logged', function () {
    context('GET', function () {
      it('should show the form for creating a challenge');
      /**
       * field for name
       * field for description
       * create button
       * field for adding tags
       */
    });
    context('POST', function () {
      context('bad data', function () {
        it('should complain with proper errors and show the form again and form filled with the already submitted data');
      });
      context('good data', function () {
        it('should create the challenge and redirect to it');
      });
    });
  });
});
