/**
 * 虚拟dom
 * @param {*} type 标签的类型
 * @param {*} key 标签的唯一标示
 * @param {*} props 传入的配置
 */
function ReactElement(type, key, props) {
    this.type = type;
    this.key = key;
    this.props = props;
}