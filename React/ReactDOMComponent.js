/**
 * reactDom初始化函数
 * @param {*} element 
 */
function ReactDOMComponent(element) {
    //当前element
    this._currentElement = element;
    //唯一标识
    this._rootNodeID = null;
}


/**
 * 节点内容渲染
 * @param {*} rootID 
 */
ReactDOMComponent.prototype.mountComponent = function (rootID) {
    //节点id
    this._rootNodeID = rootID;
    //传入参数
    var props = this._currentElement.props;
    //内容
    var content = '';
    //子节点
    var children = props.children || [];
    //子节点实例结合
    var childrenInstances = [];
    //缓存作用域
    var that = this;
    //属性
    var attrs = '';

    //拼凑出属性
    for (var propKey in props) {

        // //这里要做一下事件的监听，就是从属性props里面解析拿出on开头的事件属性的对应事件监听
        if (/^on[A-Za-z]/.test(propKey)) {
            var eventType = propKey.replace('on', '');
            //针对当前的节点添加事件代理,以_rootNodeID为命名空间
            $(document).delegate('[data-reactid="' + this._rootNodeID + '"]', eventType + '.' + this._rootNodeID, props[propKey]);

        }

        //对于children属性以及事件监听的属性不需要进行字符串拼接
        //事件会代理到全局。这边不能拼到dom上不然会产生原生的事件监听
        if (props[propKey] && propKey != 'children' && !/^on[A-Za-z]/.test(propKey)) {
            attrs += ' ' + propKey + '=' + props[propKey];
        }
    }
    //遍历所有子组件,并拼接返回内容
    children.forEach((child, key) => {
        //获取子节点实例
        var childComponentInstance = instantiateReactComponent(child);
        //唯一标识
        childComponentInstance._mountIndex = key;
        //缓存子节点实例
        childrenInstances.push(childComponentInstance);
        //拼接子节点id
        var currentId = that._rootNodeID + '.' + key;
        //字节内容
        var childMarkup = childComponentInstance.mountComponent(currentId);
        //拼接数据
        content += '' + childMarkup;
    });
    //缓存全局子节点实例集合
    this._renderedChildren = childrenInstances;
    //返回内容
    return `<${this._currentElement.type} data-reactid='${this._rootNodeID}' ${attrs}>${content}</${this._currentElement.type}>`;


}
/**
 * 节点内容变更
 * @param {*} nextElement 
 */
ReactDOMComponent.prototype.receiveComponent = function (nextElement) {
    //缓存之前的参数
    var lastProps = this._currentElement.props;
    //新的参数
    var nextProps = nextElement.props;
    //更新节点
    this._currentElement = nextElement;
    //需要单独的更新属性
    this._updateDOMProperties(lastProps, nextProps);
    //再更新子节点
    this._updateDOMChildren(nextProps.children);
}

//更新节点属性
ReactDOMComponent.prototype._updateDOMProperties = function (lastProps, nextProps) {
    var propKey;
    //遍历，当一个老的属性不在新的属性集合里时，需要删除掉。

    for (propKey in lastProps) {
        //新的属性里有，或者propKey是在原型上的直接跳过。这样剩下的都是不在新属性集合里的。需要删除
        if (nextProps.hasOwnProperty(propKey) || !lastProps.hasOwnProperty(propKey)) {
            continue;
        }
        //对于那种特殊的，比如这里的事件监听的属性我们需要去掉监听
        if (/^on[A-Za-z]/.test(propKey)) {
            var eventType = propKey.replace('on', '');
            //针对当前的节点取消事件代理
            $(document).undelegate('[data-reactid="' + this._rootNodeID + '"]', eventType, lastProps[propKey]);
            continue;
        }

        //从dom上删除不需要的属性
        $('[data-reactid="' + this._rootNodeID + '"]').removeAttr(propKey)
    }

    //对于新的属性，需要写到dom节点上
    for (propKey in nextProps) {
        //对于事件监听的属性我们需要特殊处理
        if (/^on[A-Za-z]/.test(propKey)) {
            var eventType = propKey.replace('on', '');
            //以前如果已经有，说明有了监听，需要先去掉
            lastProps[propKey] && $(document).undelegate('[data-reactid="' + this._rootNodeID + '"]', eventType, lastProps[propKey]);
            //针对当前的节点添加事件代理,以_rootNodeID为命名空间
            $(document).delegate('[data-reactid="' + this._rootNodeID + '"]', eventType + '.' + this._rootNodeID, nextProps[propKey]);
            continue;
        }

        if (propKey == 'children') continue;

        //添加新的属性，或者是更新老的同名属性
        $('[data-reactid="' + this._rootNodeID + '"]').prop(propKey, nextProps[propKey])
    }

}




