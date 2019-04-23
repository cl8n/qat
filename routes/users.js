const express = require('express');
const helper = require('./helper');
const api = require('../models/api');
const usersService = require('../models/user').service;
const logsService = require('../models/log').service;

const router = express.Router();

router.use(api.isLoggedIn);

/* GET bn app page */
router.get('/', async (req, res, next) => {
    res.render('users', {
        title: 'BN/NAT Listing',
        script: '../javascripts/users.js',
        isUsers: true,
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat',
        isBnEvaluator: res.locals.userRequest.group == 'bn' && res.locals.userRequest.isBnEvaluator,
        isNat: res.locals.userRequest.group == 'nat',
    });
});

/* GET applicant listing. */
router.get('/relevantInfo', async (req, res, next) => {
    let u = await usersService.query(
        { $or: [{ group: 'nat' }, { group: 'bn' }], isSpectator: { $ne: true }  },
        {},
        { username: 1 },
        true
    );
    res.json({ users: u, userId: req.session.mongoId, isLeader: res.locals.userRequest.isLeader });
});

/* POST submit or edit eval */
router.post('/switchMediator/', api.isLeader, async (req, res) => {
    let u = await usersService.update(req.body.userId, {
        vetoMediator: !req.body.vetoMediator,
    });
    res.json(u);
    logsService.create(req.session.mongoId, `Opted ${u.username} ${u.vetoMediator ? 'in to' : 'out of'} veto mediation`);
});

/* POST submit or edit eval */
router.post('/switchBnEvaluator/', api.isBnOrNat, async (req, res) => {
    let u = await usersService.update(req.session.mongoId, {
        isBnEvaluator: !res.locals.userRequest.isBnEvaluator,
    });
    res.json(u);
    logsService.create(req.session.mongoId, `Opted ${u.isBnEvaluator ? 'in to' : 'out of'} optional BN app evaluation input`);
});

/* POST switch usergroup */
router.post('/switchGroup/:id', api.isLeader, async (req, res) => {
    let u = await usersService.update(req.params.id, { group: req.body.group,  probation: [], $push: {bnDuration: new Date(), natDuration: new Date()} });
    res.json(u);
    logsService.create(
        req.session.mongoId,
        `Changed usergroup of "${u.username}" to "${req.body.group.toUpperCase()}"`
    );
});

/* POST remove from BN/NAT without evaluation */
router.post('/removeGroup/:id', api.isLeader, async (req, res) => {
    let u = await usersService.query({_id: req.params.id});
    let logGroup = u.group;
    if(u.group == 'bn'){
        u = await usersService.update(req.params.id, { group: 'user',  probation: [], modes: [], $push: {bnDuration: new Date()} });
    }else if(u.group == 'nat'){
        u = await usersService.update(req.params.id, { group: 'user',  probation: [], modes: [], $push: {natDuration: new Date()} });
    }
    console.log(u);
    res.json(u);
    logsService.create(
        req.session.mongoId,
        `Removed "${u.username}" from the ${logGroup.toUpperCase()}`
    );
});

module.exports = router;
