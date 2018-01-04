/**
 * react实例工厂
 * @param {*} node 虚拟节点
 */
function instantiateReactComponent(node) {
    //字符或数字节点
    if (typeof node === 'string' || typeof node === 'number') {
        return new ReactDOMTextComponent(node);
    }
    //浏览器支持的don标签
    else if (typeof node === 'object' && typeof node.type === 'string') {
        return new ReactDOMComponent(node);
    }
    //自定义标签
    else if (typeof node === 'object' && typeof node.type === 'function') {
        return new ReactCompositeComponent(node);
    }
}

//用来判定两个element需不需要更新
//这里的key是我们createElement的时候可以选择性的传入的。用来标识这个element，当发现key不同时，我们就可以直接重新渲染，不需要去更新了。
var _shouldUpdateReactComponent = function (prevElement, nextElement) {
    if (prevElement != null && nextElement != null) {
        var prevType = typeof prevElement;
        var nextType = typeof nextElement;
        if (prevType === 'string' || prevType === 'number') {
            return nextType === 'string' || nextType === 'number';
        } else {
            return nextType === 'object' && prevElement.type === nextElement.type && prevElement.key === nextElement.key;
        }
    }
    return false;
}