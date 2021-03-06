<template>
    <div id="extendedInfo" class="modal fade" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div v-if="veto" class="modal-content">
                <div class="modal-header text-dark" :class="'bg-' + veto.status">
                    <h5 class="modal-title">
                        <a class="text-dark" :href="'https://osu.ppy.sh/beatmapsets/' + veto.beatmapId" target="_blank">{{ veto.beatmapTitle }}</a> by 
                        <a class="text-dark" :href="'https://osu.ppy.sh/users/' + veto.beatmapMapperId" target="_blank">{{ veto.beatmapMapper }}</a>
                        <i v-if="veto.mode.indexOf('osu') >= 0" class="far fa-circle" />
                        <i v-else-if="veto.mode.indexOf('taiko') >= 0" class="fas fa-drum" />
                        <i v-else-if="veto.mode.indexOf('catch') >= 0" class="fas fa-apple-alt" />
                        <i v-else-if="veto.mode.indexOf('mania') >= 0" class="fas fa-stream" />
                        <span v-else>
                            <i class="far fa-circle" />
                            <i class="fas fa-drum" />
                            <i class="fas fa-apple-alt" />
                            <i class="fas fa-stream" />
                        </span>
                    </h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body" style="overflow: hidden">
                    <div class="text-shadow mb-2">
                        <p class="min-spacing">
                            <a :href="veto.discussionLink" target="_blank">Read the veto discussion here</a>
                        </p>
                        <small class="ml-2">Veto reason: <i v-html="filterLinks(veto.shortReason)" /></small>
                    </div>
                    <p class="min-spacing text-shadow">
                        Consensus: {{
                            veto.status == 'upheld' || veto.status == 'withdrawn' ? 'Veto ' + veto.status : 'none' 
                        }}
                    </p>

                    <!--nat options-->
                    <div v-if="isNat && currentMediators.indexOf(userId) == -1 && veto.vetoer.id != userId" class="text-shadow">
                        <hr>
                        <div v-if="veto.mediations.length">
                            <ul style="list-style-type: none; padding-left: 0.5rem">
                                <li v-for="mediation in veto.mediations" :key="mediation.id">
                                    <a
                                        v-if="!mediation.comment && veto.status == 'wip'"
                                        href="#"
                                        data-toggle="tooltip"
                                        data-placement="top"
                                        title="replace mediator"
                                        @click.prevent="replaceMediator(mediation.id);"
                                    >
                                        <i class="fas fa-redo-alt vote-pass" />
                                    </a>
                                    {{ mediation.mediator.username }}:
                                    <pre v-if="!mediation.comment" class="pre-font small">...</pre>
                                    <pre v-else class="pre-font small" :class="mediation.vote == 1 ? 'vote-pass' : mediation.vote == 2 ? 'vote-neutral' : mediation.vote == 3 ? 'vote-fail' : ''" v-html="filterLinks(mediation.comment.trim())" />
                                </li>
                            </ul>
                            <span v-if="veto.status != 'upheld' && veto.status != 'withdrawn'">
                                <button class="btn btn-sm" :class="majority ? 'btn-nat' : 'btn-nat-red'" @click="concludeMediation($event)">{{ majority ? 'Uphold Veto' : 'Withdraw Veto' }}</button>
                                <button class="btn btn-sm btn-nat" @click="concludeMediation($event, true)">Dismiss Without Mediation</button>
                            </span>
                            <span v-else>
                                <button class="btn btn-sm btn-nat" @click="continueMediation($event, true)">Re-initiate Veto Mediation</button>
                            </span>
                            <button class="btn btn-sm btn-nat float-right" data-toggle="collapse" data-target="#conclusion">
                                See full conclusion post <i class="fas fa-angle-down" />
                            </button>
                            <button class="btn btn-sm btn-nat float-right mr-1" data-toggle="collapse" data-target="#forumMessage">
                                See full forum PM <i class="fas fa-angle-down" />
                            </button>
                            <veto-conclusion-post
                                :veto="veto"
                                :majority="majority"
                            />
                            <veto-forum-pm
                                :veto="veto"
                            />
                        </div>
                        <div v-else-if="veto.status != 'upheld' && veto.status != 'withdrawn'">
                            <button class="btn btn-sm btn-nat mb-2" @click="selectMediators($event)">
                                {{ mediators ? 'Re-select Mediators' : 'Select Mediators' }}
                            </button> 
                            <button class="btn btn-sm btn-nat mb-2" @click="concludeMediation($event, true)">
                                Dismiss Without Mediation
                            </button>
                            <div class="mb-2">
                                <span class="text-shadow">Exclude specific user(s):</span> 
                                <input id="excludeUsers" class="ml-1 w-75 small" type="text" placeholder="username1, username2, username3..."><br>
                                <small class="ml-2 text-shadow">The mapper and veto submitter are automatically excluded</small>
                            </div>
                            <div v-if="mediators" class="mt-2">
                                <p>Users:</p>
                                <div id="usernames" class="copy-paste mb-4" style="width: 25%">
                                    <ul style="list-style-type: none; padding: 0">
                                        <li v-for="user in mediators" :key="user.id">
                                            <samp class="small">{{ user.username }}</samp>
                                        </li>
                                    </ul>
                                </div>
                                <p>
                                    <button v-if="mediators" class="btn btn-sm btn-nat-red mb-2" @click="beginMediation($event)">
                                        Begin Mediation
                                    </button>
                                    <button class="btn btn-sm btn-nat float-right" data-toggle="collapse" data-target="#forumMessage">
                                        See full forum PM <i class="fas fa-angle-down" />
                                    </button>
                                </p>
                                <veto-forum-pm
                                    :veto="veto"
                                />
                            </div>
                        </div>
                        <div v-else>
                            <p class="text-shadow min-spacing">
                                This veto's mediation was dismissed due to being invalid, inappropriate, or resolved by the mapper.
                            </p>
                        </div>
                    </div>

                    <!--mediator options-->
                    <div v-if="mediationId && veto.status == 'wip'">
                        <hr>
                        <p class="text-shadow min-spacing mb-2">
                            Reason for vote:
                        </p>
                        <p class="text-shadow small min-spacing mb-1 ml-2">
                            This comment will be displayed anonymously alongside the verdict post. If your response is deemed inappropriate, your vote will be marked as invalid.
                        </p>
                        <div class="form-group">
                            <textarea
                                id="comment"
                                v-model="comment"
                                class="form-control dark-textarea"
                                style="white-space: pre-line;"
                                placeholder="Why you agree/disagree with the veto..."
                                rows="2"
                            />
                        </div>
                        <div class="mb-2">
                            <span class="mr-3 text-shadow">Vote:</span>
                            <div class="form-check form-check-inline">
                                <input
                                    id="1"
                                    class="form-check-input"
                                    type="radio"
                                    name="vote"
                                    value="1"
                                    :checked="vote == 1"
                                >
                                <label class="form-check-label text-shadow vote-pass" for="1">Agree</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input
                                    id="2"
                                    class="form-check-input"
                                    type="radio"
                                    name="vote"
                                    value="2"
                                    :checked="vote == 2"
                                >
                                <label class="form-check-label text-shadow vote-neutral" for="2">Neutral</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input
                                    id="3"
                                    class="form-check-input"
                                    type="radio"
                                    name="vote"
                                    value="3"
                                    :checked="vote == 3"
                                >
                                <label class="form-check-label text-shadow vote-fail" for="3">Disagree</label>
                            </div>
                        </div>
                        <div :class="info.length ? 'errors' : 'confirm'" class="text-shadow ml-2" style="min-height: 24px;">
                            {{ info }} {{ confirm }}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button v-if="mediationId && veto.status == 'wip'" class="btn btn-sm btn-nat" @click="submitMediation($event)">
                        Submit Mediation
                    </button>
                    <p v-else class="text-shadow min-spacing">
                        {{ veto.createdAt.slice(0, 10) }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';
import filterLinks from '../../mixins/filterLinks.js';
import VetoForumPm from './VetoForumPm.vue';
import VetoConclusionPost from './VetoConclusionPost.vue';

export default {
    name: 'VetoInfo',
    components: {
        VetoForumPm,
        VetoConclusionPost,
    },
    mixins: [ postData, filterLinks ],
    props: {
        veto: Object,
        userId: String,
        userOsuId: Number,
        isNat: Boolean,
    },
    data() {
        return {
            info: '',
            confirm: '',
            mediators: null,
            comment: '',
            vote: null,
            mediationId: null,
        };
    },
    computed: {
        majority(){
            let total = 0;
            this.veto.mediations.forEach(mediation => {
                if(mediation.vote == 1) total++;
                if(mediation.vote == 3) total--;
            });
            return total > 0 ? true : false;
        },
        currentMediators() {
            let userIds = [];
            this.veto.mediations.forEach(mediation => {
                userIds.push(mediation.mediator.id);
            });
            if(this.veto.beatmapMapperId == this.userOsuId){
                userIds.push(this.userId);
            }
            return userIds;
        },
    },
    watch: {
        veto() {
            this.mediators = null;
            this.mediationId = null;
            if (this.veto.mediations.length) {
                for (let i = 0; i < this.veto.mediations.length; i++) {
                    let mediation = this.veto.mediations[i];
                    if(mediation.mediator.id == this.userId){
                        if(mediation.comment) this.comment = mediation.comment;
                        if(mediation.vote) this.vote = mediation.vote;
                        this.mediationId = mediation.id;
                        break;
                    }
                }
            }
        },
    },
    methods: {
        async selectMediators(e) {
            let excludeUsers = $('#excludeUsers').val().split(',');
            for (let i = 0; i < excludeUsers.length; i++) {
                excludeUsers[i] = excludeUsers[i].trim().toLowerCase();
            }
            excludeUsers.push(this.veto.beatmapMapper.toLowerCase(), this.veto.vetoer.username.toLowerCase());
            const r = await this.executePost('/vetoes/selectMediators', { mode: this.veto.mode, excludeUsers }, e);
            if (r) {
                if (r.error) {
                    this.info = r.error;
                } else {
                    this.mediators = r;
                }
            }
        },
        async beginMediation(e) {
            const result = confirm(`Are you sure?`);
            if(result){
                const r = await this.executePost('/vetoes/beginMediation/' + this.veto.id, { mediators: this.mediators }, e);
                if (r) {
                    if (r.error) {
                        this.info = r.error;
                    } else {
                        this.$emit('update-veto', r);
                    }
                }
            }
        },
        async submitMediation (e) {
            this.info = '';
            this.confirm = '';
            const vote = $('input[name=vote]:checked').val();
            if(!vote || !this.comment.length){
                this.info = 'Cannot leave fields blank!';
            }else{
                const v = await this.executePost(
                    '/vetoes/submitMediation/' + this.veto.id, 
                    { mediationId: this.mediationId, 
                        vote, 
                        comment: this.comment,
                    }, e);
                if (v) {
                    if (v.error) {
                        this.info = v.error;
                    } else {
                        this.$emit('update-veto', v);
                        this.confirm = 'Mediation submitted!';
                        this.vote = vote;
                    }
                }
            }
        },
        async concludeMediation (e, dismiss) {
            this.info = '';
            this.confirm = '';
            const result = confirm(`Are you sure?`);
            if(result){
                const v = await this.executePost(
                    '/vetoes/concludeMediation/' + this.veto.id, 
                    { majority: this.majority, dismiss }, e);
                if (v) {
                    if (v.error) {
                        this.info = v.error;
                    } else {
                        this.$emit('update-veto', v);
                        this.confirm = 'Mediation concluded!';
                    }
                }
            }
        },
        async continueMediation (e) {
            this.info = '';
            this.confirm = '';
            const result = confirm(`Are you sure? This should only be done if a mistake was made.`);
            if(result){
                const v = await this.executePost(
                    '/vetoes/continueMediation/' + this.veto.id, {}, e);
                if (v) {
                    if (v.error) {
                        this.info = v.error;
                    } else {
                        this.$emit('update-veto', v);
                        this.confirm = 'Mediation re-opened!';
                    }
                }
            }
        },
        async replaceMediator (mediationId) {
            const result = confirm(`Are you sure? This should only be done if a mistake was made.`);
            if(result){
                const v = await this.executePost(
                    '/vetoes/replaceMediator/' + this.veto.id, { mediationId });
                if (v) {
                    if (v.error) {
                        this.info = v.error;
                    } else {
                        this.$emit('update-veto', v);
                    }
                }
            }
        },
    },
};
</script>

<style>
    .bg-available {
        background-color: var(--available);
    }
    .bg-wip {
        background-color: var(--wip);
    }
    .bg-upheld {
        background-color: var(--upheld);
    }
    .bg-withdrawn {
        background-color: var(--withdrawn);
    }
    
</style>
