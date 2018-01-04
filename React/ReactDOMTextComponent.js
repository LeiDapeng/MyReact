/**
 * 字符型节点实例
 * @param {*} text 
 */
function ReactDOMTextComponent(text) {
    this._currentElement = '' + text;
    this._rootNodeID = null;
}

/**
 * 字符型节点渲染函数
 * @param {*} rootID 节点唯一标示
 */
ReactDOMTextComponent.prototype.mountComponent = function (rootID) {
    this._rootNodeID = rootID;
    return `<span data-reactid='${rootID}'>${this._currentElement}</span>`;
}

/**
 * 字符型节点变更函数
 * @param {*} nextText 
 */
ReactDOMTextComponent.prototype.receiveComponent = function (nextText) {
    var nextStringText = '' + nextText;
    //跟以前保存的字符串比较
    if (nextStringText !== this._currentElement) {
        this._currentElement = nextStringText;
        //替换整个节点
        $('[data-reactid="' + this._rootNodeID + '"]').html(this._currentElement);

    }
}