//全局的更新深度标识
var updateDepth = 0;
//全局的更新队列，所有的差异都存在这里
var diffQueue = [];
/**
 * 
 * @param {*}  更新子节点
 */
ReactDOMComponent.prototype._updateDOMChildren = function (nextChildrenElements) {
    updateDepth++
    //_diff用来递归找出差别,组装差异对象,添加到更新队列diffQueue。
    this._diff(diffQueue, nextChildrenElements);
    updateDepth--
    if (updateDepth == 0) {
        //在需要的时候调用patch，执行具体的dom操作
        this._patch(diffQueue);
        diffQueue = [];
    }
}



//_diff用来递归找出差别,组装差异对象,添加到更新队列diffQueue。
ReactDOMComponent.prototype._diff = function (diffQueue, nextChildrenElements) {
    var self = this;
    //拿到之前的子节点的 component类型对象的集合,这个是在刚开始渲染时赋值的，记不得的可以翻上面
    //_renderedChildren 本来是数组，我们搞成map
    var prevChildren = flattenChildren(self._renderedChildren);
    //生成新的子节点的component对象集合，这里注意，会复用老的component对象
    var nextChildren = generateComponentChildren(prevChildren, nextChildrenElements);
    //重新赋值_renderedChildren，使用最新的。
    self._renderedChildren = []
    $.each(nextChildren, function (key, instance) {
        self._renderedChildren.push(instance);
    })


    var lastIndex = 0; //代表访问的最后一次的老的集合的位置
    var nextIndex = 0; //代表到达的新的节点的index

    //通过对比两个集合的差异，组装差异节点添加到队列中
    for (name in nextChildren) {
        if (!nextChildren.hasOwnProperty(name)) {
            continue;
        }

        var prevChild = prevChildren && prevChildren[name];
        var nextChild = nextChildren[name];


        //相同的话，说明是使用的同一个component,所以我们需要做移动的操作
        if (prevChild === nextChild) {


            //添加差异对象，类型：MOVE_EXISTING
            prevChild._mountIndex < lastIndex && diffQueue.push({
                parentId: self._rootNodeID,
                parentNode: $('[data-reactid=' + self._rootNodeID + ']'),
                type: UPATE_TYPES.MOVE_EXISTING,
                fromIndex: prevChild._mountIndex,
                toIndex: nextIndex
            })

            lastIndex = Math.max(prevChild._mountIndex, lastIndex);

        } else { //如果不相同，说明是新增加的节点
            //但是如果老的还存在，就是element不同，但是component一样。我们需要把它对应的老的element删除。
            if (prevChild) {
                //添加差异对象，类型：REMOVE_NODE
                diffQueue.push({
                    parentId: self._rootNodeID,
                    parentNode: $('[data-reactid=' + self._rootNodeID + ']'),
                    type: UPATE_TYPES.REMOVE_NODE,
                    fromIndex: prevChild._mountIndex,
                    toIndex: null
                })

                //如果以前已经渲染过了，记得先去掉以前所有的事件监听，通过命名空间全部清空
                if (prevChild._rootNodeID) {
                    $(document).undelegate('.' + prevChild._rootNodeID);
                }
                lastIndex = Math.max(prevChild._mountIndex, lastIndex);
            }

            //新增加的节点，也组装差异对象放到队列里
            //添加差异对象，类型：INSERT_MARKUP
            diffQueue.push({
                parentId: self._rootNodeID,
                parentNode: $('[data-reactid=' + self._rootNodeID + ']'),
                type: UPATE_TYPES.INSERT_MARKUP,
                fromIndex: null,
                toIndex: nextIndex,
                markup: nextChild.mountComponent() //新增的节点，多一个此属性，表示新节点的dom内容
            })
        }
        //更新mount的index
        nextChild._mountIndex = nextIndex;
        nextIndex++;
    }



























    //差异更新的几种类型
    var UPATE_TYPES = {
        MOVE_EXISTING: 1,
        REMOVE_NODE: 2,
        INSERT_MARKUP: 3
    }


    //普通的children是一个数组，此方法把它转换成一个map,key就是element的key,如果是text节点或者element创建时并没有传入key,就直接用在数组里的index标识
    function flattenChildren(componentChildren) {
        var child;
        var name;
        var childrenMap = {};
        for (var i = 0; i < componentChildren.length; i++) {
            child = componentChildren[i];
            name = child && child._currentelement && child._currentelement.key ? child._currentelement.key : i.toString(36);
            childrenMap[name] = child;
        }
        return childrenMap;
    }


    //主要用来生成子节点elements的component集合
    //这边注意，有个判断逻辑，如果发现是更新，就会继续使用以前的componentInstance,调用对应的receiveComponent。
    //如果是新的节点，就会重新生成一个新的componentInstance，
    function generateComponentChildren(prevChildren, nextChildrenElements) {
        var nextChildren = {};
        nextChildrenElements = nextChildrenElements || [];
        $.each(nextChildrenElements, function (index, element) {
            var name = element.key ? element.key : index;
            var prevChild = prevChildren && prevChildren[name];
            var prevElement = prevChild && prevChild._currentElement;
            var nextElement = element;

            //调用_shouldUpdateReactComponent判断是否是更新
            if (_shouldUpdateReactComponent(prevElement, nextElement)) {
                //更新的话直接递归调用子节点的receiveComponent就好了
                prevChild.receiveComponent(nextElement);
                //然后继续使用老的component
                nextChildren[name] = prevChild;
            } else {
                //对于没有老的，那就重新新增一个，重新生成一个component
                var nextChildInstance = instantiateReactComponent(nextElement, null);
                //使用新的component
                nextChildren[name] = nextChildInstance;
            }
        })

        return nextChildren;
    }



    //对于老的节点里有，新的节点里没有的那些，也全都删除掉
    for (name in prevChildren) {
        if (prevChildren.hasOwnProperty(name) && !(nextChildren && nextChildren.hasOwnProperty(name))) {
            //添加差异对象，类型：REMOVE_NODE
            diffQueue.push({
                parentId: self._rootNodeID,
                parentNode: $('[data-reactid=' + self._rootNodeID + ']'),
                type: UPATE_TYPES.REMOVE_NODE,
                fromIndex: prevChild._mountIndex,
                toIndex: null
            })
            //如果以前已经渲染过了，记得先去掉以前所有的事件监听
            if (prevChildren[name]._rootNodeID) {
                $(document).undelegate('.' + prevChildren[name]._rootNodeID);
            }
        }
    }
}




