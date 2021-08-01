import { isFunction, isPlainObject, upperFirst, camelCase } from "lodash";
import Vue from "vue";

export function isComponentConstructor(component) {
  return isFunction(component) && component.super === Vue;
}
export function getComponent(componentName) {
  const { components } = Vue.options;
  return (
    components[componentName] ||
    components[camelCase(componentName)] ||
    components[upperFirst(camelCase(componentName))]
  );
}
export function getComponentModel(comp) {
  if (!comp) return;
  if (typeof comp === "string") {
    const target = getComponent(comp);
    if (!target) return;
    comp = target;
  }
  return isComponentConstructor(comp) ? comp.options?.model : comp.model;
}
/**
 * 将字符串形式的 style 转为 对象格式
 * @param {string} styleString 字符串格式的 style
 * @returns {Object}
 */
function objectifyStyle(styleString) {
  return styleString.split(/\s*;\s*/g).reduce((obj, item) => {
    if (!item) return obj;
    let [key, val] = item.split(/\s*:\s*/g);
    // -分隔变成小驼峰XX@
    key = key.replace(/-\w/g, (match) => match.slice(-1).toLocaleUpperCase());
    obj[key] = val;
    return obj;
  }, {});
}
const isObjectStyle = (style) => isPlainObject(style);
/**
 * 生成高阶组件(函数式组件)
 * 函数组件没有生命周期、无状态（没有响应式数据），无实例（无this上下文）、渲染开销低，缺乏持久化实例（不会出现在Vue devtools组件树里）
 * @param {Object} WrappedComponent 被包裹的对象
 * @param {Object} params props
 * @param {Object} listeners 监听函数
 */
export default function FunctionalHocComponent(
  WrappedComponent,
  params,
  listeners
) {
  let {
    class: classParam = "",
    style: styleParam = "",
    ...resetParams
  } = params || {};
  if (typeof styleParam === "string") {
    styleParam = objectifyStyle(styleParam);
  }
  return {
    functional: true,
    model: getComponentModel(WrappedComponent),
    name:
      typeof WrappedComponent === "string"
        ? WrappedComponent
        : WrappedComponent.name,
    // props: WrappedComponent.props, // props可忽略，函数式组件会把组件上的所有特性解析为 props。
    render(h, context) {
      const { on, attrs, class: className = "", style = {} } = context.data;
      const newContextData = {
        ...context.data,
        // 下面的合并顺序不能变，保证覆盖规则, hoc 传递的属性比 render 时传递的属性优先级要低
        class: [classParam, className],
        style: {
          ...styleParam,
          ...(isObjectStyle(style) ? style : objectifyStyle(style)),
        },
        attrs: { ...resetParams, ...attrs },
        on: { ...listeners, ...on },
      };
      return h(WrappedComponent, newContextData, context.children);
    },
  };
}
/**
 * 获取组件的props
 * 深度优先 递归合并 mixins 中的props
 * TODO: 后续换成广度优先？
 * @param {Object} component vue组件对象
 */
function getComponentProps(component) {
  const options = isComponentConstructor(component)
    ? component.options
    : component;
  if (!options) return {};
  const { props = {}, mixins } = options;
  // 以外部组件的props为主，mixins中相同prop无法覆盖外部组件的prop
  return Array.isArray(mixins) && mixins.length
    ? mixins.reduce(
        (fProps, mixin) => ({ ...getComponentProps(mixin), ...fProps }),
        props
      )
    : props;
}
/**
 * 生成高阶组件（正常组件）
 * 支持生命周期、与普通组件无异，开销更大
 * @param {Object} WrappedComponent 被包裹的对象
 * @param {Object} params props
 * @param {Object} listeners 监听函数
 */
export function PureHocComponent(WrappedComponent, params, listeners) {
  if (!isPlainObject(WrappedComponent) && !isFunction(WrappedComponent)) {
    console.error(
      "PureHocComponent 方法传入的组件必须是一个纯对象或者组件函数"
    );
    return {
      render(h) {
        return h("p", "this is error component by `PureHocComponent` method.");
      },
    };
  }
  // 处理包裹元素存在mixins的情况
  // 从而拿到正确的props
  const props = getComponentProps(WrappedComponent);
  let {
    class: classParam = "",
    style: styleParam = "",
    name = "",
    ...resetParams
  } = params || {};
  if (typeof styleParam === "string") {
    styleParam = objectifyStyle(styleParam);
  }
  return {
    name:
      name ||
      "Hoc" +
        upperFirst(
          typeof WrappedComponent === "string"
            ? WrappedComponent
            : WrappedComponent.name
        ),
    props,
    render(h) {
      const slots = Object.keys(this.$slots)
        .reduce((arr, key) => arr.concat(this.$slots[key]), [])
        .map((vnode) => {
          vnode.context = this._self;
          return vnode;
        });
      return h(
        WrappedComponent,
        {
          // 下面的合并顺序不能变，保证覆盖规则, hoc 传递的属性比 render 时传递的属性优先级要低
          // 不用 this.$props 而用 this.$options.propsData
          // this.$options.propsData 代表模板标签传入的 props
          // this.$props 会将声明 props 的 defaultValue 跟 propsData 进行合并
          // 因为生成是一个新组件，模板标签传入的 props 权重要比 Hoc 第二个参数 params 要大，要覆盖规则
          // 如果采用 $props，因其有默认值，{...resetParams, ...this.$props} this.$props 会把 resetParams 覆盖，而此时其实根本没传入 props，无需覆盖
          // 所以只取模板标签传入的 props: this.$options.propsData
          props: { ...resetParams, ...this.$options.propsData },
          on: { ...listeners, ...this.$listeners },
          attrs: { ...resetParams, ...this.$attrs },
          scopedSlots: this.$scopedSlots,
          class: classParam,
          style: styleParam,
        },
        slots
      );
    },
  };
}
/**
 * any
 * @param {any} component - 组件
 * @param {any} defaultData - 默认设置
 */
export function createHocFn(component, params, listeners) {
  const defaultComponent = FunctionalHocComponent(component, params, listeners);
  const hocFn = (config) =>
    FunctionalHocComponent(
      component,
      { ...(params || {}), ...config },
      listeners
    );
  defaultComponent.config = hocFn;
  return defaultComponent;
}
