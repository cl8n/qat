<template>
    <div id="editReason" class="modal fade" tabindex="-1">
        <div class="modal-dialog">
            <div v-if="selectedEntry" class="modal-content custom-bg-dark">
                <div class="modal-header text-dark" :class="selectedEntry.valid == 1 ? 'badge-pass' : selectedEntry.valid == 2 ? 'badge-extend' : selectedEntry.valid == 3 ? 'badge-fail' : 'bg-nat-logo'">
                    <h5 class="modal-title">
                        Edit DQ/Reset
                    </h5>
                    <button type="button" class="close" data-dismiss="modal">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="container">
                        <p class="text-shadow">
                            Mapset: 
                            <a :href="selectedEntry.postId ? 'https://osu.ppy.sh/beatmapsets/' + selectedEntry.beatmapsetId + '/discussion/-/generalAll#/' + selectedEntry.postId : 'https://osu.ppy.sh/beatmapsets/' + selectedEntry.beatmapsetId + '/discussion/-/events'" target="_blank">
                                {{ selectedEntry.metadata }}
                            </a>
                        </p>
                        <p class="text-shadow">
                            Current reason:
                        </p>
                        <p class="text-shadow small ml-4" v-html="filterLinks(selectedEntry.content)" />
                        <p class="text-shadow" for="newReason">
                            New reason:
                        </p>
                        <div class="input-group input-group-sm">
                            <input
                                id="newReason"
                                v-model="reasonInput"
                                type="text" 
                                placeholder="reason..."
                                style="filter: drop-shadow(1px 1px 1px #000000); width: 100%"
                                maxlength="50"
                                @keyup.enter="updateReason($event)"
                            >
                        </div>
                        <p class="text-shadow mt-4">
                            Notability:
                            <notability
                                :selected-entry="selectedEntry"
                            />
                        </p>
                    </div>
                    <p id="errors" class="errors">
                        {{ info }}
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-nat" type="submit" @click="updateReason($event)">
                        <span class="append-button-padding">Save reason</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import postData from '../../mixins/postData.js';
import filterLinks from '../../mixins/filterLinks.js';
import Notability from './Notability.vue';

export default {
    name: 'DataCollectionInfo',
    components: {
        Notability,
    },
    mixins: [postData, filterLinks],
    props: [ 'selectedEntry' ],
    data() {
        return {
            reasonInput: '',
            confirm: '',
            info: '',
            tempId: null,
        };
    },
    watch: {
        selectedEntry() {
            if(this.tempId != this.selectedEntry.id){
                this.reasonInput = '';
            }
            this.tempId = this.selectedEntry.id;
        },
    },
    methods: {
        async updateNotability(entryId, notability) {
            const result = await this.executePost('/dataCollection/updateNotability/' + entryId, { notability });
            if (result) {
                if (result.error) {
                    this.info = result.error;
                } else {
                    this.$parent.updateEntry(result);
                }
            }
        },
        async updateReason(e) {
            if(!this.reasonInput || !this.reasonInput.length){
                this.info = 'Must enter a reason!';
            }else{
                const result = await this.executePost('/dataCollection/updateReason/' + this.selectedEntry.id, { reason: this.reasonInput }, e);
                if (result) {
                    if (result.error) {
                        this.info = result.error;
                    } else {
                        this.updateEntry(result);
                    }
                }
            }
        },
        updateEntry(result) {
            this.$parent.updateEntry(result);
        },
    },
};
</script>