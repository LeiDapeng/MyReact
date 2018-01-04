/**
 * 自定义标签
 */
var ReactClass = function () {}
//留给子类去继承覆盖
ReactClass.prototype.render = function () {}
//状态管理
ReactClass.prototype.setState = function (newState) {
    this._reactInternalInstance.receiveComponent(null, newState);
}