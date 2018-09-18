let instance = null

const context = {
  access(key) {
    return instance[key]
  },
  commit(key, value) {
    instance[key] = value
  },
  dispatch(method, payload) {
    return instance[method](payload)
  },
}

export function state(name) {
  return {
    get() {
      return context.access(name)
    },
    set(value) {
      return context.commit(name, value)
    }
  }
}

export function action(name) {
  return function (payload) {
    return context.dispatch(name, payload)
  }
}

export default {
  install(Vue, store) {
    instance = new Vue(store)
    Vue.prototype.$relax = context
  }
}
