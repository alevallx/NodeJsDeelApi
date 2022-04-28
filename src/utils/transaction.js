const {
    sequelize,
    Profile,
    Contract,
    Job
} = require('../model');
const {Op} = require('sequelize');

const setPaymentTransaction = async function (job, req){
    let t, contract,contractorProfile;

    try {
      t = await sequelize.transaction();

      job.set({
        paid: true,
        paymentDate: Date.now()
      });
      await job.save({transaction:t});

      //update client balance
      req.profile.balance -= job.price;
      await req.profile.save({transaction:t});

      //get contractor
      contract = await Contract.findOne({
        where: {
          id: job.ContractId
        },
        transaction:t
      });

      contractorProfile = await contract.getContractor();

      contractorProfile.balance += job.price;
      await contractorProfile.save({transaction: t});

      await t.commit();

    } catch (error) {
        console.log('error', error);
        if (t){
            await t.rollback();
        }
    }

    return true;
  };

  const setBalanceDeposit  = async function(profileFilter, deposit){

    let t, profile, objClient;

    try {
        t = await sequelize.transaction();

        //get profile client byId
        profile = await Profile.findOne({
          where: profileFilter,
          nest: true,
          include:[
            {
              model: Contract, as: 'Client',
              nest: true,
              where: {status: {[Op.like]: 'in_progress'}},
              group:['Profile.id','Contract.id', 'Job.id'],
              attributes: [
                [sequelize.fn(
                  'SUM', sequelize.col('Client.Jobs.price')),
                  'totalOfJobsToPaid'
                ]
              ],
              include:[
                {
                  model: Job,
                  where:{paid: {[Op.not]: true}}
                }
              ]
            }
          ],
          transaction: t
        });

        objClient = JSON.parse(JSON.stringify(profile.Client));
        const maxToDepositAvailable = objClient[0].totalOfJobsToPaid * 0.25;

        if (deposit > maxToDepositAvailable) {
            if (t) {
                await t.rollback();
            }
            return false;
        }

        profile.balance += deposit;
        await profile.save({transaction:t});

      } catch (error) {
        console.log(error);
        if (t) {
            await t.rollback();
        }
        return false;
      }

      return true;
  };

  module.exports = {setPaymentTransaction, setBalanceDeposit};
