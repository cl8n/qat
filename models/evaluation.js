const mongoose = require('mongoose');
const logsService = require('./log').service;
const BaseService = require('./baseService');

const evaluationSchema = new mongoose.Schema({
    evaluator: { type: 'ObjectId', ref: 'User', required: true },
    behaviorComment: { type: String, required: true },
    moddingComment: { type: String, required: true },
    vote: { type: Number, enum: [1, 2, 3] },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

class EvaluationService extends BaseService
{
    constructor() {
        super(Evaluation);
    }

    /**
     * 
     * @param {object} evaluatorId UserId who evualates
     * @param {string} behaviorComment 
     * @param {string} moddingComment 
     * @param {number} vote 
     */
    async create(evaluatorId, behaviorComment, moddingComment, vote) {
        try {
            return await Evaluation.create({ evaluator: evaluatorId, behaviorComment, moddingComment, vote });
        } catch(error) {
            logsService.create(null, JSON.stringify(error), true);
            return { error: error._message };
        }
    }
}

const service = new EvaluationService();

module.exports = { service, Evaluation };