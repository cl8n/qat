const pagination = {
    data() {
        return {
            pre: null,
            limit: null,
            pages: null,
            currentPage: null,
            canShowOlder: true,
            count: 24,
        };
    },
    watch: {
        limit() {
            this.changePage();
        },
    },
    methods: {
        changePage() {
            this.limit = Math.round(this.limit);
            this.pre = this.limit - this.count;
            if (this.allObjs) {
                if (this.isFiltered) {
                    if (this.limit >= this.filteredObjs.length) {
                        this.canShowOlder = false;
                    }
                    this.pageObjs = this.filteredObjs.slice(this.pre, this.limit);
                    this.pages = Math.ceil(this.filteredObjs.length / this.count);
                } else {
                    if (this.limit >= this.allObjs.length) {
                        this.canShowOlder = false;
                    }
                    this.pageObjs = this.allObjs.slice(this.pre, this.limit);
                    this.pages = Math.ceil(this.allObjs.length / this.count);
                }
            }
            if (this.pages > 0) {
                this.currentPage = this.limit / this.count;
            } else {
                this.currentPage = this.pages;
            }
        },
        showOlder() {
            if (this.canShowOlder) {
                this.limit += this.count;
            }
        },
        showNewer() {
            if (this.pre > 0) {
                this.limit -= this.count;
                this.canShowOlder = true;
            }
        },
    },
};

export default pagination;
