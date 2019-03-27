<template>
<div id="editQuestion" class="modal fade" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content" v-if="question">
            <div class="modal-header bg-nat-logo">
                <h5 class="modal-title text-dark">Edit "{{category}}" question</h5>
                <button type="button" class="close" data-dismiss="modal">
                <span>&times;</span>
                </button>
            </div>
            <div class="modal-body" style="overflow: hidden">
                <div class="container mb-2">
                    <div class="text-shadow mb-2"><p>Question:</p>
                        <div class="form-check form-check-inline ml-2">
                            <input class="form-check-input" type="radio" name="questionTypeEdit" id="textEdit" value="text" :checked="question.questionType == 'text'">
                            <label class="form-check-label text-shadow" for="textEdit">Select text</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="questionTypeEdit" id="imageEdit" value="image" :checked="question.questionType == 'image'">
                            <label class="form-check-label text-shadow" for="imageEdit">Select Image</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="questionTypeEdit" id="fillEdit" value="fill" :checked="question.questionType == 'fill'">
                            <label class="form-check-label text-shadow" for="fillEdit">Fill in blank</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <textarea class="form-control dark-textarea" id="newQuestionEdit" placeholder="avoid confusing wording..." maxlength="200" rows="2" v-model="question.content" @keyup.enter="addQuestion($event)"></textarea>
                    </div>
                    <button type="submit" class="btn btn-nat-red float-right ml-2" @click="deleteQuestion($event)">Delete Question</button>
                    <button type="submit" class="btn btn-nat float-right ml-2" @click="updateQuestion($event)">Update Question</button>
                </div>
                <br class="mb-2">
                <hr>
                <div class="container">
                    <p class="text-shadow">Options:</p>

                    <table class="small table text-shadow col-md-12 mt-2">
                        <thead>
                            <td scope="col" style="padding: 2px;">Option</td>
                            <td scope="col" style="padding: 2px;">Score</td>
                            <td scope="col" style="padding: 2px;">Select</td>
                        </thead>
                        <tbody>
                            <tr v-for="option in question.options" :key="option.id">
                                <td scope="row" style="padding: 1px;">
                                    <a v-if="question.questionType == 'image'" :href="option.content" target="_blank">{{option.content}}</a>
                                    <span v-else>{{option.content}}</span>
                                    </td>
                                <td scope="row" style="padding: 1px;">{{option.score}}</td>
                                <td scope="row" style="padding: 1px;"><input type="checkbox" name="optionList" :value="option.id"></td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="row col-md-12">
                        <input id="option" class="form-control-sm text-input col-md-9 mb-2" type="text" maxlength="100" placeholder="potential answer... (if image, post link)" />
                        <input id="score" class="form-control-sm text-input col-md-1 ml-1 mb-2" type="text" maxlength="5" placeholder="points..." style="min-width: 80px; width: 80;"/>
                        <div class="form-check form-check-inline pb-2 ml-2">
                            <input type="checkbox" id="negative">
                            <label class="form-check-label text-shadow ml-1 small" for="negative">Negative</label>
                        </div>
                    </div>
                </div>
                <hr>
                <span class="errors text-shadow" id="addEvalRoundsErrors">{{ info }}</span>
                <span class="confirm text-shadow" id="addEvalRoundsConfirm">{{ confirm }}</span>
                <button type="submit" class="btn btn-nat-red float-right ml-2" @click="deleteOption($event)">Delete Selected Option</button>
                <button type="submit" class="btn btn-nat float-right ml-2" @click="updateOption($event)">Edit Selected Option</button>
                <button type="submit" class="btn btn-nat float-right ml-2" @click="addOption($event)">Add Option</button>
                
            </div>
        </div>
    </div>
</div>
</template>

<script>
import postData from '../../mixins/postData.js'

export default {
    name: 'edit-question',
    mixins: [ postData ],
    props: ['question', 'category'],
    methods: {
        updateQuestion: async function (e) {
            this.info = '';
            this.confirm = '';
            let questionType = $('input[name=questionTypeEdit]:checked').val();
            let newQuestion = $('#newQuestionEdit').val();
            if(!newQuestion || !newQuestion.length || !questionType || !questionType.length){
                this.info = "Cannot leave question fields blank!"
            }else{
                const question = await this.executePost('/nat/manageTest/updateQuestion/' + this.question.id, {questionType: questionType, newQuestion: newQuestion}, e);
                if (question) {
                    if (question.error) {
                        this.info = question.error;
                    } else {
                        this.$emit('update-question', question);
                        this.confirm = 'Question updated! ';
                    }
                }
            }
        },
        deleteQuestion: async function(e) {
            const result = confirm(`Are you sure?`);
            if(result){
                const success = await this.executePost('/nat/manageTest/deleteQuestion/' + this.question.id, {}, e);
                if (success) {
                    this.$emit('delete-question', this.question.id);
                    $('#editQuestion').modal('hide');
                }
            }
        },
        addOption: async function(e) {
            this.info = '';
            this.confirm = '';
            let option = $('#option').val();
            let score = $('#score').val();
            if(!option || !option.length || !score || !score.length){
                this.info = "Cannot leave option fields blank!"
            }else if(!score.match(/^[0-9]+$/)){
                this.info = 'Score must be a number!'
            }else{
                if($('#negative').prop('checked')){
                    score = score * -1;
                }
                const question = await this.executePost('/nat/manageTest/addOption/' + this.question.id, {option: option, score: score}, e);
                if (question) {
                    if (question.error) {
                        this.info = question.error;
                    } else {
                        this.$emit('update-question', question);
                        this.confirm = 'Option added! ';
                    }
                }
            }
        },
        updateOption: async function(e) {
            this.info = '';
            this.confirm = '';
            let id = $("input[name='optionList']:checked").val();
            let option = $('#option').val();
            let score = $('#score').val();
            let checked = $("input[name='optionList']:checked").length;
            if(checked != 1){
                this.info = 'You must select only one option to edit!';
            }else if(!option || !option.length || !score || !score.length){
                this.info = 'Cannot leave fields blank!';
            }else if(!score.match(/^[0-9]+$/)){
                this.info = 'Score must be a number!'
            }else{
                if($('#negative').prop('checked')){
                    score = score * -1;
                }
                const question = await this.executePost('/nat/manageTest/updateOption/' + id, {option: option, score: score, questionId: this.question.id}, e);
                if (question) {
                    if (question.error) {
                        this.info = question.error;
                    } else {
                        this.$emit('update-question', question);
                        this.confirm = 'Option updated!';
                    }
                }
            }
        },
        deleteOption: async function(e) {
            this.info = '';
            this.confirm = '';
            let checkedOptions = [];
            $("input[name='optionList']:checked").each(function() {
                checkedOptions.push( $(this).val() );
            });
            if(!checkedOptions.length){
                this.info = 'Must select options!'
            }else{
                const question = await this.executePost('/nat/manageTest/deleteOption/', {checkedOptions: checkedOptions, questionId: this.question.id}, e);
                if (question) {
                    if (question.error) {
                        this.info = question.error;
                    } else {
                        this.$emit('update-question', question);
                        this.confirm = checkedOptions.length > 1 ? 'Options deleted!' : 'Option deleted!';
                    }
                }
            }
        }
    },
    data() {
        return {
            info: '',
            confirm: ''
        };
    },
}
</script>

<style>

</style>