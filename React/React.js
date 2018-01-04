var React = {
    //唯一标示,用于之后操作时,获取组件
    nextReatRootIndex: 0,
    //将虚拟节点挂载到真是节点
    render: function (element, container) {
        //通过工厂模式获取对应类型事例
        var componentInstance = instantiateReactComponent(element);
        //调用实例生成最终html内容
        var markup = componentInstance.mountComponent(React.nextReatRootIndex++);
        //渲染内容
        container.innerHTML = markup;
    },
    //创建一个虚拟节点
    /**
     * type:节点类型
     * config:配置
     * children:子节点,允许多个
     */
    createElement: function (type, config, children) {
        var props = {},
            propName;
        config = config || {};
        //唯一标示
        var key = config.key || null;
        //遍历配置中所有属性给props赋值
        for (propName in config) {
            if (config.hasOwnProperty(propName) && propName !== 'key') {
                props[propName] = config[propName];
            }
        }
        //判断节点数目,传入参数数目减去前两个
        var childrenLength = arguments.length - 2;
        //如果只有一个节点,赋值
        if (childrenLength === 1) {
            props.children = [children]
        }
        //当包含多个节点时,循环赋值 
        else if (childrenLength > 1) {
            var childArray = Array(childrenLength);
            for (var i = 0; i < childrenLength; i++) {
                childArray[i] = arguments[i + 2];
            }
            props.children = childArray;
        }
        //返回一个新的虚拟dom
        return new ReactElement(type, key, props);


    },
    //创建一个组件
    createClass: function (spec) {
        //生命一个新的事例,props为传入配置,state为传入状态
        var Constructor = function (props) {
            this.props = props;
            this.state = this.getInitialState ? this.getInitialState() : null;
        }
        //原型继承，继承超级父类
        Constructor.prototype = new ReactClass();
        Constructor.prototype.constructor = Constructor;
        //spec
        $.extend(Constructor.prototype, spec);
        return Constructor;
    }
}