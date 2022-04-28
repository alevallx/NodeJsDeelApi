const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('./model');
const {getProfile} = require('./middleware/getProfile');
const app = express();
const {Op} = require('sequelize');
const {
  activeContracts,
  allActiveContracts,
  contractById,
  jobsPaidByDateRange,
  clientProfile
} = require('./utils/conditions');
const {
  setPaymentTransaction, setBalanceDeposit
} = require('./utils/transaction');
app.use(bodyParser.json());
app.use(express.urlencoded());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);

app.get('/contracts/:id', getProfile, async (req, res) => {
  const {Contract} = req.app.get('models');
  const {id} = req.params;

  const contract = await Contract.findOne({
    where: contractById(req.profile.id, id),
  });
  if (!contract){
    return res.status(404).end();
  }
  res.json(contract);
});

app.get('/contracts/', getProfile, async (req, res) => {
  const {Contract} = req.app.get('models');

  const contracts = await Contract.findAll({
    where: allActiveContracts(req.profile.id),
  });
  if (!contracts){
    return res.status(404).end();
  }
  res.json(contracts);
});

app.get('/jobs/unpaid/', getProfile, async (req, res) => {
  const {Contract, Job} = req.app.get('models');

  const contractsId = [
    ...(await Contract.findAll({
      where: activeContracts(req.profile.id),
      attributes: ['id'],
      raw: true,
    })),
  ].map((c) => c.id);

  if (!contractsId){
      return res.status(404).end();
    }

  const jobs = await Job.findAll({
    where: {
      [Op.and]: [
        {ContractId: {[Op.in]: contractsId}},
        {paid: {[Op.not]: true}},
      ],
    },
  });

  if (!jobs) {
      return res.status(404).end();
    }
  res.json(jobs);
});

app.post('/jobs/:jobId/pay/', getProfile, async(req, res) =>{
  const {Contract, Job} = req.app.get('models');
  const {jobId} = req.params;

  //Get the contracts of the profile as client
  const contractsId = [
    ...(await Contract.findAll({
      where: activeContracts(req.profile.id, false),
      attributes: ['id'],
      raw: true,
    })),
  ].map((c) => c.id);

  //check if don't have contracts ids
  if (!contractsId){
    return res.status(404).end();
  }

  // Get the job of the contract's client
  const job = await Job.findOne({
    where: {
      [Op.and]: [
        {id: jobId},
        {ContractId: {[Op.in]: contractsId}},
        {paid: {[Op.not]: true}},
      ],
    },
  });

  //check if don't have a job
  if (!job){
    return res.status(404).end();
  }
  // check if profile have enough balance
  if (job.price > req.profile.balance){
    return res.status(404).end();
  }

  let paymentProcess = await setPaymentTransaction(job, req);

  if (!paymentProcess){
    return res.status(404).end();
  }

  return res.status(200).end();
});

app.post('/balances/deposit/:userId/', async(req, res) =>{

  const {userId} = req.params;

  if (req.body.deposit === undefined || req.body.deposit <= 0){
    return res.status(404).end();
  }

  let depositProcess = await setBalanceDeposit(
    clientProfile(userId), req.body.deposit
  );

  if (!depositProcess){
    return res.status(404).end();
  }

  return res.status(200).end();
});

app.get('/admin/best-profession', async(req, res) =>{
  const {Job, Contract, Profile} = req.app.get('models');
  const startDate = req.query.start;
  const endDate = req.query.end;

  if (startDate === undefined || endDate === undefined){
    return res.status(404).end();
  }

  const jobs = await Job.findAll({
    group:['ContractId'],
    attributes:[
      'ContractId',
      [sequelize.fn(
        'SUM', sequelize.col('price')),
        'totalPaid'
      ]
    ],
    where: jobsPaidByDateRange(startDate, endDate),
    order:[[sequelize.fn('SUM', sequelize.col('price')),'DESC']]
  });

  if (!jobs){
    return res.status(404).end();
  }

  let bestPaidContractId = Math.max.apply(Math, jobs.map( function(x){
    return x.ContractId;
  }));

  const contract = await Contract.findOne({
    raw:true,
    nested:true,
    attributes:['Contractor.profession'],
    where:{id: bestPaidContractId},
    include:[
      {
        attributes:[],
        model: Profile, as: 'Contractor'
      }
    ]
  });

  if (!contract){
    return res.status(404).end();
  }

  res.json(contract.profession);
});

app.get('/admin/best-clients', async(req, res) => {
  const {Job, Contract, Profile} = req.app.get('models');
  const startDate = req.query.start;
  const endDate = req.query.end;
  const limit = req.query.limit || 2;

  if (startDate === undefined || endDate === undefined){
    return res.status(404).end();
  }

  const jobs = await Job.findAll({
    raw: true,
    group:['Contract.Client.id'],
    attributes:[
      'Contract.Client.id',
      'Contract.Client.firstName',
      'Contract.Client.lastName',
      [sequelize.fn(
        'SUM', sequelize.col('price')),
        'totalPaid'
      ]
    ],
    where: jobsPaidByDateRange(startDate, endDate),
    order:[[sequelize.fn('SUM', sequelize.col('price')),'DESC']],
    limit: limit,
    include:[
      {
        model: Contract,
        attributes:[],
        include:[
          {
            model: Profile, as: 'Client',
            attributes: []
          }
        ]
      }
    ]
  });

  if (!jobs){
    return res.status(404).end();
  }

  return res.json(jobs);
});

module.exports = app;
