'use strict';

describe('user visits /challenges', function () {
  it('should show new challenges');
  it('should show random challenge');
  it('should show popular challenges');
  it('may show some activity feed');
  it('may have a search field');
  context('user (logged in)', function () {
    it('should show a \'create new challenge\' link');
    it('should show challenges of interest (by common tags)')
  });
  context('visitor (not logged in)', function () {
    it('should not show a \'create new challenge\' link');
    it('should suggest logging in to create a new challenge and view more');
  });
});
