/**
 * 混合标签初始化函数
 * @param {*} element 节点
 */
function ReactCompositeComponent(element) {
    //当前节点
    this._currentElement = element;
    //节点id
    this._rootNodeID = null;
    //实例
    this._instance = null;
}
/**
 * 混合函数渲染方法
 * @param {*} rootID 唯一dom标示
 */
ReactCompositeComponent.prototype.mountComponent = function (rootID) {
    //唯一标示
    this._rootNodeID = rootID;
    //传入参数
    var publicProps = this._currentElement.props;
    //标签类型
    var ReactClass = this._currentElement.type;

    //通过传入的函数,获取一个新的实例
    var inst = new ReactClass(publicProps);
    //当前实例
    this._instance = inst;
    //缓存一份当前作用域对象
    inst._reactInternalInstance = this;

    //执行componentWillMount函数
    if (inst.componentWillMount) {
        inst.componentWillMount();
        //这里在原始的reactjs其实还有一层处理，就是  componentWillMount调用setstate，不会触发rerender而是自动提前合并，这里为了保持简单，就略去了
    }
    //调用render函数返回一个element对象,这里的render是传入的
    var renderedElement = this._instance.render();
    //根据类型工厂获取对应的实例
    var renderedComponentInstance = instantiateReactComponent(renderedElement);
    //缓存一份实例
    this._renderedComponent = renderedComponentInstance;

    //获取最终的内容
    var renderdMarkup = renderedComponentInstance.mountComponent(this._rootNodeID);

    $(document).on('mountReady', function () {
        inst.componentDidMount && inst.componentDidMount()
    });
    //返回渲染内容
    return renderdMarkup; 

}

//更新
ReactCompositeComponent.prototype.receiveComponent = function (nextElement, newState) {

    //如果接受了新的，就使用最新的element
    this._currentElement = nextElement || this._currentElement

    var inst = this._instance;
    //合并state
    var nextState = $.extend(inst.state, newState);
    var nextProps = this._currentElement.props;


    //改写state
    inst.state = nextState;


    //如果inst有shouldComponentUpdate并且返回false。说明组件本身判断不要更新，就直接返回。
    if (inst.shouldComponentUpdate && (inst.shouldComponentUpdate(nextProps, nextState) === false)) return;

    //生命周期管理，如果有componentWillUpdate，就调用，表示开始要更新了。
    if (inst.componentWillUpdate) inst.componentWillUpdate(nextProps, nextState);


    var prevComponentInstance = this._renderedComponent;
    var prevRenderedElement = prevComponentInstance._currentElement;
    //重新执行render拿到对应的新element;
    var nextRenderedElement = this._instance.render();


    //判断是需要更新还是直接就重新渲染
    //注意这里的_shouldUpdateReactComponent跟上面的不同哦 这个是全局的方法
    if (_shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
        //如果需要更新，就继续调用子节点的receiveComponent的方法，传入新的element更新子节点。
        prevComponentInstance.receiveComponent(nextRenderedElement);
        //调用componentDidUpdate表示更新完成了
        inst.componentDidUpdate && inst.componentDidUpdate();

    } else {
        //如果发现完全是不同的两种element，那就干脆重新渲染了
        var thisID = this._rootNodeID;
        //重新new一个对应的component，
        this._renderedComponent = this._instantiateReactComponent(nextRenderedElement);

        //重新生成对应的元素内容
        var nextMarkup = _renderedComponent.mountComponent(thisID);
        //替换整个节点
        $('[data-reactid="' + this._rootNodeID + '"]').replaceWith(nextMarkup);

    }

}