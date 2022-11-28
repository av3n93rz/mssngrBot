"use strict";
const TrelloAPI = require('trello');
const config = require('../.config');
const trello = new TrelloAPI(config.trello_key, config.trello_token);
const boardName = 'BearNet Bot';
let boardId = null;
let isReady = false;
async function init() {
    const boards = await trello.getBoards(config.trello_user);
    let board = boards.find(b => b.name == boardName);
    if (!board)
        board = await trello.addBoard(boardName);
    boardId = board.id;
    isReady = true;
}
async function getListId(listName) {
    const lists = await trello.getListsOnBoard(boardId);
    let list = lists.find(l => l.name === listName);
    if (!list)
        list = await trello.addListToBoard(boardId, listName);
    return list.id;
}
module.exports = function (api) {
    return {
        name: ['list'],
        admin: false,
        description: 'Lists!',
        onPreLoad: init,
        onFinishLoad: () => console.log('Trello API loaded!'),
        function: async function (messageObj, message) {
            if (!isReady)
                throw new Error('Command not ready yet');
            const listId = await getListId(messageObj.thread);
            async function view() {
                const cards = await trello.getCardsForList(listId);
                if (cards.length == 0) {
                    return 'No entries for this chat';
                }
                const results = [];
                for (let i = 0; i < cards.length; i++) {
                    results.push(`${i + 1}. ${cards[i].name}`);
                }
                return results.join('\n');
            }
            if (message.length == 0) {
                return await view();
            }
            const messages = message.split(' ');
            const action = messages[0];
            const content = messages.slice(1).join(' ');
            switch (action.toLowerCase()) {
                case 'add':
                    if (content.length == 0)
                        throw new Error('Supply an entry name!');
                    await trello.addCard(content.replace(/\r?\n/g, ''), null, listId);
                    return 'Added item!';
                case 'delete':
                case 'remove':
                    if (content.length == 0)
                        throw new Error('Supply an entry name!');
                    var cards = await trello.getCardsForList(listId);
                    var index = parseInt(content, 10);
                    if (index < 1 || index > cards.length || isNaN(index)) {
                        throw new Error('Invalid entry id');
                    }
                    await trello.deleteCard(cards[index - 1].id);
                    return 'Entry deleted!';
                case 'show':
                case 'view':
                    return await view();
                default:
                    throw new Error('Invalid command!');
            }
        }
    };
};
