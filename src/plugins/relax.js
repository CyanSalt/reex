let instance = null

function construct(Vue, store) {
  const model = {
    data: store.states || {},
  }
  if (store.modules) {
    for (const [name, value] of Object.entries(store.modules)) {
      model.data[name] = construct(Vue, value)
    }
  }
  if (store.getters) {
    model.computed = store.getters
  }
  if (store.actions) {
    model.methods = store.actions
  }
  return new Vue(model)
}

function visit(source, name) {
  const props = name.split('.')
  const key = props[props.length - 1]
  let target = source
  for (const prop of props.slice(0, -1)) {
    target = target[prop]
  }
  return {target, key}
}

export function state(name) {
  return {
    get() {
      const {target, key} = visit(instance, name)
      return target[key]
    },
    set(value) {
      const {target, key} = visit(instance, name)
      target[key] = value
    }
  }
}

export function action(name) {
  return function (...args) {
    const {target, key} = visit(instance, name)
    return target[key](...args)
  }
}

export default {
  install(Vue, store) {
    instance = construct(Vue, store)
    if (!store.exports) return
    if (store.exports.prototype) {
      Vue.prototype[store.exports.prototype] = instance
    }
    if (store.exports.global) {
      window[store.exports.global] = instance
    }
  }
}
