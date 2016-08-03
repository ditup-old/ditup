'use strict';

var co = require('co');

module.exports = function (dependencies) {
  let router = dependencies.router;
  let db = dependencies.db;

  router.all('/:id/:url/join', function (req, res, next) {
    let sessUser = req.session.user;
    if(req.session.user.logged !== true) {
      sessUser.messages.push('you need to <a href="/login?redirect='+encodeURIComponent(req.originalUrl)+'">log in</a> before joining the project');
      return res.render('sysinfo', {session: sessUser});
    }
    return next();
  });

  router.post('/:id/:url/:join', function (req, res, next) {
    let sessUser = req.session.user;
    let id = req.params.id; //project id
    let url = req.params.url; //project url

    //where is this from? some irregurality in design?
    let submit;
    if(req.body.join) submit = 'join';
    else submit = req.body.submit;

    let request = req.body['request-text'];
    return co(function *(){
      let involvement = yield db.project.userStatus(id, sessUser.username);

      if(involvement === '' && submit === 'join') {
        yield db.project.addMember(id, sessUser.username, 'joining', {request: request});
        req.session.messages.push('The request to join the project was sent. You need to wait for a response now.'); //show message after redirect
      }
      else if(involvement === 'joining' && submit === 'Edit request') {
        yield db.project.updateInvolvement(id, sessUser.username, 'joining', 'joining', {request: request});
        req.session.messages.push('Your request was updated.'); //show message after redirect
      }
      else if(involvement === 'joining' && submit === 'Delete request') {
        yield db.project.removeInvolvement(id, sessUser.username, 'joining');
        req.session.messages.push('The request was successfully deleted.'); //show message after redirect
      }
      else if(involvement === 'invited' && submit === 'Accept invitation') {
        yield db.project.updateInvolvement(id, sessUser.username, 'invited', 'member');
        req.session.messages.push('You are a member of the project now.'); //show message after redirect
      }
      else if(involvement === 'invited' && submit === 'Reject invitation') {
        yield db.project.removeInvolvement(id, sessUser.username, 'invited');
        req.session.messages.push('The invitation was successfully removed.'); //show message after redirect
      }
      //here we process the accepting user. from project/id/url/join?user=username POST accept
      else if(involvement === 'member' && req.query.user && req.body.accept && req.body.accept === 'accept') {
        yield db.project.updateInvolvement(id, req.query.user, 'joining', 'member');
        yield db.notifications.create({to: req.query.user, text: 'you were accepted to project', url: `/project/${id}/${url}`});
        req.session.messages.push('The accepted user is now member.'); //show message after redirect
      }
      else {
        throw new Error('post not recognized');
      }

      return res.redirect(req.baseUrl + '/' + id + '/' + url);
    })
    .catch(function (err) {
      return next(err);
    })
  });

  router.get('/:id/:url/join', function (req, res, next) {
    let sessUser = req.session.user;
    let id = req.params.id;

    //this is my first use of generator functions and co library to write synchronous-looking asynchronous code
    return co(function *() {
      let weHaveDataAlready = req.ditup && req.ditup.project && req.ditup.project.name && req.ditup.project.join_info && req.ditup.project.id === id;
      let project = yield weHaveDataAlready ? Promise.resolve(req.ditup.project) : db.project.read(id);
      
      //find out whether user is involved (and additional data)
      if(sessUser.logged === true) {
        let involvement = yield db.project.userInvolved(id, sessUser.username);
        project.userStatus = involvement.status;
        if(involvement.status === 'joining') {
          project.joinRequest = involvement.request;
        }

        //when logged user is member
        if(involvement.status === 'member') {
          //processing joiner info
          if(typeof(req.query.user) === 'string') {
            let username = req.query.user;

            //check that we're not processing the logged user herself
            if(username === sessUser.username) {
              throw new Error('it\'s you!');
            }

            let joiner = yield db.project.userInvolved(id, username);
            joiner.username = username;

            return res.render('project-join-manage-joiner', {session: sessUser, project: project, joiner: joiner});
          }
          
          let joiners = yield db.project.involvedUsers(id, 'joining');
          project.joiners = joiners;
        }
      }

      return res.render('project-join', {session: sessUser, project: project});
    })
    .catch(function (err) {
      next(err);
    });
  });

  return router;
};