ReactDOMComponent.prototype._patch = function (updates) {
    var update;
    var initialChildren = {};
    var deleteChildren = [];
    for (var i = 0; i < updates.length; i++) {
        update = updates[i];
        if (update.type === UPATE_TYPES.MOVE_EXISTING || update.type === UPATE_TYPES.REMOVE_NODE) {
            var updatedIndex = update.fromIndex;
            var updatedChild = $(update.parentNode.children().get(updatedIndex));
            var parentID = update.parentID;

            //所有需要更新的节点都保存下来，方便后面使用
            initialChildren[parentID] = initialChildren[parentID] || [];
            //使用parentID作为简易命名空间
            initialChildren[parentID][updatedIndex] = updatedChild;


            //所有需要修改的节点先删除,对于move的，后面再重新插入到正确的位置即可
            deleteChildren.push(updatedChild)
        }

    }

    //删除所有需要先删除的
    $.each(deleteChildren, function (index, child) {
        $(child).remove();
    })


    //再遍历一次，这次处理新增的节点，还有修改的节点这里也要重新插入
    for (var k = 0; k < updates.length; k++) {
        update = updates[k];
        switch (update.type) {
            case UPATE_TYPES.INSERT_MARKUP:
                insertChildAt(update.parentNode, $(update.markup), update.toIndex);
                break;
            case UPATE_TYPES.MOVE_EXISTING:
                insertChildAt(update.parentNode, initialChildren[update.parentID][update.fromIndex], update.toIndex);
                break;
            case UPATE_TYPES.REMOVE_NODE:
                // 什么都不需要做，因为上面已经帮忙删除掉了
                break;
        }
    }
}


//用于将childNode插入到指定位置
function insertChildAt(parentNode, childNode, index) {
    var beforeChild = parentNode.children().get(index);
    beforeChild ? childNode.insertBefore(beforeChild) : childNode.appendTo(parentNode);
}