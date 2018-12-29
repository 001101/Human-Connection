import gql from 'graphql-tag'
import jwt from 'jsonwebtoken'

export const state = () => {
  return {
    user: null,
    token: null,
    pending: false
  }
}

export const mutations = {
  SET_USER(state, user) {
    state.user = user || null
  },
  SET_TOKEN(state, token) {
    state.token = token || null
  },
  SET_PENDING(state, pending) {
    state.pending = pending
  }
}

export const getters = {
  isAuthenticated(state) {
    return !!state.token
  },
  isLoggedIn(state) {
    return !!(state.user && state.token)
  },
  pending(state) {
    return !!state.pending
  },
  isAdmin(state) {
    return !!state.user && state.user.role === 'admin'
  },
  isModerator(state) {
    return (
      !!state.user &&
      (state.user.role === 'admin' || state.user.role === 'moderator')
    )
  },
  user(state) {
    return state.user || {}
  },
  token(state) {
    return state.token
  }
}

export const actions = {
  async init({ commit }) {
    if (process.client) {
      return
    }
    const token = this.app.$apolloHelpers.getToken()
    if (!token) {
      return
    }

    const user = await jwt.verify(token, 'b/&&7b78BF&fv/Vd')
    if (user.id) {
      commit('SET_USER', {
        id: user.id,
        name: user.name,
        slug: user.slug,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        locationId: user.locationId,
        about: user.about
      })
      commit('SET_TOKEN', token)
    }
  },
  async check({ commit, dispatch, getters }) {
    if (!this.app.$apolloHelpers.getToken()) {
      await dispatch('logout')
    }
    return getters.isLoggedIn
  },
  refresh({ state, commit }, { id, name, locationId, about, avatar }) {
    if (!state.user.id || id !== state.user.id) {
      return
    }
    commit('SET_USER', {
      id: state.user.id, // do not change
      name: name || state.user.name,
      slug: state.user.slug, // do not change
      email: state.user.email, // do not change
      avatar: avatar || state.user.avatar,
      role: state.user.role,
      locationId: locationId || state.user.locationId,
      about: about || state.user.about
    })
  },
  async login({ commit }, { email, password }) {
    commit('SET_PENDING', true)
    try {
      const res = await this.app.apolloProvider.defaultClient
        .mutate({
          mutation: gql(`
          mutation($email: String!, $password: String!) {
            login(email: $email, password: $password) {
              id
              name
              slug
              email
              avatar
              role
              locationId
              about
              token
            }
          }
        `),
          variables: { email, password }
        })
        .then(({ data }) => data && data.login)

      await this.app.$apolloHelpers.onLogin(res.token)
      commit('SET_TOKEN', res.token)
      const userData = Object.assign({}, res)
      delete userData.token
      commit('SET_USER', userData)
    } catch (err) {
      throw new Error(err)
    } finally {
      commit('SET_PENDING', false)
    }
  },
  async logout({ commit }) {
    commit('SET_USER', null)
    commit('SET_TOKEN', null)
    return this.app.$apolloHelpers.onLogout()
  },
  register(
    { dispatch, commit },
    { email, password, inviteCode, invitedByUserId }
  ) {},
  async patch({ state, commit, dispatch }, data) {},
  resendVerifySignup({ state, dispatch }) {},
  resetPassword({ state }, data) {},
  setNewPassword({ state }, data) {}
}
