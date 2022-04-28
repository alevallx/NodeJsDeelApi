const {Op} = require('sequelize');

/*  Return all active contracts id of allTypes(Client and contractor) or not
*/
const activeContracts = (profileId,allType=true) => {
    if (allType){
        return {
            [Op.and]: [
                {status: {[Op.like]: 'in_progress'}},
                {
                    [Op.or]: [
                        {clientId: profileId},
                        {ContractorId: profileId},
                    ],
                },
            ],
        };
    }

    return {
        [Op.and]: [
            {status: {[Op.like]: 'in_progress'}},
            {clientId: profileId}
        ],
    };
};

const allActiveContracts = (profileId) =>{
    return {
        [Op.and]: [
            {status: {[Op.notLike]: 'terminated'}},
            {
                [Op.or]: [
                    {clientId: profileId},
                    {ContractorId: profileId},
                ],
            },
        ]
    };
};

const contractById = (profileId, contractId) =>{
    return {
        [Op.and]: [
            {id: contractId},
            {status: {[Op.notLike]: 'terminated'}},
            {
              [Op.or]: [
                {clientId: profileId},
                {ContractorId: profileId},
              ],
            },
          ],
    };
};

const clientProfile = (clientId) => {
    return {
        [Op.and]: [
            {id: clientId},
            {type: {[Op.like]: 'client'}}
        ]
    };
};

const jobsPaidByDateRange = (start, end) => {
    return {
        [Op.and]:[
            {paid: true},
            {paymentDate: {[Op.between]: [start, end]}}
        ]
    };
};

module.exports = {
    activeContracts,
    allActiveContracts,
    contractById,
    clientProfile,
    jobsPaidByDateRange
};
