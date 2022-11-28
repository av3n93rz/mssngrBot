"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const puppeteer_1 = require("puppeteer");
const atob_1 = require("atob");
const queue_1 = require("queue");
const Order = Symbol('Order');
class Client {
    constructor(options) {
        this.threadHandleToID = (handle) => this._aliasMap[handle] || handle;
        this.options = {
            session: null,
            selfListen: false,
            workerLimit: 3,
            ...(options || {}),
        };
        this._browser = null; // Puppeteer instance
        this._masterPage = null; // Holds the master page
        this._workerPages = []; // Holds the worker pages
        this._listenFns = []; // Begin as null, changes to [] when primed
        this._aliasMap = {}; // Maps user handles to IDs
        this.uid = null; // Holds the user's ID when authenticated
        // Handle new messages sequentially
        this._messageQueueIncoming = (0, queue_1.default)({
            autostart: true,
            concurrency: 1,
            timeout: 1000,
        });
        // Worker thread queue
        this._actionQueueOutgoing = {
            [Order]: [],
        };
    }
    async _delegate(thread, fn) {
        console.debug('Received function ', fn, thread);
        let _resolve;
        const promise = new Promise((resolve) => {
            _resolve = resolve;
        });
        const pushQueue = (workerObj, fn) => {
            console.debug('Pushing function to worker thread', workerObj.id);
            workerObj.queue.push(async (finish) => {
                console.debug('Executing function (finally)');
                workerObj.active = true;
                workerObj.lastActivity = new Date();
                _resolve(await fn.apply(workerObj.page));
                finish && finish();
            });
        };
        const replaceWorker = async (workerObj, newThread, hookFn) => {
            console.debug('Replacing worker thread queue', workerObj.id);
            workerObj.thread = null;
            workerObj.queue.autostart = false;
            await hookFn();
            await this._setTarget(workerObj.page, newThread);
            workerObj.thread = newThread;
            workerObj.queue.start();
            workerObj.queue.autostart = true;
        };
        const target = this._workerPages.find((workerObj) => this.threadHandleToID(thread) === workerObj.thread);
        if (target) {
            console.debug('Existing worker thread found, pushing');
            void pushQueue(target, fn);
        }
        else {
            console.debug('Target worker thread not found');
            // Queue new action if there are no free workers
            if (this._workerPages.length >= this.options.workerLimit) {
                const freeTarget = this._workerPages
                    .filter((workerObj) => !workerObj.active)
                    .sort((a, b) => (a.lastActivity > b.lastActivity ? 1 : 0))
                    .shift();
                if (freeTarget) {
                    void replaceWorker(freeTarget, thread, async () => pushQueue(freeTarget, fn));
                }
                else {
                    console.debug('Reached worker thread capacity');
                    if (thread in this._actionQueueOutgoing) {
                        console.debug('Adding function to existing queue');
                        this._actionQueueOutgoing[thread].push(fn);
                    }
                    else {
                        console.debug('Creating new function queue');
                        this._actionQueueOutgoing[thread] = [fn];
                        this._actionQueueOutgoing[Order].push(thread);
                    }
                }
            }
            else {
                console.debug('Spawning new worker');
                // Create a new worker if there is an empty worker slot
                const target = {
                    thread,
                    active: true,
                    lastActivity: new Date(),
                    queue: (0, queue_1.default)({
                        autostart: false,
                        concurrency: 1,
                        timeout: 2000,
                    }),
                    id: this._workerPages.length,
                };
                void pushQueue(target, fn);
                this._workerPages.push(target);
                // Attach page
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
                const page = (await this._browser?.newPage());
                await this._setTarget(page, thread);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                target.page = page;
                // Handle worker replacement
                target.queue.on('end', async () => {
                    console.debug('Worker finished tasks');
                    target.active = false;
                    const next = this._actionQueueOutgoing[Order].shift();
                    if (!next) {
                        return;
                    }
                    await replaceWorker(target, next, async () => {
                        const outgoingQueue = this._actionQueueOutgoing[next];
                        delete this._actionQueueOutgoing[next];
                        outgoingQueue.forEach(async (fn) => pushQueue(target, fn));
                    });
                });
                // Enable queue
                target.queue.start();
                target.queue.autostart = true;
            }
        }
        return promise;
    }
    async getSession() {
        return this._masterPage.cookies();
    }
    async login(email, password) {
        console.log('Logging in...');
        const browser = (this._browser = await puppeteer_1.default.launch({
            headless: process.env.ENV === 'AWS' ? true : false,
            args: ['--no-sandbox'],
            //devtools: true
        }));
        const page = (this._masterPage = (await browser.pages())[0]);
        if (this.options.session) {
            await page.setCookie(...this.options.session);
        }
        await page.goto('https://m.facebook.com/login.php', {
            waitUntil: 'networkidle2',
        });
        // If there's a session (from cookie), then skip login
        if (page.url().startsWith('https://m.facebook.com/login.php')) {
            await (async function (cb, ...items) {
                return Promise.all(items.map(async (q) => page.$(q))).then(async (r) => {
                    const fields = [r[0], r[1]];
                    return cb(...fields);
                });
            })(async (emailField, passwordField) => {
                // Looks like we're unauthenticated
                await emailField?.type(email);
                await passwordField?.type(password);
                const navigationPromise = page.waitForNavigation();
                void page.$eval('button[name=login]', (elem) => {
                    // @ts-expect-error click does exist
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                    elem.click();
                });
                await navigationPromise;
                await page.goto('https://facebook.com/messages', {
                    waitUntil: 'networkidle2',
                });
            }, 'input[name=email]', 'input[name=pass]');
        }
        this.uid = (await this.getSession()).find((cookie) => cookie.name === 'c_user').value;
        // await page.goto(`https://messenger.com/t/${this.uid}`, {
        //   waitUntil: 'networkidle2'
        // })
        console.log(`Logged in as ${this.uid}`);
    }
    async _setTarget(page, target) {
        target = target.toString();
        const threadPrefix = 'https://facebook.com/messages/t/';
        let slug = page.url().substring(threadPrefix.length);
        if (target === this.threadHandleToID(slug)) {
            return null;
        }
        const response = await page.goto(`${threadPrefix}${target}`, {
            waitUntil: 'networkidle2',
        });
        slug = page.url().substr(threadPrefix.length);
        this._aliasMap[slug] = target;
        return response;
    }
    async sendMessage(target, data) {
        if (typeof data === 'number') {
            data = data.toString();
        }
        else if (typeof data === 'function') {
            data = await data();
        }
        void this._delegate(target, async function () {
            try {
                const inputField = await this.$('[role="textbox"]');
                if (inputField) {
                    // @ts-expect-error maybe should be done with eval
                    inputField.value = '';
                    if (data.includes('\n')) {
                        for (const line of data.split('\n')) {
                            await inputField.type(line);
                            this.keyboard.down('Shift');
                            this.keyboard.down('Enter');
                            this.keyboard.up('Shift');
                        }
                    }
                    else {
                        await inputField.type(data);
                    }
                }
                else {
                    throw new Error('Input field not found');
                }
                this.keyboard.press('Enter');
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    _stopListen(optionalCallback) {
        const client = this._masterPage?._client;
        if (typeof optionalCallback === 'function') {
            client.off('Network.webSocketFrameReceived', optionalCallback);
            this._listenFns = this._listenFns?.filter((callback) => callback !== optionalCallback) ?? [];
        }
        else {
            if (this._listenFns) {
                for (const callback of this._listenFns) {
                    client.off('Network.webSocketFrameReceived', callback);
                }
                this._listenFns = [];
            }
        }
    }
    listen(callback) {
        return this.listenRaw(async (messageObj) => await callback(messageObj));
    }
    listenRaw(callback) {
        if (this._listenFns === null) {
            this._listenFns = [];
            this._masterPage?._client.on('Network.webSocketFrameReceived', async ({ response }) => {
                const { payloadData } = response;
                if (payloadData.length > 16) {
                    try {
                        const payload = (0, atob_1.default)(payloadData.substring(12));
                        const json = JSON.parse(payload.substring(payload.indexOf('{')));
                        deltaLoop: for (const delta of json.deltas) {
                            switch (delta.class) {
                                case 'NewMessage':
                                    if (delta.messageMetadata.actorFbId === this.uid && !this.options.selfListen) {
                                        continue deltaLoop;
                                    }
                                    const newMessage = {
                                        body: delta.body || '',
                                        thread: Object.values(delta.messageMetadata.threadKey)[0],
                                        sender: delta.messageMetadata.actorFbId,
                                        timestamp: delta.messageMetadata.timestamp,
                                        messageId: delta.messageMetadata.messageId,
                                        attachments: delta.attachments,
                                    };
                                    if (this._listenFns) {
                                        for (const callback of this._listenFns) {
                                            this._messageQueueIncoming.push(async (finish) => {
                                                await callback(newMessage);
                                                finish && finish();
                                            });
                                        }
                                    }
                                    break;
                                case 'ClientPayload':
                                    const parsedPayload = JSON.parse(delta.payload.map((c) => String.fromCharCode(c)).join(''));
                                    const { deltaMessageReply: { message, repliedToMessage }, } = parsedPayload.deltas[0];
                                    const newReply = {
                                        messageId: message.messageMetadata.messageId,
                                        sender: message.messageMetadata.actorFbId,
                                        timestamp: message.messageMetadata.timestamp,
                                        thread: Object.values(message.messageMetadata.threadKey)[0],
                                        body: message.body || '',
                                        attachments: message.attachments,
                                        repliedToMessage: {
                                            messageId: repliedToMessage.messageMetadata.messageId,
                                            sender: repliedToMessage.messageMetadata.actorFbId,
                                            timestamp: repliedToMessage.messageMetadata.timestamp,
                                            thread: Object.values(repliedToMessage.messageMetadata.threadKey)[0],
                                            body: repliedToMessage.body,
                                            attachments: repliedToMessage.attachments,
                                        },
                                    };
                                    for (const callback of this._listenFns) {
                                        this._messageQueueIncoming.push(async (finish) => {
                                            await callback(newReply);
                                            finish && finish();
                                        });
                                    }
                            }
                        }
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
            });
        }
        if (this._listenFns.indexOf(callback) === -1) {
            this._listenFns.push(callback);
        }
        return () => this._stopListen(callback);
    }
    async sendImage(target, imagePathOrImagePaths) {
        if (!imagePathOrImagePaths) {
            return;
        }
        const images = Array.isArray(imagePathOrImagePaths) ? imagePathOrImagePaths : Array(imagePathOrImagePaths);
        return this._delegate(target, async function () {
            try {
                await this.$eval('aria/Remove attachment', (elem) => {
                    console.log(elem);
                    if (elem) {
                        elem.click();
                    }
                });
            }
            catch (e) {
                console.log('No attachments');
            }
            try {
                for (const imagePath of images) {
                    const uploadBtn = await this.$('input[type=file]');
                    await uploadBtn.uploadFile(imagePath);
                }
                this.keyboard.press('Enter');
            }
            catch (e) {
                console.log(e);
            }
        });
    }
}
exports.Client = Client;
